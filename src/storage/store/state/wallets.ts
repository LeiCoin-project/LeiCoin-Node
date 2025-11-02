import { AddressHex } from "@advena/common/models/address";
import type { StorageBackend } from "../../backend/exports/index.js";
import { Wallet } from "@advena/common/models/wallet";
import type { Uint, Uint64 } from "low-level";
import { AbstractChainStateStore } from "../abstractStore.js";
import type { Ref } from "ptr.js";

export interface WalletStateStore {
    get(address: AddressHex): Promise<Wallet>;
}

export class WalletStateStore extends AbstractChainStateStore<AddressHex, Wallet, Uint, StorageBackend.IBackend<Uint, Uint>> {

    constructor(isMainChain: Ref<boolean>, storageBackend: StorageBackend.IBackend<Uint, Uint>) {
        super(isMainChain, storageBackend, AddressHex, Wallet as any);
    }
    
    async set(wallet: Wallet) {
        if (this.isMainChain == true) {
            await this._set(wallet.owner, wallet);
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

    protected async _get(address: AddressHex) {
        const raw_wallet = await this.storageBackend.get(address);

        // Wallet not found, create an empty wallet
        if (!raw_wallet) return Wallet.createEmptyWallet(address);

        const wallet = Wallet.fromDecodedHex(address, raw_wallet);
        
        if (!wallet) {
            throw new Error(`Wallet Data could not be decoded for address ${address.toHex()}. Please check for corrupted or outdated data.`);
        }
        return wallet;
    }

}
