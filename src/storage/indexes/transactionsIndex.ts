import type { Uint256 } from "low-level";
import { IndexDB } from "../leveldb/indexDB";
import { LevelDBEncoders } from "../leveldb/encoders";
import type { StorageBackend } from "../backend/exports/index.js";

interface ITransactionsIndexDB extends StorageBackend.IChainStore<Uint256, any> {
    exists(txHash: Uint256): Promise<boolean>;
    del(txHash: Uint256): Promise<void>;
}

export class TransactionsIndexDB extends IndexDB<Uint256, any, Uint256> implements ITransactionsIndexDB {

    constructor() {
        super("/indexes/transactions", {
            keyEncoding: LevelDBEncoders.Uint256,
            valueEncoding: LevelDBEncoders.Uint256
        });
    }

    async set(txHash: Uint256, blockHash: Uint256, indexInPayload: number) {

    }

    async get(txHash: Uint256) {
        return await this.level.get(txHash) || null;
    }
    
}

