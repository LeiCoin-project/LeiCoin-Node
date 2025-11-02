import type { Uint } from "low-level";
import type { StorageBackend } from "../exports";
import { StorageUtils } from "../../utils";
import { LevelDB, type LevelDBOptions } from "../../leveldb";
import { StorageRangeIndexes } from "../../leveldb/rangeIndexes";

export class LevelDBDriver<K extends Uint = Uint, V extends Uint = Uint> implements StorageBackend.IBackend<K, V> {

    protected readonly level: LevelDB<K, V>;

    constructor(
        protected readonly path: string,
        levelOptions?: LevelDBOptions<K, V>
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

    async put(key: K, value: V) {
        return await this.level.put(key, value);
    }

    async get(key: K) {
        const value = await this.level.get(key);
        if (!value) {
            return null;
        }
        return value;
    }

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

    public createKeyStream(options?: StorageBackend.Types.Stream.CreateOptions<K>): StorageBackend.Types.Stream<K> {
        return this.level.createKeyStream(options);
    }
}

export class LevelDBDriverWithIndexes<
    K extends Uint = Uint,
    V extends Uint = Uint,
    IndexesByteLength extends number = number,
    IndexesPrefix extends Uint = Uint
> extends LevelDBDriver<K, V> implements StorageBackend.IBackendWithIndexes<K, V, IndexesByteLength, IndexesPrefix> {

    protected readonly indexes: StorageRangeIndexes<K>;

    readonly byteLength: IndexesByteLength;
    readonly prefix: IndexesPrefix;

    constructor(
        path: string,
        levelOptions: LevelDBOptions<K, V> | undefined,
        indexesOptions: {
            byteLength: IndexesByteLength;
            prefix?: IndexesPrefix;
        }
    ) {
        super(path, levelOptions);
        this.indexes = new StorageRangeIndexes(
            indexesOptions.byteLength,
            indexesOptions.prefix
        );
        this.byteLength = indexesOptions.byteLength;
        this.prefix = indexesOptions.prefix as IndexesPrefix;
    }

    async open() {
        await super.open();
        await this.indexes.load(this);
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