import { type Uint64 } from "low-level";
import { ExecutedBlock } from "@leicoin/common/models/block";
import { LevelBasedStorage } from "./leveldb/levelBasedStorage.js";
import { LevelDBEncoders } from "./leveldb/encoders.js";
import { FastEvents } from "@leicoin/utils/fastevents";

export interface IBlockDB {
    add(block: ExecutedBlock, overwrite?: boolean): Promise<boolean>;
    get(index: Uint64): Promise<ExecutedBlock | null>;
    exists(index: Uint64): Promise<boolean>;
    /**
     * WARNING: Deleting Blocks from a chain is risky and should be done with caution. Dont use this method unless you know what you are doing.
     */
    del(index: Uint64): Promise<void>;
}

export class BlockDB extends LevelBasedStorage<Uint64, ExecutedBlock, Uint64> implements IBlockDB {

    protected readonly events = new FastEvents.SingleEmitter<[ExecutedBlock]>();
    
    constructor() {
        super("/blocks", {
            keyEncoding: LevelDBEncoders.Uint64
        });
    }

    async add(block: ExecutedBlock, overwrite = false) {
        if (!overwrite) {
            if (await this.level.has(block.index)) {
                return false;
            }
        }
        await this.level.put(block.index, block.encodeToHex());
        return true;
    }

    async get(index: Uint64) {
        const raw = await this.level.get(index);
        if (!raw) return null;
        return ExecutedBlock.fromDecodedHex(raw);
    }
    
    public on_update(callback: (block: ExecutedBlock) => Promise<void> | void) {
        return this.events.on(callback) as FastEvents.SubscriptionID;
    }

    public unsubscribe_update(id: FastEvents.SubscriptionID) {
        return this.events.unsubscribe(id);
    }

}
