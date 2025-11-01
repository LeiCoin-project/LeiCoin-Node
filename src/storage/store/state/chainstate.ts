import type { StorageAPI } from "../../exports/index.js";
import { MinterStateStore } from "./minters.js";
import { WalletStateStore } from "./wallets.js";
import type { Ref } from "ptr.js";

export class ChainStateStore {

    constructor(
        readonly isMainChain: Ref<boolean>,
        protected readonly storage: StorageAPI.ChainState,
        readonly wallets: WalletStateStore,
        readonly minters: MinterStateStore,
    ) {}

    static create(isMainChain: Ref<boolean>, chainstateAPI: StorageAPI.ChainState, walletAPI: StorageAPI.IWallets, minterAPI: StorageAPI.IMinters) {
        return new ChainStateStore(
            isMainChain,
            chainstateAPI,
            new WalletStateStore(isMainChain, walletAPI),
            new MinterStateStore(isMainChain, minterAPI),
        );
    }

}
