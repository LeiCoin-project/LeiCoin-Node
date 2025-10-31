import type { ExecutedTransaction, Transaction } from "@advena/common/models/transaction";
import { MinterHandler } from "@advena/pos/minter-handler";
import { DepositContract } from "@advena/smart-contracts";
import type { Stores } from "@advena/storage/store/index";
import { TXExecResult } from "./executionResult";

export class TXProcessor {

    constructor(
        protected readonly walletState: Stores.WalletState,
        protected readonly minterState: Stores.MinterState,
    ) {}

    async executeTransaction(tx: Transaction): Promise<TXExecResult> {

        const senderWallet = await this.walletState.get(tx.senderAddress);

        

    }

    async revertTransaction(tx: ExecutedTransaction) {
        if (tx.executionResult !== TXExecResult.SUCCESS) {
            return;
        }
        await this.processTransaction(tx, true);
    }

    protected async processTransaction(tx: Transaction, reverse = false): Promise<TXExecResult> {

        



        const senderWalletAdjustmentResult = senderWallet.adjustBalance(tx.amount, reverse ? "add" : "sub");
        if (!senderWalletAdjustmentResult) return false;

        senderWallet.adjustNonce(reverse ? -1 : 1);

        /** @todo Make proper handling for smart contracts in the future. */
        if (tx.recipientAddress.eq(DepositContract.address)) {

            const result = await this.processSmartContractTransaction(tx);
            if (!result) return false;

        } else {

            const recipientWallet = await this.walletState.get(tx.recipientAddress);

            const recipientWalletAdjustmentResult = recipientWallet.adjustBalance(tx.amount, reverse ? "sub" : "add");
            if (!recipientWalletAdjustmentResult) return false;

            await this.walletState.set(recipientWallet);

        }

        await this.walletState.set(senderWallet);
        return true;

    }

    protected async processSmartContractTransaction(tx: Transaction, reverse = false) {
        if (tx.recipientAddress.eq(DepositContract.address)) {
            return await MinterHandler.executeDepositContractTransaction(tx, this.minterState, this.walletState, reverse);
        }
    }

}
