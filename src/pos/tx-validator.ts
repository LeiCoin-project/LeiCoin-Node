import type { Transaction } from "@advena/common/models/transaction";
import type { Stores } from "@advena/storage/store/index";

export class TXValidator {

    constructor(
        protected readonly walletState: Stores.WalletState
    ) {}

    async validateTransaction(tx: Transaction): Promise<boolean> {
        if (!tx.validateHash(tx.txid)) return false;

        // validate signature

        const senderWallet = await this.walletState.get(tx.senderAddress);

        if (!senderWallet.getNonce().eq(tx.nonce)) return false;
    }
    
}
