import { BlockHeader, ExecutedBlock, ExecutedBlockBody } from "@advena/common/models/block";
import { Uint64 } from "low-level";
import type { StorageBackend } from "../backend/exports/index.js";
import { AbstractChainStore } from "./abstractStore";
import type { Ref } from "ptr.js";
import { FastEvents } from "@advena/utils/fastevents";

class BlockHeaderStore extends AbstractChainStore<Uint64, BlockHeader, StorageBackend.BlockDB.Headers.Abstract> {

    constructor(isMainChain: Ref<boolean>, storageBackend: StorageBackend.BlockDB.Headers.Abstract) {
        super(isMainChain, storageBackend, Uint64, BlockHeader);
    }

    async add(blockHeader: BlockHeader, overwrite: boolean = false) {
        if (this.isMainChain == true) {
            await this.storageBackend.add(blockHeader, overwrite);
        } else {
            if (!overwrite && this.tempStorage.has(blockHeader.index)) {
                return;
            }
            this.tempStorage.set(blockHeader.index, blockHeader, "added");
        }
    }

}

class BlockBodyStore extends AbstractChainStore<Uint64, any, StorageBackend.BlockDB.Bodies.Abstract> {

    constructor(isMainChain: Ref<boolean>, storageBackend: StorageBackend.BlockDB.Bodies.Abstract) {
        super(isMainChain, storageBackend, Uint64, ExecutedBlockBody);
    }

    async add(index: Uint64, blockBody: ExecutedBlockBody, overwrite: boolean = false) {
        if (this.isMainChain == true) {
            await this.storageBackend.add(index, blockBody, overwrite);
        } else {
            if (!overwrite && this.tempStorage.has(index)) {
                return;
            }
            this.tempStorage.set(index, blockBody, "added");
        }
    }

}

export class BlockStore {

    protected readonly events = new FastEvents.SingleEmitter<[ExecutedBlock]>();

    protected readonly headers: BlockHeaderStore;
    protected readonly bodies: BlockBodyStore;

    constructor(
        public isMainChain: Ref<boolean>,
        headersBackend: StorageBackend.BlockDB.Headers.Abstract,
        bodiesBackend: StorageBackend.BlockDB.Bodies.Abstract,
    ) {
        this.headers = new BlockHeaderStore(isMainChain, headersBackend);
        this.bodies = new BlockBodyStore(isMainChain, bodiesBackend);
    }

    async add(block: ExecutedBlock, overwrite?: boolean) {
        await Promise.all([
            this.headers.add(block.getHeader(), overwrite),
            this.bodies.add(block.index, block.body, overwrite)
        ]);
    }

    async get(index: Uint64): Promise<ExecutedBlock | null> {
        const header = await this.headers.get(index);
        if (!header) return null;
        const body = await this.bodies.get(index);
        if (!body) return null;
        return ExecutedBlock.fromHeaderAndBody(header, body);
    }

    async getHeader(index: Uint64): Promise<BlockHeader | null> {
        return await this.headers.get(index);
    }

    async getBody(index: Uint64): Promise<ExecutedBlockBody | null> {
        return await this.bodies.get(index);
    }

    async exists(index: Uint64): Promise<boolean | null> {
        return await this.headers.exists(index);
    }

    /**
     * WARNING: Deleting Blocks from a chain is risky and should be done with caution. Dont use this method unless you know what you are doing.
     */
    async del(index: Uint64): Promise<void> {
        await Promise.all([
            this.headers.del(index),
            this.bodies.del(index)
        ]);
    }

    public on_update(callback: (block: ExecutedBlock) => Promise<void> | void) {
        return this.events.on(callback) as FastEvents.SubscriptionID;
    }

    public unsubscribe_update(id: FastEvents.SubscriptionID) {
        return this.events.unsubscribe(id);
    }
    
}



