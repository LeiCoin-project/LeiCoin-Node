import { type IBlockDB, BlockDB } from "./blocks";
import { type IMinterDB, MinterDB } from "./state/minters";
import { type IWalletDB, WalletDB } from "./state/wallets";
import { ChainstateStore } from "./chainstate";
import { SmartContractStateDB } from "./state/smart-contract";
import type { AbstractRangeIndexes, LevelRangeIndexes } from "./leveldb/rangeIndexes";
import type { Uint, Uint64 } from "low-level";

export { BlockDB as Blocks, type IBlockDB as IBlocks };
export { WalletDB as Wallets, type IWalletDB as IWallets };
export { MinterDB as Minters, type IMinterDB as IMinters };

export { SmartContractStateDB as SmartContractStates }
export { ChainstateStore as ChainState }

export default class StorageAPI {

    constructor(
        readonly blocks: IBlockDB,
        readonly wallets: IWalletDB,
        readonly minters: IMinterDB,
        readonly scstates: SmartContractStateDB,
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
    getDBSize(): Uint64;
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