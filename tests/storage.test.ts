import { describe, test, expect } from "bun:test";
import { StorageBackend } from "@advena/storage";
import { AddressHex } from "@advena/common/models/address";
import { MinterData } from "@advena/common/models/minterData";
import { AbstractRangeIndexes, BasicRangeIndexes } from "@advena/storage/leveldb/rangeIndexes";
import { Uint64, Uint, BasicBinaryMap, BasicUintConstructable } from "low-level";
import { PX } from "@advena/common/types/prefix";
import { Stores } from "@advena/storage/store";
import { Ref } from "ptr.js";
import { LCrypt } from "@advena/crypto";
import { QuickSort } from "@advena/utils/quick-sort";

class FakeStorageBackend<K extends Uint, V extends Uint> implements StorageBackend.IBackend<K, V> {

    protected readonly store: BasicBinaryMap<K, Uint>;

    constructor(keyCLS: BasicUintConstructable<K>) {
        this.store = new BasicBinaryMap<K, Uint>(keyCLS);
    }



    async put(key: K, value: V) {
        this.store.set(key, value as any);
    }

    async get(key: K): Promise<V | null> {
        const value = this.store.get(key);
        if (!value) {
            return null;
        }
        return value as any;
    }

    async exists(key: K): Promise<boolean> {
        return this.store.has(key);
    }

    async del(key: K): Promise<void> {
        this.store.delete(key);
    }

