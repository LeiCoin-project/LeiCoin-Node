import { BasicBinaryMap, type BasicUintConstructable, type Uint } from "low-level";
import type { StorageAPI } from "../api";

export abstract class AbstractChainStore<K extends Uint, V, S extends StorageAPI.IChainStore<K, V>> {

    protected readonly tempStorage: BasicBinaryMap<K, V>;

    constructor(
        public isMainChain: boolean,
        protected readonly storage: S,
        keyCLS: BasicUintConstructable<K>,
    ) {
        this.tempStorage = new BasicBinaryMap<K, V>(keyCLS);
    }

    // @ts-ignore
    async get(key: K): ReturnType<S["get"]> {
        const value = this.tempStorage.get(key);
        if (value) {
            return value as any;
        }
        return await this.storage.get(key) as any;
    }

    async exists(key: K) {
        if (this.tempStorage.has(key)) {
            return true;
        }
        return this.storage.exists(key);
    }
    
    async del(key: K) {
        const result = await this.storage.del(key);
        if (this.isMainChain) {
            return result || this.tempStorage.delete(key);
        }
        return result;
    }

}


export abstract class AbstractChainStateStore<K extends Uint, V, S extends StorageAPI.IChainStateStore<K, V>> extends AbstractChainStore<K, V, S> {
    abstract set(value: V): Promise<void>;
}

