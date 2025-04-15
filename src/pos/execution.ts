import { type Block } from "@leicoin/common/models/block";
import { Blockchain } from "@leicoin/storage/blockchain";
import { Verification } from "@leicoin/verification";
import { Mempool } from "@leicoin/storage/mempool";
import type { Transaction } from "@leicoin/common/models/transaction";
import type { Stores } from "@leicoin/storage/store/index";
import { DepositContract } from "@leicoin/smart-contracts";
import { MinterHandler } from "./minter-handler";


export class Execution {

    // static async executeBlock(block: Block, validationresult: Verification.Result.BlockValid) {

    //     let forked = false;

    //     const { targetChain, parentChain } = validationresult;

    //     if (targetChain !== parentChain) { // New fork if targetChain is different from parentChain
    //         await Blockchain.createFork(validationresult.targetChain, validationresult.parentChain, block);
    //         forked = true;
    //     }

    //     await Blockchain.chains[targetChain].blocks.add(block);
    //     Blockchain.chainstate.updateChainStateByBlock(
    //         targetChain,
    //         parentChain,
    //         block,
    //     );

    //     if (targetChain === "main") {
    //         Mempool.clearMempoolbyBlock(block);

    //         await Blockchain.wallets.adjustWalletsByBlock(block);
    //     }

    //     return { forked };
    // }



    static async processTransaction(tx: Transaction, walletState: Stores.WalletState, minterState: Stores.MinterState) {

        if (!tx.validateHash(tx.txid)) return false;

        const senderWallet = await walletState.get(tx.senderAddress);

        if (!senderWallet.getNonce().eq(tx.nonce)) return false;

        const moneySubtractionResult = senderWallet.subtractMoneyIFPossible(tx.amount);
        if (!moneySubtractionResult) return false;

        /** @todo Make proper handling for smart contracts in the future. */
        if (tx.recipientAddress.eq(DepositContract.address)) {

            const result = await this.processSmartContractTransaction(tx, walletState, minterState);
            if (!result) return false;

        } else {
            await walletState.addMoney(tx.recipientAddress, tx.amount);
        }

        senderWallet.adjustNonce(1);
        await walletState.set(senderWallet);
        return true;
    }

    static async processSmartContractTransaction(tx: Transaction, walletState: Stores.WalletState, minterState: Stores.MinterState) {
        if (tx.recipientAddress.eq(DepositContract.address)) {
            return await MinterHandler.executeDepositContractTransaction(tx, minterState, walletState);
        }
    }

}