    public createKeyStream(options?: StorageBackend.Types.Stream.CreateOptions<Uint>): StorageBackend.Types.Stream<Uint> {
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

class FakeStorageBackendWithIndexes<K extends Uint, V extends Uint, ByteLength extends number, Prefix extends Uint> extends FakeStorageBackend<K, V> implements StorageBackend.IBackendWithIndexes<K, V, ByteLength, Prefix> {

    protected readonly indexes: AbstractRangeIndexes<Uint>;
    constructor(keyCLS: BasicUintConstructable<K>, readonly byteLength: ByteLength, readonly prefix: Prefix) {
        super(keyCLS);
        this.indexes = new BasicRangeIndexes<Uint>(byteLength, prefix);
    }



    async loadIndexes() {
        this.indexes.load(this);
    }

    getIndexes(): AbstractRangeIndexes<Uint> {
        return this.indexes;
    }
    getDBSize(): number {
        return this.indexes.getTotalSize();
    }
}

// abstract class FakeStateStorageBackend<K extends Uint, V extends Uint> extends FakeStorageBackend<K, V> implements StorageBackend.IChainStateStore<K, V> {

//     abstract set(value: V): Promise<void>;

//     public createKeyStream(options?: StorageBackend.Types.Stream.CreateOptions<K>): StorageBackend.Types.Stream<K> {
//         const keys = this.store.keys().all();
//         QuickSort.UintArray.sort(keys);

//         return {
//             async *[Symbol.asyncIterator]() {
//                 for (const key of keys) {
//                     if (options?.gte && key.lt(options.gte)) continue;
//                     if (options?.lte && key.gt(options.lte)) continue;
//                     yield key;
//                 }
//             },
//             async destroy() {}
//         }
//     }
// }

// class FakeMinterStorageBackend extends FakeStateStorageBackend<AddressHex, MinterData> implements StorageBackend.MinterDB.Abstract {

//     protected readonly indexes = new BasicRangeIndexes<Uint>(20, PX.A_0e);

//     constructor() {
//         super(AddressHex);
//     }

//     async get(address: AddressHex): Promise<MinterData | null> {
//         const raw_minter_data = this.store.get(address);
//         if (!raw_minter_data) return null
//         return MinterData.fromDecodedHex(address, raw_minter_data);
//     }

//     async set(minter: MinterData): Promise<void> {
//         if (!await this.exists(minter.address)) {
//             await this.indexes.addKey(minter.address);
//         }
//         this.store.set(minter.address, minter.encodeToHex());
//     }

//     async del(address: AddressHex): Promise<void> {
//         const exists = await this.exists(address);
//         if (exists) {
//             await this.indexes.removeKey(address);
//             this.store.delete(address);
//         }
//     }

//     getIndexes(): AbstractRangeIndexes<Uint> {
//         return this.indexes;
//     }

//     getDBSize() {
//         return this.indexes.getTotalSize();
//     }

// }


describe("storage", () => {

    test("fake_storage", async () => {

        const fakeStateStorage = new FakeStorageBackend(AddressHex);

        for (let i = 0; i < 1_000; i++) {
            const address = AddressHex.fromTypeAndBody(PX.A_0e, new Uint(LCrypt.randomBytes(20)));
            const data = new MinterData(address, Uint64.from(100_000_000));
            await fakeStateStorage.put(address, data.encodeToHex());
        }

        const keyStream = fakeStateStorage.createKeyStream();

        const latestKey = Uint.from(0);

        for await (const key of keyStream) {
            expect(key.lt(latestKey)).toBe(false);
        }


    });


    test("minter", async () => {


        const baseStorage = new FakeStorageBackendWithIndexes(Uint, 20, PX.A_0e);

        const minters1 = new Stores.MinterState(new Ref(true), baseStorage);

        const dummyData1 = Array.from({ length: 10 }, (_, i) => {

            return new MinterData(
                AddressHex.fromTypeAndBody(PX.A_0e, new Uint(LCrypt.randomBytes(20))),
                Uint64.from(100_000_000)
            );
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
            return new MinterData(
                AddressHex.fromTypeAndBody(PX.A_0e, new Uint(LCrypt.randomBytes(20))),
                Uint64.from(100_000_000)
            );
        });

        for (const data of dummyData2) {
            await minters1.set(data);
            await minters2.set(data);
            expect((await minters1.get(data.address))?.encodeToHex().toHex()).toEqual(data.encodeToHex().toHex());
            expect((await minters2.get(data.address))?.encodeToHex().toHex()).toEqual(data.encodeToHex().toHex());
        }

        expect(await minters1.getAddressByIndex(Uint64.from(10))).toEqual(await minters2.getAddressByIndex(Uint64.from(10)));        

    });

    /*
    test("minter_real", async () => {
        
        const realLevel = Blockchain.minters;

        const fakeMinters1 = new Stores.MinterState(new Ref(false), new FakeMinterStorage());
        const fakeMinters2 = new Stores.MinterState(new Ref(false), realLevel);

        for await (const address of realLevel.createKeyStream()) {
            const data = await realLevel.get(new AddressHex(address));
            if (!data) throw new Error("Data not found");
            await fakeMinters1.set(data);
        }

        for (let slot = Uint64.from(0); slot.lt(5); slot = slot.add(1)) {
            const levelProposer = await realLevel.selectNextMinter(slot);
            const fakeStorageProposer1 = await MinterHandler.getProposer(slot, fakeMinters1);
            const fakeStorageProposer2 = await MinterHandler.getProposer(slot, fakeMinters2);
        
            expect(fakeStorageProposer1.toHex()).toEqual(levelProposer.toHex());
            expect(fakeStorageProposer2.toHex()).toEqual(levelProposer.toHex());
        }
    
        
        for await (const data of realLevel.createKeyStream()) {

            fakeMinters1.del(new AddressHex(data));
            fakeMinters2.del(new AddressHex(data));

            const dummyMinter = new MinterData(
                AddressHex.fromTypeAndBody(PX.A_0e, new Uint(LCrypt.randomBytes(20))),
                Uint64.from(100_000_000)
            );

            await fakeMinters1.set(dummyMinter);
            await fakeMinters2.set(dummyMinter);
        }
        
        for (let slot = Uint64.from(0); slot.lt(5); slot = slot.add(1)) {

            const proposer1 = await MinterHandler.getProposer(slot, fakeMinters1);
            const proposer2 = await MinterHandler.getProposer(slot, fakeMinters2);
        
            expect(proposer1.toHex()).toEqual(proposer2.toHex());
        }

    });
    */

});