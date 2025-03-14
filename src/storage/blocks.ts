import { CB } from "@leicoin/utils/callbacks";
import { cli } from "@leicoin/cli";
import { StorageUtils } from "./utils.js";
import { Uint, Uint64 } from "low-level";
import { Block } from "@leicoin/common/models/block";
import { LevelBasedStorage } from "./leveldb/levelBasedStorage.js";
import { LevelDBEncoders } from "./leveldb/encoders.js";
import { LevelDB } from "./leveldb/index.js";

export class BlockDB extends LevelBasedStorage {

    protected readonly path = "/blocks";

    //protected level: LevelDB<InstanceType<typeof this.levelKeyEncoder>, InstanceType<typeof this.levelKeyEncoder>> = null as any;

    protected readonly levelKeyEncoder = Uint64;

    async add(block: Block, overwrite = false) {

        if (!overwrite) {
            if (await this.level.has(block.index)) {
                cli.data.info(`Block ${blockIndex} already exists and cannot be overwritten.`);
                return false;
            }
        }

        this.level.put(block.index, block.encodeToHex());

        const blockIndex = block.index.toBigInt().toString();
        try {
            const blockFilePath = `/blocks/${blockIndex}.lcb`;
            // Check if the block file already exists.
            if (!StorageUtils.existsPath(blockFilePath, this.chain) || overwrite) {
                // Write the block data to the block file.
                StorageUtils.writeFile(blockFilePath, this.chain, block.encodeToHex());
                return { cb: CB.SUCCESS };
            } else {
                cli.data.info(`Block ${blockIndex} in Chain: ${this.chain} already exists and cannot be overwritten.`);
                return { cb: CB.ERROR };
            }
        } catch (err: any) {
            cli.data.error(`Error writing block ${blockIndex}: ${err.stack}.`);
            return { cb: CB.ERROR };
        }
    }

    public get(index: Uint64 | string) {
        const blockIndex = index instanceof Uint64 ? index.toBigInt().toString() : index;
        try {
            const blockFilePath = `/blocks/${blockIndex}.lcb`;
            if (StorageUtils.existsPath(blockFilePath, this.chain)) {
                const hexData = StorageUtils.readFile(blockFilePath, this.chain);
                return {cb: CB.SUCCESS, data: Block.fromDecodedHex(hexData) as Block | null};
            } else {
                //cli.data_message.error(`Block ${blockIndex} in Fork ${fork} was not found.`);
                return {cb: CB.NONE};
            }
        } catch (err: any) {
            cli.data.error(`Error reading block ${blockIndex}: ${err.stack}.`);
            return {cb: CB.ERROR};
        }
    }


    /**
     * WARNING: Deleting Blocks from a chain is risky and should be done with caution. Dont use this method unless you know what you are doing.
     */
    public delete(index: Uint64 | string, silent = false) {
        const blockIndex = index instanceof Uint64 ? index.toBigInt().toString() : index;
        try {
            const blockFilePath = `/blocks/${blockIndex}.lcb`;
            if (StorageUtils.existsPath(blockFilePath, this.chain)) {
                StorageUtils.delFile(blockFilePath, this.chain);
                return {cb: CB.SUCCESS};
            } else {
                if (!silent) {
                    cli.data.error(`Cant Block ${blockIndex} in Chain: ${this.chain}. Block was not found.`);
                }
                return {cb: CB.NONE};
            }
        } catch (err: any) {
            cli.data.error(`Error deleting block ${blockIndex}: ${err.stack}.`);
            return {cb: CB.ERROR};
        }
    }

    /*public getBlockInForks(index: Number, hash: String) {
    
        const forksDirectory = BCUtils.getBlockchainDataFilePath('/forks/');
    
        try {
            const forksFolders = fs.readdirSync(forksDirectory);
        
            for (const folder of forksFolders) {
                const folderPath = path.join(forksDirectory, folder);
                const blocksFolder = path.join(folderPath, 'blocks');
            
                if (fs.existsSync(blocksFolder)) {
                    const blockFilePath = path.join(blocksFolder, `${index}.json`);
            
                    if (fs.existsSync(blockFilePath)) {
                    const blockData = JSON.parse(fs.readFileSync(blockFilePath, 'utf-8'));
            
                        if (blockData.hash === hash) {
                            // Found a block with matching index and hash
                            return {cb: Callbacks.SUCCESS, data: blockData};
                        }
                    }
                }
            }
        
            // Block not found in any fork
            return {cb: Callbacks.NONE};
        } catch (err: any) {
            cli.data_message.error(`Error reading Block ${index} ${hash} in Forks: ${err.stack}`);
            return {cb: Callbacks.ERROR};
        }
    }*/

}

