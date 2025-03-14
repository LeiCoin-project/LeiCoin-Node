import { CB } from "@leicoin/utils/callbacks";
import { cli } from "@leicoin/cli";
import { Wallet } from "@leicoin/common/models/wallet";
import { Block } from "@leicoin/common/models/block";
import { Blockchain } from "../blockchain.js";
import { AddressHex } from "@leicoin/common/models/address";
import { Uint, Uint64 } from "low-level";
import { LevelBasedStorage } from "../leveldb/levelBasedStorage.js";

export class WalletDB extends LevelBasedStorage {

    protected path = "/wallets";

    async getWallet(address: AddressHex) {
        const raw_wallet = await this.getData(address);
        if (!raw_wallet) return Wallet.createEmptyWallet(address);
        return Wallet.fromDecodedHex(address, raw_wallet) || Wallet.createEmptyWallet(address);
    }

    async setWallet(wallet: Wallet) {
        return this.level.put(wallet.owner, wallet.encodeToHex());
    }

    async existsWallet(address: AddressHex): Promise<boolean> {
        const raw_wallet = await this.getData(address);
        if (!raw_wallet) return false;
        return Wallet.fromDecodedHex(address, raw_wallet) ? true : false;
    }

    async addMoneyToWallet(address: AddressHex, amount: Uint64) {
        const wallet = await this.getWallet(address);
        // @todo walletdb
        if (this.chain === "main") {
            for (const [chainName, chain] of Object.entries(Blockchain.chains)) {
                if (chainName === "main") continue;
                if (!(await chain.wallets.existsWallet(address))) {
                    chain.wallets.setWallet(wallet);
                }
            }
        }
        wallet.addMoney(amount);
        await this.setWallet(wallet);
    }

    async subtractMoneyFromWallet(address: AddressHex, amount: Uint64, adjustNonce = true) {
        const wallet = await this.getWallet(address);
        if (this.chain === "main") {
            for (const [chainName, chain] of Object.entries(Blockchain.chains)) {
                if (chainName === "main") continue;
                if (!(await chain.wallets.existsWallet(address))) {
                    chain.wallets.setWallet(wallet);
                }
            }
        }
        if (adjustNonce) {
            wallet.adjustNonce();
        }
        wallet.subtractMoneyIFPossible(amount);
        await this.setWallet(wallet);
    }

    async adjustWalletsByBlock(block: Block) {
        try {

            const promises: Promise<void>[] = [];

            for (const transactionData of block.body.transactions) {
                const amount = transactionData.amount;
                promises.push(this.subtractMoneyFromWallet(transactionData.senderAddress, amount));
                promises.push(this.addMoneyToWallet(transactionData.recipientAddress, amount));
            }
    
            await Promise.all(promises);
            
            return { cb: CB.SUCCESS };

        } catch (err: any) {
            cli.data.error(`Error updating Wallets from Block ${block.index.toBigInt()}: ${err.stack}`);
            return { cb: CB.ERROR };
        }
    }

    async deleteWallet(address: AddressHex) {
        return this.delData(address);
    }

}


