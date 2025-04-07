import { BasicBinaryMap, Uint, type BasicUintConstructable, type BMapEntriesIterator, type BMapKeysIterator, type BMapValuesIterator } from "low-level";
import type { StorageAPI } from "../api";
import type { Ref } from "ptr.js";
import { type EncodeableObj, type EncodeableObjInstance } from "flexbuf";

class TempStorage<K extends Uint, V extends EncodeableObjInstance> {

    protected readonly storage: BasicBinaryMap<K, Uint | null>;

    constructor(
        protected readonly keyCLS: BasicUintConstructable<K>,
        protected readonly ValueCLS: EncodeableObj<V>
    ) {
        this.storage = new BasicBinaryMap(this.keyCLS);
    }

    /**
     * Get the value for the given key.
     * @param key the key to get the value for.
     * @returns the value or undefined if not found. null if marked as deleted.
     */
    public get(key: K, asRaw?: false): V | null | undefined;
    public get(key: K, asRaw: true): Uint | null | undefined;
    public get(key: K, asRaw: boolean): V | Uint | null | undefined;
    public get(key: K, asRaw = false) {
        const raw = this.storage.get(key);
        if (!raw || asRaw) return raw;

        const value = this.ValueCLS.fromDecodedHex(raw, false);
        return value ? value : undefined;
    }

    /**
     * Set the value for the given key.
     * @param key the key to set the value for.
     * @param value the value to set. null if marked as deleted.
     * @returns the previous value or null if not found.
     */
    public set(key: K, value: V | Uint | null) {
        if (!value || Uint.isUint(value)) {
            return this.storage.set(key, value);
        }
        const raw = this.ValueCLS.prototype.encodeToHex.call(value, false);
        return this.storage.set(key, raw);
    }

    /**
     * Delete the value for the given key.
     * @param key the key to delete the value for.
     * @param fully if true, the value is deleted from the storage. if false, the value is ony marked as deleted.
     * @returns true if deleted, false if not found.
     */
    public delete(key: K, fully?: false): true;
    public delete(key: K, fully: true): boolean;
    public delete(key: K, fully: boolean): true | boolean;
    public delete(key: K, fully = false) {
        if (fully) {
            return this.storage.delete(key);
        }
        this.storage.set(key, null);
        return true;
    }

    /**
     * Check if a key-value pair exists in the storage.
     * @param key the key to check if exists.
     * @returns true if exists, false if not found. null if marked as deleted.
     */
    public has(key: K) {
        const v = this.storage.get(key);
        if (v) return true;
        if (v === null) return null;
        return false;
    }

    public keys() { return this.storage.keys(); }
    public get size() { return this.storage.size; }
    public clear() { this.storage.clear(); }
    //public [Symbol.iterator]() { return this.entries(); }
    public get [Symbol.toStringTag]() { return this.storage[Symbol.toStringTag]; }
}

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

