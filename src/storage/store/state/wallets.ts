import { AddressHex } from "@advena/common/models/address";
import type { StorageAPI } from "../../exports/index.js";
import { Wallet } from "@advena/common/models/wallet";
import type { Uint64 } from "low-level";
import { AbstractChainStateStore } from "../abstractStore.js";
import type { Ref } from "ptr.js";

export class WalletStateStore extends AbstractChainStateStore<AddressHex, Wallet, StorageAPI.IWallets> {

    constructor(isMainChain: Ref<boolean>, storage: StorageAPI.IWallets) {
        super(isMainChain, storage, AddressHex, Wallet as any);
    }

    async set(wallet: Wallet) {
        if (this.isMainChain == true) {
            await this.storage.set(wallet);
        } else {
            const type = await this.storage.exists(wallet.owner) ? "modified" : "added";
            this.tempStorage.set(wallet.owner, wallet, type);
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
