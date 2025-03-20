import type { Block, BlockHeader } from "@leicoin/common/models/block";
import type { AddressHex } from "@leicoin/common/models/address";
import type { BlockStore, MinterState } from "./store.js";
import type { Uint64 } from "low-level";
import type { FastEvents } from "@leicoin/utils/fastevents";
import { POSUtils } from "./utils.js";

export class ChainState {

    constructor(
        readonly time: Uint64,
        readonly latestBlockHeader: BlockHeader,
        protected readonly minters: MinterState,
    ) {}

    async getMinter(address: AddressHex) {
        return await this.minters.get(address);
    }

    async getProposer(slotIndex: Uint64 = POSUtils.calulateCurrentSlotIndex(this.time)) {
        return await this.minters.getProposer(slotIndex);
    }

}

export class Chain {

    protected readonly updateListenerSubscription: FastEvents.Subscription;

    constructor(
        readonly time: Uint64,
        protected readonly blocks: BlockStore,
        readonly state: ChainState
    ) {
        //this.updateListenerSubscription = this.blocks.
    }

    static async create(
        time: Uint64,
        blocks: BlockStore,
        minters: MinterState
    ) {
        //@todo Implement function to get the chain head
        const latestBlockHeader: BlockHeader = await blocks.getHead();
        const state = new ChainState(time, latestBlockHeader, minters);
        return new Chain(time, blocks, state);
    }

    async getBlock(index: Uint64) {
        return await this.blocks.get(index);
    }
    async getBlockHeader(index: Uint64) {
        return await this.blocks.getHeader(index);
    }

    async update(block: Block) {
        
    }


}
