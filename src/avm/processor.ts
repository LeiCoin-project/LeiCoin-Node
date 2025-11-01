import type { ExecutedTransaction, Transaction } from "@advena/common/models/transaction";
import { MinterHandler } from "@advena/pos/minter-handler";
import { DepositContract } from "@advena/smart-contracts";
import type { Stores } from "@advena/storage/store";
import { TXExecResult } from "./executionResult";

export class TXProcessor {

    constructor(
        protected readonly walletState: Stores.WalletState,
        protected readonly minterState: Stores.MinterState,
    ) {}

    async executeTransaction(tx: Transaction): Promise<TXExecResult> {
        
        const senderWallet = await this.walletState.get(tx.senderAddress);

        const senderWalletSubtractionResult = senderWallet.subtractMoneyIFPossible(tx.amount);
        if (!senderWalletSubtractionResult) {
            return TXExecResult.INSUFFICIENT_FUNDS;
        }

        senderWallet.adjustNonce(1);

        /** @todo Make proper handling for smart contracts in the future. */
        if (tx.recipientAddress.eq(DepositContract.address)) {

            const result = await this.processSmartContractTransaction(tx);
            if (!result) return TXExecResult.UNKNOWN_FAILURE;

        } else {
            const recipientWallet = await this.walletState.get(tx.recipientAddress);
            recipientWallet.addMoney(tx.amount);
            await this.walletState.set(recipientWallet);
        }

        // only update sender wallet at the end to avoid partial updates on failure
        await this.walletState.set(senderWallet);

        return TXExecResult.SUCCESS;
    }

    async revertTransaction(tx: ExecutedTransaction) {
        if (tx.executionResult !== TXExecResult.SUCCESS) {
            return;
        }
        
        const senderWallet = await this.walletState.get(tx.senderAddress);
        
        senderWallet.addMoney(tx.amount);
        senderWallet.adjustNonce(-1);

        /** @todo Make proper handling for smart contracts in the future. */
        if (tx.recipientAddress.eq(DepositContract.address)) {

            const result = await this.processSmartContractTransaction(tx, true);
            if (!result) throw new Error("Reverting smart contract transaction failure should not be possible.");

        } else {
            const recipientWallet = await this.walletState.get(tx.recipientAddress);
            
            const recipientWalletSubtractionResult = recipientWallet.subtractMoneyIFPossible(tx.amount);
            if (!recipientWalletSubtractionResult) {
                throw new Error("Reverting transaction failure should not be possible because recipient should have sufficient funds.");
            }

            await this.walletState.set(recipientWallet);
        }

        // only update sender wallet at the end to avoid partial updates on failure
        await this.walletState.set(senderWallet);

    }

    protected async processSmartContractTransaction(tx: Transaction, reverse = false) {
        if (tx.recipientAddress.eq(DepositContract.address)) {
            return await MinterHandler.executeDepositContractTransaction(tx, this.minterState, this.walletState, reverse);
        }
    }

}
