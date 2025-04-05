import type { Transaction } from "@leicoin/common/models/transaction";
import type { StorageAPI } from "../api";
import { MinterStateStore } from "./minters";
import { WalletStateStore } from "./wallets";
import { DepositContract } from "@leicoin/smart-contracts";
import type { Ref } from "ptr.js";

export class ChainStateStore {

    constructor(
        readonly isMainChain: Ref<boolean>,
        protected readonly storage: StorageAPI.ChainState,
        readonly wallets: WalletStateStore,
        readonly minters: MinterStateStore,
    ) {}

    static create(isMainChain: Ref<boolean>, chainstateAPI: StorageAPI.ChainState, walletAPI: StorageAPI.Wallets, minterAPI: StorageAPI.Minters) {
        return new ChainStateStore(
            isMainChain,
            chainstateAPI,
            new WalletStateStore(isMainChain, walletAPI),
            new MinterStateStore(isMainChain, minterAPI),
        );
    }

    async verifyAndExecuteTransaction(tx: Transaction) {
        if (!tx.validateHash(tx.txid)) return false;

        const senderWallet = await this.wallets.get(tx.senderAddress);

        if (!senderWallet.getNonce().eq(tx.nonce)) return false;

        const moneySubtractionResult = senderWallet.subtractMoneyIFPossible(tx.amount);
        if (!moneySubtractionResult) return false;

        /** @todo Make proper handling for smart contracts in the future. */
        if (tx.recipientAddress.eq(DepositContract.address)) {

            const result = this.minters.executeDepositContractTransaction(tx, this.wallets);
            if (!result) return false;

        } else {
            await this.wallets.addMoney(tx.recipientAddress, tx.amount);
        }

        senderWallet.adjustNonce(1);
        await this.wallets.set(senderWallet);
    }

}
