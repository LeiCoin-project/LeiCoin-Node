import { type IBlockDB, BlockLevelBackend } from "./backends/blocks";
import { type IMinterDB, MinterLevelBackend } from "./backends/state/minters";
import { type IWalletDB, WalletLevelBackend } from "./backends/state/wallets";
import { ChainstateStore } from "./chainstate";
import { SmartContractStateLevelBackend } from "./backends/state/smart-contract";
import type { AbstractRangeIndexes } from "./leveldb/rangeIndexes";
import type { Uint } from "low-level";

export { BlockLevelBackend as Blocks, type IBlockDB as IBlocks };
export { WalletLevelBackend as Wallets, type IWalletDB as IWallets };
export { MinterLevelBackend as Minters, type IMinterDB as IMinters };

export { SmartContractStateLevelBackend as SmartContractStates }
export { ChainstateStore as ChainState }

export default class StorageAPI {

    constructor(
        readonly blocks: IBlockDB,
        readonly wallets: IWalletDB,
        readonly minters: IMinterDB,
        readonly scstates: SmartContractStateLevelBackend,
        readonly chainstate: ChainstateStore
    ) {}

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