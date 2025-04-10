import { describe, test, expect } from "bun:test";
import { StorageAPI } from "@leicoin/storage/index";
import { AddressHex } from "@leicoin/common/models/address";
import { MinterData } from "@leicoin/common/models/minterData";
import { AbstractRangeIndexes, BasicRangeIndexes, LevelRangeIndexes } from "@leicoin/storage/leveldb/rangeIndexes";
import { Uint64, Uint, BasicBinaryMap, BasicUintConstructable } from "low-level";
import { PX } from "@leicoin/common/types/prefix";

abstract class FakeStorage<K extends Uint, V> implements StorageAPI.IChainStore<K, V> {

    protected readonly store: BasicBinaryMap<K, Uint>;

    constructor(keyCLS: BasicUintConstructable<K>) {
        this.store = new BasicBinaryMap<K, Uint>(keyCLS);
    }

    abstract get(key: K): Promise<V | null>;

    async exists(key: K): Promise<boolean> {
        return this.store.has(key);
    }

    async del(key: K): Promise<void> {
        this.store.delete(key);
    }
}

abstract class FakeStateStorage<K extends Uint, V> extends FakeStorage<K, V> implements StorageAPI.IChainStateStore<K, V> {

    abstract set(value: V): Promise<void>;

    public createKeyStream(options?: StorageAPI.Types.Stream.CreateOptions<K>): StorageAPI.Types.Stream<K> {
        return {
            async *[Symbol.asyncIterator]() {
                for (const key of this.store.keys()) {
                    if (options?.gte && key.lt(options.gte)) continue;
                    if (options?.lte && key.gt(options.lte)) continue;
                    yield key;
                }
            },
            async destroy() {}
        }
    }
}

class FakeMinterStorage extends FakeStateStorage<AddressHex, MinterData> implements StorageAPI.IMinters {

    protected readonly indexes = new BasicRangeIndexes<Uint>(20, PX.A_0e);

    constructor() {
        super(AddressHex);
    }

    async get(address: AddressHex): Promise<MinterData | null> {
        const result = this.store.get(address);
        if (!result) return null;
        return MinterData.fromDecodedHex(address, result);
    }

    async set(minter: MinterData): Promise<void> {
        if (!await this.exists(minter.address)) {
            await this.indexes.addKey(minter.address.getBody());
        }
        this.store.set(minter.address, minter.encodeToHex());
    }

    async del(address: AddressHex): Promise<void> {
        const exists = await this.exists(address);
        if (exists) {
            await this.indexes.removeKey(address.getBody());
            this.store.delete(address);
        }
    }

    getIndexes(): AbstractRangeIndexes<Uint> {
        return this.indexes;
    }

    getDBSize(): Uint64 {
        return this.indexes.getTotalSize();
    }

}


describe("storage", () => {



});