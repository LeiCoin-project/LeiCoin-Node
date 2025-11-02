import { Uint, Uint64, type BasicUintConstructable } from "low-level";
import type { StorageBackend } from "../backend/exports/index.js";
import type { Ref } from "ptr.js";
import { type EncodeableObj, type EncodeableObjInstance } from "flexbuf";
import { TempStorage, TempStorageWithIndexes } from "./tempStore";
import { BasicRangeIndexes, type IKeyIndexRange } from "../leveldb/rangeIndexes.js";
import { StorageUtils } from "../utils.js";

export abstract class AbstractChainStore<K extends Uint, V extends EncodeableObjInstance, S extends StorageBackend.IChainStore<K, V>> {

    protected readonly tempStorage: TempStorage<K, V>;

    constructor(
        public isMainChain: Ref<boolean>,
        protected readonly storageBackend: S,
        protected readonly keyCLS: BasicUintConstructable<K>,
        protected readonly valueCLS: EncodeableObj<V>,
    ) {
        this.tempStorage = new TempStorage(keyCLS, valueCLS);
    }

    // @ts-ignore
    async get(key: K): ReturnType<S["get"]> {
        const value = this.tempStorage.get(key);
        if (value || value === null) {
            return value as any;
        }
        return await this.storageBackend.get(key) as any;
    }

    async exists(key: K) {
        const has = this.tempStorage.has(key);
        if (has !== false) {
            return has;
        }
        return this.storageBackend.exists(key);
    }
    
    async del(key: K) {
        if (this.isMainChain == true) {
            this.tempStorage.delete(key, true);
            this.storageBackend.del(key);
        } else {
            this.tempStorage.delete(key);
        }
    }

    public createKeyStream(options?: StorageBackend.Types.Stream.CreateOptions<Uint>): StorageBackend.Types.Stream<Uint> {

        const baseKeyStream = this.storageBackend.createKeyStream(options);

        const stream = StorageUtils.mergeSortedKeyStream(
            baseKeyStream,
            this.tempStorage.added.keys().all(),
            this.tempStorage.deleted,
            options
        );
        return {
            [Symbol.asyncIterator]() {
                return stream[Symbol.asyncIterator]();
            },
            destroy() {
                baseKeyStream.destroy();
            }
        }
    }


    abstract makeChangesPermanent(): Promise<void>;

}


export abstract class AbstractChainStateStore<K extends Uint, V extends EncodeableObjInstance, S extends StorageBackend.IChainStateStore<K, V>> extends AbstractChainStore<K, V, S> {
    abstract set(value: V): Promise<void>;

    async makeChangesPermanent() {
        // for (const [key, value] of this.tempStorage.added.entries()) {
        //     await this.storageBackend.set(value);
        // }
        // for (const [key, value] of this.tempStorage.modified.entries()) {
        //     await this.storageBackend.set(value);
        // }
        // for (const key of this.tempStorage.deleted) {
        //     await this.storageBackend.del(key);
        // }
        // this.tempStorage.clear();
    }
}

export abstract class AbstractChainStateStoreWithIndexes<K extends Uint, V extends EncodeableObjInstance, S extends StorageBackend.IChainStateStoreWithIndexes<K, V>> extends AbstractChainStateStore<K, V, S> {

    protected readonly tempStorage: TempStorageWithIndexes<K, V>;

    constructor(
        isMainChain: Ref<boolean>,
        storageBackend: S,
        keyCLS: BasicUintConstructable<K>,
        valueCLS: EncodeableObj<V>,
        indexesSettings: {
            readonly byteLength: number,
            readonly prefix: Uint
        }
    ) {
        super(isMainChain, storageBackend, keyCLS, valueCLS);
        this.tempStorage = new TempStorageWithIndexes<K, V>(
            keyCLS, valueCLS,
            new BasicRangeIndexes(indexesSettings.byteLength, indexesSettings.prefix),
        );
    }


	public getDBSize() {
		const baseSize = this.storageBackend.getDBSize();
		const { added, deleted } = this.tempStorage.size;

		return baseSize + added - deleted;
	}


    async getAddressByIndex(index: Uint64) {
		const { range, offset } = await this.getRangeByIndexFromMergedIndexes(index);

		const count = Uint64.from(0);

        const keyStream = this.createKeyStream({
            gte: range.firstPossibleKey,
            lte: range.lastPossibleKey,
        });

        for await (const addr of keyStream) {
            if (count.eq(offset)) {
                keyStream.destroy();
                return new this.keyCLS(addr);
            }
            count.iadd(1);
        }

        return null;
	}

    protected async getRangeByIndexFromMergedIndexes(index: Uint64) {

		const totalOffset = Uint64.from(0);
		
		const rangesAmount = this.storageBackend.getIndexes().getRangesAmount();

		const baseStorageRanges = this.storageBackend.getIndexes().getRanges();
		const tempStorageRanges = this.tempStorage.indexes.getRanges();

        for (let i = 0; i < rangesAmount; i++) {

			const baseRange = baseStorageRanges[i] as IKeyIndexRange;
			const tempStorageRangeSize = (tempStorageRanges[i] as IKeyIndexRange).size;

			const rangeSize = baseRange.size + tempStorageRangeSize;

            if (totalOffset.add(rangeSize).gt(index)) {
                return {
                    range: {
						firstPossibleKey: baseRange.firstPossibleKey,
						lastPossibleKey: baseRange.lastPossibleKey,
						size: rangeSize,
					} as IKeyIndexRange,
                    offset: index.sub(totalOffset)
                };
            }
            totalOffset.iadd(rangeSize);
        }

		/** @todo Better Error Handling: Error shoudl not run when there are no Minter in the DB */
        throw new Error("Index is not part of any range. Are the ranges initialized?");
	}

}

