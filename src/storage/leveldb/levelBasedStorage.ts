import { LevelDB, type LevelDBOptions } from "./index.js";
import { StorageUtils } from "../utils.js";
import { Uint } from "low-level";
import { LevelRangeIndexes } from "./rangeIndexes.js";
import type { StorageAPI } from "../index.js";

export abstract class LevelBasedStorage<K extends LevelK, V,
    LevelK extends Uint = Uint,
    LevelV extends Uint = Uint
> implements StorageAPI.IChainStore<K, V> {

    protected readonly level: LevelDB<LevelK, LevelV>;

    constructor(
        protected readonly path: string,
        levelOptions?: LevelDBOptions<LevelK, LevelV>
    ) {
        StorageUtils.ensureDirectoryExists(this.path);
        this.level = new LevelDB(
            StorageUtils.getBlockchainDataFilePath(this.path),
            levelOptions
        );
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

    /**
     * Be careful! this allow manual manipulation of the leveldb data which could be unsafe.
     * @returns the leveldb instance
     */
    public getLevel() {
        return this.level;
    }
}

export abstract class LevelBasedStateStorage<K extends LevelK, V,
    LevelK extends Uint = Uint,
    LevelV extends Uint = Uint
> extends LevelBasedStorage<K, V, LevelK, LevelV> implements StorageAPI.IChainStateStore<K, V> {

    abstract set(value: V): Promise<void>;

    public createKeyStream(options?: StorageAPI.Types.Stream.CreateOptions<LevelK>): StorageAPI.Types.Stream<LevelK> {
        return this.level.createKeyStream(options);
    }

}

export abstract class LevelBasedStateStorageWithIndexes<K extends LevelK, V,
    LevelK extends Uint = Uint,
    LevelV extends Uint = Uint
> extends LevelBasedStateStorage<K, V, LevelK, LevelV> implements StorageAPI.IChainStateStoreWithIndexes<K, V> {

    protected readonly indexes: LevelRangeIndexes<LevelK>;

    constructor(
        path: string,
        levelOptions: LevelDBOptions<LevelK, LevelV> | undefined,
        indexesOptions: {
            keyByteLengthWithoutPrefix: number;
            keyPrefix?: Uint;
        }
    ) {
        super(path, levelOptions);
        this.indexes = new LevelRangeIndexes(
            indexesOptions.keyByteLengthWithoutPrefix,
            indexesOptions.keyPrefix
        );
    }

    async open() {
        await super.open();
        await this.indexes.load(this.level);
    }

    public getDBSize() {
        return this.indexes.getTotalSize();
    }

    /**
     * Be careful! this allow manual manipulation of the indexes which could be unsafe.
     * @returns the indexes of the storage
     */
    public getIndexes() {
        return this.indexes;
    }
}
