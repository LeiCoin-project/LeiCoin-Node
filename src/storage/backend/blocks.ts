import { Uint64 } from "low-level";
import { BlockHeader, ExecutedBlock, ExecutedBlockBody } from "@advena/common/models/block";
import { LevelBasedStorage } from "../leveldb/levelBasedStorage.js";
import { LevelDBEncoders } from "../leveldb/encoders.js";

export interface IBlockHeaderDB {
    add(blockHeader: BlockHeader, overwrite?: boolean): Promise<boolean>;
    get(index: Uint64): Promise<BlockHeader | null>;
    getHead(): Promise<BlockHeader>;
    exists(index: Uint64): Promise<boolean>;
    /**
     * WARNING: Deleting Blocks from a chain is risky and should be done with caution. Dont use this method unless you know what you are doing.
     */
    del(index: Uint64): Promise<void>;
}

export interface IBlockBodyDB {
    add(index: Uint64, blockBody: ExecutedBlockBody, overwrite?: boolean): Promise<boolean>;
    get(index: Uint64): Promise<ExecutedBlockBody | null>;
    exists(index: Uint64): Promise<boolean>;
    /**
     * WARNING: Deleting Blocks from a chain is risky and should be done with caution. Dont use this method unless you know what you are doing.
     */
    del(index: Uint64): Promise<void>;
}

export class BlockHeaderLevelBackend extends LevelBasedStorage<Uint64, BlockHeader, Uint64> implements IBlockHeaderDB {
    
    constructor() {
        super("/blocks/headers", {
            keyEncoding: LevelDBEncoders.Uint64
        });
    }

    async add(blockHeader: BlockHeader, overwrite = false) {
        if (!overwrite) {
            if (await this.level.has(blockHeader.index)) {
                return false;
            }
        }
        await this.level.put(blockHeader.index, blockHeader.encodeToHex());
        return true;
    }

    async getHead() {
        const headIndex = (await this.level.keys({ gte: Uint64.from(0), reverse: true, limit: 1}).all())[0]
        if (!headIndex) {
            throw new Error("Blockchain has no Blocks")
        }
        const header = await this.get(headIndex);
        if (!header) {
            throw new Error("Blockchain has no Blocks")
        }
        return header;
    }

    async get(index: Uint64) {
        const raw = await this.level.get(index);
        if (!raw) return null;
        return BlockHeader.fromDecodedHex(raw);
    }


}


export class BlockBodyLevelBackend extends LevelBasedStorage<Uint64, ExecutedBlockBody, Uint64> implements IBlockBodyDB {
    
    constructor() {
        super("/blocks/bodies", {
            keyEncoding: LevelDBEncoders.Uint64
        });
    }

    // async add(index: Uint64, blockBody: ExecutedBlockBody, overwrite = false) {
    //     if (!overwrite) {
    //         if (await this.level.has(index)) {
    //             return false;
    //         }
    //     }
    //     await this.level.put(index, blockBody.encodeToHex());
    //     return true;
    // }

    // async get(index: Uint64) {
    //     const raw = await this.level.get(index);
    //     if (!raw) return null;
    //     return ExecutedBlockBody.fromDecodedHex(raw);
    // }

}
