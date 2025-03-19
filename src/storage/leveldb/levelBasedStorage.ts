import { LevelDB } from "./index.js";
import { StorageUtils } from "../utils.js";
import { Uint } from "low-level";
import { LevelRangeIndexes } from "./rangeIndexes.js";
import { LevelDBEncoderLike, LevelDBEncoders } from "./encoders.js";

export abstract class LevelBasedStorage<K extends Uint = Uint, V extends Uint = Uint> {

    protected abstract path: string;

    protected level: LevelDB<K, V> = null as any;

    protected readonly levelKeyEncoder = LevelDBEncoders.Uint;
    protected readonly levelValueEncoder = LevelDBEncoders.Uint;

    private initialized = false;

    async open() {
        if (this.initialized) return;
        this.initialized = true;
        
        StorageUtils.ensureDirectoryExists(this.path);
        this.level = new LevelDB<K, V>(StorageUtils.getBlockchainDataFilePath(this.path), {
            keyEncoding: this.levelKeyEncoder as LevelDBEncoderLike<K>,
            valueEncoding: this.levelValueEncoder as LevelDBEncoderLike<V>
        });
        await this.level.open();
    }

    async close() {
        await this.level.close();
    }

}

export abstract class LevelBasedStorageWithRangeIndexes<K extends Uint = Uint, V extends Uint = Uint> extends LevelBasedStorage<K, V> {

    protected abstract keyByteLengthWithoutPrefix: number;
    protected keyPrefix: Uint = Uint.alloc(0);
    protected indexes: LevelRangeIndexes<K, V> = null as any;

    async open() {
        await super.open();
        this.indexes = new LevelRangeIndexes(this.level, this.keyByteLengthWithoutPrefix, this.keyPrefix);
        await this.indexes.load();
    }

}