import type { Block, BlockHeader } from "@leicoin/common/models/block";
import type { AddressHex } from "@leicoin/common/models/address";
import type { Stores } from "@leicoin/storage/store";
import type { Uint64 } from "low-level";
import type { FastEvents } from "@leicoin/utils/fastevents";
import { POSUtils } from "./utils.js";
import type { Transaction } from "@leicoin/common/models/transaction";
import { Ref } from "ptr.js";

export class ChainState {

    constructor(
        readonly time: Uint64,
        latestBlockHeader: BlockHeader,
        protected readonly minters: Stores.MinterState,
    ) {}

    async getMinter(address: AddressHex) {
        return await this.minters.get(address);
    }

    async getProposer(slotIndex: Uint64 = POSUtils.calulateCurrentSlotIndex(this.time)) {
        return await this.minters.getProposer(slotIndex);
    }

    async update(block: Block) {
        
    }

    protected async verifyAndExecuteTransaction(tx: Transaction) {
        
    }

}

export class Chain {

    public readonly isMain: Ref<boolean>;

    protected readonly updateListenerSubscription: FastEvents.SubscriptionID;

    constructor(
        isMain: boolean | Ref<boolean>,
        readonly time: Uint64,
        protected readonly blocks: Stores.Blocks,
        readonly state: ChainState
    ) {
        this.isMain = new Ref(isMain);
        //this.updateListenerSubscription = this.blocks.
    }

    static async create(
        isMain: boolean | Ref<boolean>,
        time: Uint64,
        blocks: Stores.Blocks,
        minters: Stores.MinterState
    ) {
        //@todo Implement function to get the chain head
        const latestBlockHeader: BlockHeader = await blocks.getHead();
        const state = new ChainState(time, latestBlockHeader, minters);
        return new Chain(isMain, time, blocks, state);
    }

    async getBlock(index: Uint64) {
        return await this.blocks.get(index);
    }
    async getBlockHeader(index: Uint64) {
        return await this.blocks.getHeader(index);
    }

    async update(block: Block) {
        await this.blocks.add(block);
        

    }

    protected async revertMainChainBlock(block: Block) {
        if (this.isMain == true) return;


    }

}
