import { type BlockHeader } from "@advena/common/models/block";
import { type Chain } from "./chain.js";
import { POSUtils } from "./utils.js";

export class ForkChoice {

    static async isValidBlock(block: BlockHeader, chain: Chain) {

        if (!block.validateHash(block.hash)) return false;

        const state = chain.state;

        const currentSlotIndex = POSUtils.calulateCurrentSlotIndex(chain.time);
        const currentProposer_promise = state.getProposer(currentSlotIndex);

        if (!currentSlotIndex.eq(block.slotIndex)) return false;

        const currentProposer = await currentProposer_promise;
        if (!currentProposer.address.eq(block.minter)) return false;

        if (state.latestBlockHeader.index.gte(block.index)) return false;

        const previousBlock = await chain.getBlock(block.index.sub(1));
        if (!previousBlock) return false;
        if (previousBlock.hash !== block.previousHash) return false;

        // block is invalid when containing tx with:
        // - invalid nonce (duplicate nonce or too high nonce)
        // - Insufficient balance for execution fee 

        return true;
    }


}
