import { describe, test, expect } from "bun:test";
import { StorageAPI } from "@leicoin/storage/index";
import { AddressHex } from "@leicoin/common/models/address";
import { MinterData } from "@leicoin/common/models/minterData";
import { AbstractRangeIndexes, BasicRangeIndexes, LevelRangeIndexes } from "@leicoin/storage/leveldb/rangeIndexes";
import { Uint64, Uint, BasicBinaryMap, BasicUintConstructable } from "low-level";
import { PX } from "@leicoin/common/types/prefix";
import { Stores } from "@leicoin/storage/store/index";
import { Ref } from "ptr.js";
import { LCrypt } from "@leicoin/crypto";
import { QuickSort } from "@leicoin/utils/quick-sort";

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
        const keys = this.store.keys().all();
        QuickSort.UintArray.sort(keys);

        return {
            async *[Symbol.asyncIterator]() {
                for (const key of keys) {
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
        if (!result) return MinterData.createNewMinter(address);
        return MinterData.fromDecodedHex(address, result);
    }

    async set(minter: MinterData): Promise<void> {
        if (!await this.exists(minter.address)) {
            await this.indexes.addKey(minter.address);
        }
        this.store.set(minter.address, minter.encodeToHex());
    }

    async del(address: AddressHex): Promise<void> {
        const exists = await this.exists(address);
        if (exists) {
            await this.indexes.removeKey(address);
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

    test("fake_storage", async () => {

        const fakeStateStorage = new FakeMinterStorage();

        for (let i = 0; i < 1_000; i++) {
            const address = AddressHex.fromTypeAndBody(PX.A_0e, new Uint(LCrypt.randomBytes(20)));
            const data = new MinterData(address, Uint64.from(100_000_000));
            await fakeStateStorage.set(data);
        }

        const keyStream = fakeStateStorage.createKeyStream();

        const latestKey = Uint.from(0);

        for await (const key of keyStream) {
            expect(key.lt(latestKey)).toBe(false);
        }


    });


    test("minter", async () => {


        const baseStorage = new FakeMinterStorage();

        const minters1 = new Stores.MinterState(new Ref(true), baseStorage);

        const dummyData1 = Array.from({ length: 10 }, (_, i) => {
            const address = AddressHex.fromTypeAndBody(PX.A_0e, new Uint(LCrypt.randomBytes(20)));
            const data = new MinterData(address, Uint64.from(100_000_000));
            return data;
        });

        for (const data of dummyData1) {
            await minters1.set(data);
        }

        const minters2 = new Stores.MinterState(new Ref(false), baseStorage);

        for (const data of dummyData1) {
            expect((await minters1.get(data.address))?.encodeToHex().toHex()).toEqual(data.encodeToHex().toHex());
            expect((await minters2.get(data.address))?.encodeToHex().toHex()).toEqual(data.encodeToHex().toHex());
        }


        const dummyData2 = Array.from({ length: 10 }, (_, i) => {
            const address = AddressHex.fromTypeAndBody(PX.A_0e, new Uint(LCrypt.randomBytes(20)));
            const data = new MinterData(address, Uint64.from(100_000_000));
            return data;
        });

        for (const data of dummyData2) {
            await minters1.set(data);
            await minters2.set(data);
            expect((await minters1.get(data.address))?.encodeToHex().toHex()).toEqual(data.encodeToHex().toHex());
            expect((await minters2.get(data.address))?.encodeToHex().toHex()).toEqual(data.encodeToHex().toHex());
        }

        expect(await minters1.getAddressByIndex(Uint64.from(10))).toEqual(await minters2.getAddressByIndex(Uint64.from(10)));

    });

});