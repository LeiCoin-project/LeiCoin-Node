import { AddressHex } from "@leicoin/common/models/address";
import type { StorageAPI } from "../api";
import type { Wallet } from "@leicoin/common/models/wallet";
import type { Uint64 } from "low-level";
import { AbstractChainStateStore } from "./abstractStore";

export class WalletStateStore extends AbstractChainStateStore<AddressHex, Wallet, StorageAPI.Wallets> {

    constructor(isMainChain: boolean, storage: StorageAPI.Wallets) {
        super(isMainChain, storage, AddressHex);
    }

    async set(wallet: Wallet) {
        if (this.isMainChain) {
            await this.storage.set(wallet);
        } else {
            this.tempStorage.set(wallet.owner, wallet);
        }
    }

    async addMoney(address: AddressHex, amount: Uint64) {
        const wallet = await this.get(address);

        wallet.addMoney(amount);
        await this.set(wallet);
    }

    async subtractMoney(address: AddressHex, amount: Uint64) {
        const wallet = await this.get(address);

        const result = wallet.subtractMoneyIFPossible(amount);
        if (!result) return false;

        await this.set(wallet);
        return true;
    }

}
