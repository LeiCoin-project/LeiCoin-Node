import type { Uint256 } from "low-level";
import { IndexDB } from "../leveldb/indexDB";
import { LevelDBEncoders } from "../leveldb/encoders";
import type { StorageAPI } from "../api";

interface ITransactionsIndexDB extends StorageAPI.IChainStore<Uint256, any> {
    exists(txHash: Uint256): Promise<boolean>;
    del(txHash: Uint256): Promise<void>;
}

export class TransactionsIndexDB extends IndexDB<Uint256, any, Uint256> implements ITransactionsIndexDB {

    constructor() {
        super("/indexes/transactions", LevelDBEncoders.Uint256);
    }

    async set(txHash: Uint256, blockHash: Uint256, indexInPayload: number) {

    }

    async get(txHash: Uint256) {
        return await this.level.get(txHash);
    }
    
}

