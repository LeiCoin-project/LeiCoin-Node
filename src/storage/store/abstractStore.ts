import { Uint, Uint64, type BasicUintConstructable } from "low-level";
import type { StorageBackend } from "../backend/exports/index.js";
import type { Ref } from "ptr.js";
import { type EncodeableObj, type EncodeableObjInstance } from "flexbuf";
import { TempStorage, TempStorageWithIndexes } from "./tempStore";
import { BasicRangeIndexes, type IKeyIndexRange } from "../leveldb/rangeIndexes.js";
import { StorageUtils } from "../utils.js";

export abstract class AbstractChainStore<
    K extends KBackend, 
    V extends EncodeableObjInstance,
    KBackend extends Uint,
    const SB extends StorageBackend.IBackend<KBackend, Uint>
> {

    protected readonly tempStorage: TempStorage<K, V>;

    constructor(
        public isMainChain: Ref<boolean>,
        protected readonly storageBackend: SB,
        protected readonly keyCLS: BasicUintConstructable<K>,
        protected readonly valueCLS: EncodeableObj<V>,
    ) {
        this.tempStorage = new TempStorage(keyCLS, valueCLS);
    }

    async get(key: K): Promise<V | null> {
        const value = this.tempStorage.get(key);
        if (value || value === null) {
            return value as any;
        }
        return await this._get(key);
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
            this._del(key);
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

    protected async _get(key: K): Promise<V | null> {
        const raw_value = await this.storageBackend.get(key);
        if (!raw_value) return null;
        return this.valueCLS.fromDecodedHex(raw_value);
    }

    protected _set(key: K, value: V) {
        return this.storageBackend.put(key, value.encodeToHex(false));
    }

    protected _del(key: K): Promise<void> {
        return this.storageBackend.del(key);
    }

    async makeChangesPermanent() {
        for (const [key, value] of this.tempStorage.added.entries()) {
            await this.storageBackend.put(key, value);
        }
        for (const [key, value] of this.tempStorage.modified.entries()) {
            await this.storageBackend.put(key, value);
        }
        for (const key of this.tempStorage.deleted) {
            await this.storageBackend.del(key);
        }
        this.tempStorage.clear();
    }

}


export abstract class AbstractChainStateStore<
    K extends KBackend, 
    V extends EncodeableObjInstance,
    KBackend extends Uint,
    const SB extends StorageBackend.IBackend<KBackend, Uint>
> extends AbstractChainStore<K, V, KBackend, SB> {

    abstract set(value: V): Promise<void>;
}

export abstract class AbstractChainStateStoreWithIndexes<
    K extends KBackend, 
    V extends EncodeableObjInstance,
    KBackend extends Uint,
    const SB extends StorageBackend.IBackendWithIndexes<KBackend, Uint, number, Uint>
> extends AbstractChainStateStore<K, V, KBackend, SB> {

    protected readonly tempStorage: TempStorageWithIndexes<K, V>;

    constructor(
        isMainChain: Ref<boolean>,
        storageBackend: SB,
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

