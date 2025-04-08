import { BlockDB } from "./blocks";
import { ChainstateStore } from "./chainstate";
import { SmartContractStateDB } from "./state/smart-contract";
import { MinterDB } from "./state/minters";
import { WalletDB } from "./state/wallets";

export { BlockDB as Blocks }
export { WalletDB as Wallets }
export { MinterDB as Minters }
export { SmartContractStateDB as SmartContractStates }
export { ChainstateStore as ChainState }

export default class StorageAPI {

    constructor(
        readonly blocks: BlockDB,
        readonly wallets: WalletDB,
        readonly minters: MinterDB,
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
}

