import { BlockHeader, ExecutedBlock } from "@advena/common/models/block";
import { Uint64 } from "low-level";
import type { StorageAPI } from "../exports/index.js";
import { AbstractChainStore } from "./abstractStore";
import type { Ref } from "ptr.js";
import { FastEvents } from "@advena/utils/fastevents";

class BlockHeaderStore extends AbstractChainStore<Uint64, BlockHeader, StorageAPI.IBlockHeaders> {

}

class BlockBodyStore extends AbstractChainStore<Uint64, any, StorageAPI.IBlockBodies> {

}

export class BlockStore extends AbstractChainStore<Uint64, ExecutedBlock, StorageAPI.IBlocks> {

    protected readonly events = new FastEvents.SingleEmitter<[ExecutedBlock]>();

    constructor(isMainChain: Ref<boolean>, storage: StorageAPI.IBlocks) {
        super(isMainChain, storage, Uint64, ExecutedBlock);
    }

    async add(block: ExecutedBlock, overwrite: boolean = false) {
        if (this.isMainChain == true) {
            await this.storage.add(block, overwrite);
        } else {
            if (!overwrite && this.tempStorage.has(block.index)) {
                return;
            }
            this.tempStorage.set(block.index, block, "added");
        }
    }

    public on_update(callback: (block: ExecutedBlock) => Promise<void> | void) {
        return this.events.on(callback) as FastEvents.SubscriptionID;
    }

    public unsubscribe_update(id: FastEvents.SubscriptionID) {
        return this.events.unsubscribe(id);
    }
    
}



