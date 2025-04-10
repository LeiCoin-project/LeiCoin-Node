import { CB } from "@leicoin/utils/callbacks";
import { cli } from "@leicoin/cli";
import { Wallet } from "@leicoin/common/models/wallet";
import { Block } from "@leicoin/common/models/block";
import { Blockchain } from "../blockchain.js";
import { AddressHex } from "@leicoin/common/models/address";
import { Uint, Uint64 } from "low-level";
import { LevelBasedStorage } from "../leveldb/levelBasedStorage.js";
import type { StorageAPI } from "../index.js";

export interface IWalletDB extends StorageAPI.IChainStateStore<AddressHex, Wallet> {
    set(wallet: Wallet): Promise<void>;
    get(address: AddressHex): Promise<Wallet>;
    exists(address: AddressHex): Promise<boolean>;
    del(address: AddressHex): Promise<void>;
}

export class WalletDB extends LevelBasedStorage<AddressHex, Wallet> implements IWalletDB {

    constructor() {
        super("/wallets");
    }

    async get(address: AddressHex) {
        const raw_wallet = await this.level.get(address);

        // Wallet not found, create an empty wallet
        if (!raw_wallet) return Wallet.createEmptyWallet(address);

        const wallet = Wallet.fromDecodedHex(address, raw_wallet);
        
        if (!wallet) {
            throw new Error(`Wallet Data could not be decoded for address ${address.toHex()}. Please check for corrupted or outdated data.`);
        }
        return wallet;
    }

    async getAllAddresses() {
        return this.level.keys().all();
    }

    async set(wallet: Wallet) {
        return this.level.put(wallet.owner, wallet.encodeToHex());
    }
    
    /** @todo walletdb */

    // async addMoneyToWallet(address: AddressHex, amount: Uint64) {
    //     const wallet = await this.get(address);
    //     if (this.chain === "main") {
    //         for (const [chainName, chain] of Object.entries(Blockchain.chains)) {
    //             if (chainName === "main") continue;
    //             if (!(await chain.wallets.exists(address))) {
    //                 chain.wallets.set(wallet);
    //             }
    //         }
    //     }
    //     wallet.addMoney(amount);
    //     await this.set(wallet);
    // }

    // async subtractMoneyFromWallet(address: AddressHex, amount: Uint64) {
    //     const wallet = await this.get(address);
    //     if (this.chain === "main") {
    //         for (const [chainName, chain] of Object.entries(Blockchain.chains)) {
    //             if (chainName === "main") continue;
    //             if (!(await chain.wallets.exists(address))) {
    //                 chain.wallets.set(wallet);
    //             }
    //         }
    //     }
    //     if (adjustNonce) {
    //         wallet.adjustNonce();
    //     }
    //     wallet.subtractMoneyIFPossible(amount);
    //     await this.set(wallet);
    // }

    // async adjustWalletsByBlock(block: Block) {
    //     try {

    //         const promises: Promise<void>[] = [];

    //         for (const transactionData of block.body.transactions) {
    //             const amount = transactionData.amount;
    //             promises.push(this.subtractMoneyFromWallet(transactionData.senderAddress, amount));
    //             promises.push(this.addMoneyToWallet(transactionData.recipientAddress, amount));
    //         }
    
    //         await Promise.all(promises);
            
    //         return { cb: CB.SUCCESS };

    //     } catch (err: any) {
    //         cli.data.error(`Error updating Wallets from Block ${block.index.toBigInt()}: ${err.stack}`);
    //         return { cb: CB.ERROR };
    //     }
    // }

}


