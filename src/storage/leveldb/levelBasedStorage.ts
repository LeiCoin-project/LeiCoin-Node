import { LevelDB } from "./index.js";
import { StorageUtils } from "../utils.js";
import { Uint } from "low-level";
import { LevelRangeIndexes } from "./rangeIndexes.js";

export abstract class LevelBasedStorage {

    protected level: LevelDB = null as any;
    protected abstract path: string;

    private initialized = false;

    async open() {
        if (this.initialized) return;
        this.initialized = true;
        
        StorageUtils.ensureDirectoryExists(this.path);
        this.level = new LevelDB(StorageUtils.getBlockchainDataFilePath(this.path));
        await this.level.open();
    }

    async close() {
        await this.level.close();
    }

}

export abstract class LevelBasedStorageWithRangeIndexes extends LevelBasedStorage {

    protected abstract keyByteLengthWithoutPrefix: number;
    protected keyPrefix: Uint = Uint.alloc(0);
    protected indexes: LevelRangeIndexes = null as any;

    async open() {
        await super.open();
        this.indexes = new LevelRangeIndexes(this.level, this.keyByteLengthWithoutPrefix, this.keyPrefix);
        await this.indexes.load();
    }

}