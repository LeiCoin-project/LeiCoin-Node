import { AddressHex } from "@advena/common/models/address";
import type { Transaction } from "@advena/common/models/transaction";
import type { Stores } from "@advena/storage/store/index";

export class TXValidator {

    constructor(
        protected readonly walletState: Stores.WalletState
    ) {}

    async validateTransaction(tx: Transaction): Promise<boolean> {
        if (!tx.validateHash(tx.txid)) return false;

        const addressFromSignature = AddressHex.fromSignature(tx.txid, tx.signature);
        if (!addressFromSignature) return false;
        if (!tx.senderAddress.eq(addressFromSignature)) return false;

        const senderWallet = await this.walletState.get(tx.senderAddress);

        if (!senderWallet.getNonce().eq(tx.nonce)) return false;

        // TODO: Check for sufficient balance for execution fee when execution fee is implemented

        return true;
    }
    
}
