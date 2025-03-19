import type { Block, BlockHeader } from "@leicoin/common/models/block";
import type { AddressHex } from "@leicoin/common/models/address";
import type { BlockStore, MinterState } from "./store.js";
import type { Uint64 } from "low-level";
import type { FastEvents } from "@leicoin/utils/fastevents";
import { POSUtils } from "./utils.js";

export class ChainState {

    constructor(
        readonly latestBlockHeader: BlockHeader,
        readonly minters: MinterState,
    ) {}

}

export class Chain {

    protected updateListenerSubscription: FastEvents.Subscription;

    constructor(
        readonly time: Uint64,
        protected readonly blocks: BlockStore,
        readonly state: ChainState
    ) {
        //this.updateListenerSubscription = this.blocks.
    }

    async getBlock(index: Uint64) {
        return await this.blocks.get(index);
    }
    async getBlockHeader(index: Uint64) {
        return await this.blocks.getHeader(index);
    }

    async getMinter(address: AddressHex) {
        return await this.state.minters.get(address);
    }

    async getProposer(slotIndex: Uint64 = POSUtils.calulateCurrentSlotIndex(this.time)) {
        return await this.state.minters.getProposer(slotIndex);
    }

    async update(block: Block) {
        
    }


}
