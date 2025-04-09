import { Uint, type BasicUintConstructable } from "low-level";
import type { StorageAPI } from "../index.js";
import type { Ref } from "ptr.js";
import { type EncodeableObj, type EncodeableObjInstance } from "flexbuf";
import { TempStorage, TempStorageWithIndexes } from "./tempStore";
import { BasicRangeIndexes } from "../leveldb/rangeIndexes.js";

export abstract class AbstractChainStore<K extends Uint, V extends EncodeableObjInstance, S extends StorageAPI.IChainStore<K, V>> {

    protected readonly tempStorage: TempStorage<K, V>;

    constructor(
        public isMainChain: Ref<boolean>,
        protected readonly storage: S,
        keyCLS: BasicUintConstructable<K>,
        valueCLS: EncodeableObj<V>,
    ) {
        this.tempStorage = new TempStorage(keyCLS, valueCLS);
    }

    // @ts-ignore
    async get(key: K): ReturnType<S["get"]> {
        const value = this.tempStorage.get(key);
        if (value || value === null) {
            return value as any;
        }
        return await this.storage.get(key) as any;
    }

    async exists(key: K) {
        const has = this.tempStorage.has(key);
        if (has !== false) {
            return has;
        }
        return this.storage.exists(key);
    }
    
    async del(key: K) {
        if (this.isMainChain == true) {
            this.tempStorage.delete(key, true);
            this.storage.del(key);
        } else {
            this.tempStorage.delete(key);
        }
    }

}


export abstract class AbstractChainStateStore<K extends Uint, V extends EncodeableObjInstance, S extends StorageAPI.IChainStateStore<K, V>> extends AbstractChainStore<K, V, S> {
    abstract set(value: V): Promise<void>;
}

export abstract class AbstractChainStateStoreWithIndexes<K extends Uint, V extends EncodeableObjInstance, S extends StorageAPI.IChainStateStore<K, V>> extends AbstractChainStateStore<K, V, S> {

    protected readonly tempStorage: TempStorageWithIndexes<K, V>;

    constructor(
        isMainChain: Ref<boolean>,
        storage: S,
        keyCLS: BasicUintConstructable<K>,
        valueCLS: EncodeableObj<V>,
        indexesSettings: {
            readonly byteLength: number,
            readonly prefix: Uint
        }
    ) {
        super(isMainChain, storage, keyCLS, valueCLS);
        this.tempStorage = new TempStorageWithIndexes<K, V>(
            keyCLS, valueCLS,
            new BasicRangeIndexes(indexesSettings.byteLength, indexesSettings.prefix),
        );
    }

}

