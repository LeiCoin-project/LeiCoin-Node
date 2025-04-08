import { Uint256, Uint64 } from "low-level";
import { IndexDB } from "../leveldb/indexDB";
import { LevelDBEncoders } from "../leveldb/encoders";
import type { StorageAPI } from "../index.js";

interface IBlockIndexDB extends StorageAPI.IChainStore<Uint64, Uint256> {
    exists(index: Uint64): Promise<boolean>;
    del(index: Uint64): Promise<void>;
}

export class BlockIndexDB extends IndexDB<Uint64, Uint256, Uint64, Uint256> implements IBlockIndexDB {

    constructor() {
        super("/indexes/block", LevelDBEncoders.Uint64, LevelDBEncoders.Uint256);
    }

    async set(index: Uint64, blockHash: Uint256) {
        return await this.level.put(index, blockHash);
    }

    async get(index: Uint64) {
        return await this.level.get(index);
    }

}
