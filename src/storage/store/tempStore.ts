import type { EncodeableObjInstance, EncodeableObj } from "flexbuf";
import { BasicBinaryMap, BasicBinarySet, Uint, type BasicUintConstructable } from "low-level";
import type { BasicRangeIndexes } from "../leveldb/rangeIndexes";


type TempStorageBackend<K extends Uint> = (BasicBinaryMap<K, Uint> | BasicBinarySet<K>) & {
    set(key: K, value: Uint | null): void;
}


// /**
//  * In Memory Storage for storing chain modifications.
//  */
// class SimpleTempStorage<K extends Uint, V extends EncodeableObjInstance> {

//     protected readonly storage: BasicBinaryMap<K, Uint | null>;
//     protected readonly deletedAmount: number;

//     constructor(
//         protected readonly keyCLS: BasicUintConstructable<K>,
//         protected readonly ValueCLS: EncodeableObj<V>
//     ) {
//         this.storage = new BasicBinaryMap(this.keyCLS);
//         this.deletedAmount = 0;
//     }

//     /**
//      * Get the value for the given key.
//      * @param key the key to get the value for.
//      * @returns the value or undefined if not found. null if marked as deleted.
//      */
//     public get(key: K, asRaw?: false): V | null | undefined;
//     public get(key: K, asRaw: true): Uint | null | undefined;
//     public get(key: K, asRaw: boolean): V | Uint | null | undefined;
//     public get(key: K, asRaw = false) {
//         const raw = this.storage.get(key);
//         if (!raw || asRaw) return raw;

//         const value = this.ValueCLS.fromDecodedHex(raw, false);
//         return value ? value : undefined;
//     }

//     /**
//      * Set the value for the given key.
//      * @param key the key to set the value for.
//      * @param value the value to set. null if marked as deleted.
//      * @returns the previous value or null if not found.
//      */
//     public set(key: K, value: V | Uint | null) {
//         if (!value || Uint.isUint(value)) {
//             return this.storage.set(key, value);
//         }
//         const raw = value.encodeToHex(false);
//         return this.storage.set(key, raw);
//     }

//     /**
//      * Delete the value for the given key.
//      * @param key the key to delete the value for.
//      * @param fully if true, the value is deleted from the storage. if false, the value is ony marked as deleted.
//      * @returns true if deleted, false if not found.
//      */
//     public delete(key: K, fully?: false): true;
//     public delete(key: K, fully: true): boolean;
//     public delete(key: K, fully: boolean): true | boolean;
//     public delete(key: K, fully = false) {
//         if (fully) {
//             return this.storage.delete(key);
//         }
//         this.storage.set(key, null);
//         return true;
//     }

//     /**
//      * Check if a key-value pair exists in the storage.
//      * @param key the key to check if exists.
//      * @returns true if exists, false if not found. null if marked as deleted.
//      */
//     public has(key: K) {
//         const v = this.storage.get(key);
//         if (v) return true;
//         if (v === null) return null;
//         return false;
//     }

//     /**
//      * Get the full number of keys in the storage even the ones marked as deleted.
//      */
//     public get size() {
//         return this.storage.size;
//     }

//     /**
//      * Get the number of keys in the storage that are marked as deleted.
//      */
//     public get deleted() {
//         return this.deletedAmount;
//     }

//     public keys() { return this.storage.keys(); }
//     public clear() { this.storage.clear(); }
//     //public [Symbol.iterator]() { return this.entries(); }
//     public get [Symbol.toStringTag]() { return this.storage[Symbol.toStringTag]; }
// }


// export enum TSValueType {
//     ADDED = 0,
//     MODIFIED = 1,
//     DELETED = 2,
// }

// type TempStoreValueMetaTypesMap = {
//     [TSValueType.ADDED]: EncodeableObjInstance;
//     [TSValueType.MODIFIED]: EncodeableObjInstance;
//     [TSValueType.DELETED]: null;
// }

// const TempStoreValueStrTypesMap = {
//     [TSValueType.ADDED]: "added",
//     [TSValueType.DELETED]: "deleted",
// } as const;

// export class TempStoreValue<
//     T extends TempStoreValueMetaTypesMap[M],
//     M extends TSValueType = TSValueType
// > {

//     public readonly meta: M;
//     public readonly data: T;

//     constructor(meta: M, data: T) {
//         this.meta = meta;
//         this.data = data;
//     }


//     static createDeleted() {
//         return new TempStoreValue(TSValueType.DELETED, null);
//     }


//     public encodeToHex() {
//         const arr: Uint[] = [Uint8.from(this.meta)];
//         if (this.data) {
//             arr.push(this.data.encodeToHex(false));
//         }
//         return Uint.concat(arr);
//     }

//     static fromDecodedHex<T extends EncodeableObjInstance>(raw: Uint, dataCLS: EncodeableObj<T>) {

