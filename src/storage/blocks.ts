import { type Uint64 } from "low-level";
import { Block } from "@leicoin/common/models/block";
import { LevelBasedStorage } from "./leveldb/levelBasedStorage.js";
import { LevelDBEncoders } from "./leveldb/encoders.js";

export class BlockDB extends LevelBasedStorage<Uint64> {

    protected readonly path = "/blocks";

    protected readonly levelKeyEncoder = LevelDBEncoders.Uint64;

    async add(block: Block, overwrite = false) {

        if (!overwrite) {
            if (await this.level.has(block.index)) {
                return false;
            }
        }

        await this.level.put(block.index, block.encodeToHex());
        return true;
    }

    async get(index: Uint64) {
        const raw = await this.level.safe_get(index);
        if (!raw) return null;
        return Block.fromDecodedHex(raw);
    }

    /**
     * WARNING: Deleting Blocks from a chain is risky and should be done with caution. Dont use this method unless you know what you are doing.
     */
    public delete(index: Uint64) {
        return this.level.safe_del(index);
    }

}

