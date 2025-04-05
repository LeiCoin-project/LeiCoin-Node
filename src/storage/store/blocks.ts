import type { Block } from "@leicoin/common/models/block";
import { Uint64 } from "low-level";
import type { StorageAPI } from "../api";
import { AbstractChainStore } from "./abstractStore";

export class BlockStore extends AbstractChainStore<Uint64, Block, StorageAPI.Blocks> {

    constructor(isMainChain: boolean, storage: StorageAPI.Blocks) {
        super(isMainChain, storage, Uint64);
    }

    async add(block: Block, overwrite: boolean = false) {
        if (this.isMainChain) {
            await this.storage.add(block, overwrite);
        } else {
            if (!overwrite && this.tempStorage.has(block.index)) {
                return;
            }
            this.tempStorage.set(block.index, block);
        }
    }
    
}

