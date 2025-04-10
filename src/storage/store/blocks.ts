import { Block } from "@leicoin/common/models/block";
import { Uint64 } from "low-level";
import type { StorageAPI } from "../index.js";
import { AbstractChainStore } from "./abstractStore";
import type { Ref } from "ptr.js";

export class BlockStore extends AbstractChainStore<Uint64, Block, StorageAPI.IBlocks> {

    constructor(isMainChain: Ref<boolean>, storage: StorageAPI.IBlocks) {
        super(isMainChain, storage, Uint64, Block);
    }

    async add(block: Block, overwrite: boolean = false) {
        if (this.isMainChain == true) {
            await this.storage.add(block, overwrite);
        } else {
            if (!overwrite && this.tempStorage.has(block.index)) {
                return;
            }
            this.tempStorage.set(block.index, block, "added");
        }
    }
    
}