//         const meta = new Uint8(raw.slice(0, 1));

//         if (meta.eq(TSValueType.ADDED) || meta.eq(TSValueType.MODIFIED)) {

//             const data = dataCLS.fromDecodedHex(raw.slice(1), false);
//             if (!data) throw new Error("Invalid TempStoreValue data.");

//             return new TempStoreValue<T>(meta.toInt(), data);

//         } else if (meta.eq(TSValueType.DELETED)) {

//             return new TempStoreValue(meta.toInt(), null);
//         }

//         throw new Error("Invalid TempStoreValue type.");
//     }
// }

// //export { type TempStoreValue };

// export namespace TempStoreValue {
//     export type Added<T extends EncodeableObjInstance> = TempStoreValue<T, TSValueType.ADDED>;
//     export type Modified<T extends EncodeableObjInstance> = TempStoreValue<T, TSValueType.MODIFIED>;
//     export type Deleted = TempStoreValue<null, TSValueType.DELETED>;
// }



type TempStorageValueType = "added" | "modified" | "deleted";

/**
 * Temporary storage for storing chain modifications.
 * Stores every entry with extra metadata about the modification (added, modified, deleted).
 */
export class TempStorage<K extends Uint, V extends EncodeableObjInstance> {

    readonly added: BasicBinaryMap<K, Uint>;
    readonly modified: BasicBinaryMap<K, Uint>;
    readonly deleted: BasicBinarySet<K>;

    constructor(
        protected readonly keyCLS: BasicUintConstructable<K>,
        protected readonly ValueCLS: EncodeableObj<V>
    ) {
        this.added = new BasicBinaryMap(this.keyCLS);
        this.modified = new BasicBinaryMap(this.keyCLS);
        this.deleted = new BasicBinarySet(this.keyCLS);
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
        const raw = this.added.get(key) || this.modified.get(key) || (this.deleted.has(key) ? null : undefined);
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
    public set(key: K, value: V | Uint, type: "added" | "modified"): void;
    public set(key: K, value: null, type?: "deleted"): void;
    public set(key: K, value: V | Uint | null, type: TempStorageValueType = "deleted") {

        this.added.delete(key);
        this.modified.delete(key);
        this.deleted.delete(key);
        
        if (!value || Uint.isUint(value)) {
            return (this[type] as TempStorageBackend<K>).set(key, value);
        }
        const raw = value.encodeToHex(false);
        return (this[type] as TempStorageBackend<K>).set(key, raw);
    }

    /**
     * Delete the value for the given key.
     * @param key the key to delete the value for.
     * @param fully if true, the value is deleted from the storage. if false, the value is ony marked as deleted.
     * @returns true if deleted, false if not found.
     */
    public delete(key: K, fully = false) {
        if (fully) {
            const results = [
                this.added.delete(key),
                this.modified.delete(key),
                this.deleted.delete(key)
            ];
            return results[0] || results[1] || results[2];
        }
        this.set(key, null);
        return true;
    }

    /**
     * Check if a key-value pair exists in the storage.
     * @param key the key to check if exists.
     * @returns true if exists, false if not found. null if marked as deleted.
     */
    public has(key: K) {
        if (this.isAdded(key) || this.isModified(key)) {
            return true;
        }
        if (this.isDeleted(key)) {
            return null;
        }
        return false;
    }

    public isAdded(key: K) {
        return this.added.has(key);
    }

    public isModified(key: K) {
        return this.modified.has(key);
    }

    public isDeleted(key: K) {
        return this.deleted.has(key);
    }


    /**
     * Get the full number of keys in the storage even the ones marked as deleted.
     */
    public get size() {
        const added = this.added.size;
        const modified = this.modified.size;
        const deleted = this.deleted.size;
        const total = added + modified + deleted;
        return { added, modified, deleted, total } as const;
    }

    //public [Symbol.iterator]() { return this.entries(); }
    //public keys() { return this.storage.keys(); }

    public clear() {
        this.added.clear();
        this.modified.clear();
        this.deleted.clear();
    }

    public get [Symbol.toStringTag]() {
        return this.constructor.name;
    }

}

export class TempStorageWithIndexes<K extends Uint, V extends EncodeableObjInstance> extends TempStorage<K, V> {

    constructor(
        keyCLS: BasicUintConstructable<K>,
        valueCLS: EncodeableObj<V>,
        readonly indexes: BasicRangeIndexes<K>
    ) {
        super(keyCLS, valueCLS);
    }


    public set(key: K, value: V | Uint, type: "added" | "modified"): void;
    public set(key: K, value: null, type?: "deleted"): void;
    public set(key: K, value: any, type: any = "deleted") {

        if (type === "deleted" && !this.isDeleted(key)) {

            this.indexes.removeKey(key);

        } else if (type === "added" && !this.isAdded(key)) {

            this.indexes.addKey(key);
        }

        return super.set(key, value, type);
    }

}