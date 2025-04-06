import { LevelDB } from "./index.js";
import { StorageUtils } from "../utils.js";
import { Uint } from "low-level";
import { LevelRangeIndexes } from "./rangeIndexes.js";
import { type LevelDBEncoderLike, LevelDBEncoders } from "./encoders.js";
import type { StorageAPI } from "../api.js";

export abstract class LevelBasedStorage<K extends LevelK, V, LevelK extends Uint = Uint, LevelV extends Uint = Uint> implements StorageAPI.IChainStore<K, V> {

    protected readonly level: LevelDB<LevelK, LevelV>;

    constructor(
        protected readonly path: string,
        levelKeyEncoder = LevelDBEncoders.Uint as LevelDBEncoderLike<LevelK>,
        levelValueEncoder = LevelDBEncoders.Uint as LevelDBEncoderLike<LevelV>
    ) {
        StorageUtils.ensureDirectoryExists(this.path);
        this.level = new LevelDB<LevelK, LevelV>(StorageUtils.getBlockchainDataFilePath(this.path), {
            keyEncoding: levelKeyEncoder as LevelDBEncoderLike<LevelK>,
            valueEncoding: levelValueEncoder as LevelDBEncoderLike<LevelV>
        });
    }

    async open() {
        await this.level.open();
    }

    async close() {
        await this.level.close();
    }


    abstract get(key: K): Promise<V | null>;

    async exists(key: K) {
        return await this.level.has(key);
    }

    async del(key: K) {
        return await this.level.del(key);
    }

}

export abstract class LevelBasedStorageWithRangeIndexes<K extends LevelK, V, LevelK extends Uint = Uint, LevelV extends Uint = Uint> extends LevelBasedStorage<K, V, LevelK, LevelV> {

    protected abstract keyByteLengthWithoutPrefix: number;
    protected keyPrefix: Uint = Uint.alloc(0);
    protected indexes: LevelRangeIndexes<LevelK, LevelV> = null as any;

    async open() {
        await super.open();
        this.indexes = new LevelRangeIndexes(this.level, this.keyByteLengthWithoutPrefix, this.keyPrefix);
        await this.indexes.load();
    }



}