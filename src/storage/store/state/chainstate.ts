import type { StorageBackend } from "../../backend/exports/index.js";
import { MinterStateStore } from "./minters.js";
import { WalletStateStore } from "./wallets.js";
import type { Ref } from "ptr.js";

export class ChainStateStore {

    constructor(
        readonly isMainChain: Ref<boolean>,
        protected readonly storage: StorageBackend.ChainState,
        readonly wallets: WalletStateStore,
        readonly minters: MinterStateStore,
    ) {}

    static create(isMainChain: Ref<boolean>, chainstateAPI: StorageBackend.ChainState, walletAPI: StorageBackend.WalletDB.Abstract, minterAPI: StorageBackend.MinterDB.Abstract) {
        return new ChainStateStore(
            isMainChain,
            chainstateAPI,
            new WalletStateStore(isMainChain, walletAPI),
            new MinterStateStore(isMainChain, minterAPI),
        );
    }

}
