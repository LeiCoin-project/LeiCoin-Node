import { type Block } from "@advena/common/models/block";
import { type Chain } from "./chain.js";
import { POSUtils } from "./utils.js";
import { TXValidator } from "./tx-validator.js";

export class ForkChoice {

    static async isValidBlock(block: Block, chain: Chain) {

        if (!block.validateHash(block.hash)) return false;

        const state = chain.state;

        const currentSlotIndex = POSUtils.calulateCurrentSlotIndex(chain.time);
        const currentProposer_promise = state.getProposer(currentSlotIndex);

        if (!currentSlotIndex.eq(block.slotIndex)) return false;

        const currentProposer = await currentProposer_promise;
        if (!currentProposer.eq(block.minter)) return false;

        const previousBlock = await chain.getLatestBlockHeader();
        if (!previousBlock.index.add(1).eq(block.index)) return false;
        if (previousBlock.hash !== block.previousHash) return false;

        const txValidator = new TXValidator(state.wallets);
        for (const tx of block.body.transactions) {
            if (!(await txValidator.validateTransaction(tx))) {
                return false;
            }
        }

        // block is invalid when containing tx with:
        // - invalid signature
        // - invalid nonce (duplicate nonce or too high nonce)
        // - Insufficient balance for execution fee 


        return true;
    }


}
