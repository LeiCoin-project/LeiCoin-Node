import { AddressHex } from "@advena/common/models/address";
import type { StorageBackend } from "../../backend/exports/index.js";
import { Wallet } from "@advena/common/models/wallet";
import type { Uint64 } from "low-level";
import { AbstractChainStateStore } from "../abstractStore.js";
import type { Ref } from "ptr.js";

export class WalletStateStore extends AbstractChainStateStore<AddressHex, Wallet, StorageBackend.WalletDB.Abstract> {

    constructor(isMainChain: Ref<boolean>, storageBackend: StorageBackend.WalletDB.Abstract) {
        super(isMainChain, storageBackend, AddressHex, Wallet as any);
    }

    async set(wallet: Wallet) {
        if (this.isMainChain == true) {
            await this.storageBackend.set(wallet);
        } else {
            const type = await this.storageBackend.exists(wallet.owner) ? "modified" : "added";
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
