import { BlockDB } from "./blocks";
import { ChainstateStore } from "./chainstate";
import { SmartContractStateDB } from "./state/smart-contract";
import { MinterDB } from "./state/minters";
import { WalletDB } from "./state/wallets";

export class StorageAPI {

    constructor(
        readonly blocks: BlockDB,
        readonly wallets: WalletDB,
        readonly minters: MinterDB,
        readonly scstates: SmartContractStateDB,
        readonly chainstate: ChainstateStore
    ) {}

}

export namespace StorageAPI {
    export const Blocks = BlockDB;
    export const Wallets = WalletDB;
    export const Minters = MinterDB;
    export const SmartContractStates = SmartContractStateDB;
    export const ChainState = ChainstateStore;

    export type Blocks = BlockDB;
    export type Wallets = WalletDB;
    export type Minters = MinterDB;
    export type SmartContractStates = SmartContractStateDB;
    export type ChainState = ChainstateStore;

    export interface IChainStore<K, V> {
        get(key: K): Promise<V | null>;
        exists(key: K): Promise<boolean>;
        del(key: K): Promise<void>;
    }

    export interface IChainStateStore<K, V> extends IChainStore<K, V> {
        set(value: V): Promise<void>;
    }
}