import { type IBlockBodyDB, type IBlockHeaderDB, BlockBodyLevelBackend, BlockHeaderLevelBackend } from "../blocks";
import { type IMinterDB, MinterLevelBackend } from "../state/minters";
import { type IWalletDB, WalletLevelBackend } from "../state/wallets";
import { ChainstateStore } from "../../chainstate";
import { SmartContractStateLevelBackend } from "../state/smart-contract";
import type { AbstractRangeIndexes } from "../../leveldb/rangeIndexes";
import type { Uint } from "low-level";

export { SmartContractStateLevelBackend as SmartContractStateLevelBackend }
export { ChainstateStore as ChainState }

/*
export class StorageBackend {

    constructor(
        readonly blocks: IBlockDB,
        readonly wallets: IWalletDB,
        readonly minters: IMinterDB,
        readonly scstates: SmartContractStateLevelBackend,
        readonly chainstate: ChainstateStore
    ) {}

}
*/

export namespace BlockDB {

    export namespace Headers {
        export const LevelBased = BlockHeaderLevelBackend;
        export type Abstract = IBlockHeaderDB;
    }

    export namespace Bodies {
        export const LevelBased = BlockBodyLevelBackend;
        export type Abstract = IBlockBodyDB;
    }
}

export namespace WalletDB {
    export const LevelBased = WalletLevelBackend;
    export type Abstract = IWalletDB;
}

export namespace MinterDB {
    export const LevelBased = MinterLevelBackend;
    export type Abstract = IMinterDB;
}

export interface IChainStore<K, V> {
    get(key: K): Promise<V | null>;
    exists(key: K): Promise<boolean>;
    del(key: K): Promise<void>;
}

export interface IChainStateStore<K, V> extends IChainStore<K, V> {
    set(value: V): Promise<void>;
    createKeyStream(options?: Types.Stream.CreateOptions<Uint>): Types.Stream<Uint>;
}

export interface IChainStateStoreWithIndexes<K, V> extends IChainStateStore<K, V> {
    getIndexes(): AbstractRangeIndexes<Uint>;
    getDBSize(): number;
}

export namespace Types {

    export namespace Stream {
        export type CreateOptions<T> = {
            gte?: T | undefined;
            lte?: T | undefined;
        };
    }
    export type Stream<T> = AsyncIterable<T> & {
        destroy(): void;
    };
    
}