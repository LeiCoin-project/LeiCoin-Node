import { MinterData } from "@leicoin/common/models/minterData";
import { type Block } from "@leicoin/common/models/block";
import { AddressHex } from "@leicoin/common/models/address";
import { type Uint, Uint64 } from "low-level";
import { LevelBasedStorageWithRangeIndexes } from "../leveldb/levelBasedStorage.js";
import { PX } from "@leicoin/common/types/prefix";
import { LCrypt } from "@leicoin/crypto";
import type { StorageAPI } from "../index.js";
import type { MinterHandler } from "@leicoin/pos/minter-handler";
import type { LevelRangeIndexes } from "../leveldb/rangeIndexes.js";

interface IMinterDB extends StorageAPI.IChainStateStoreWithIndexes<AddressHex, MinterData> {
    get(address: AddressHex): Promise<MinterData | null>;
    set(minter: MinterData): Promise<void>;
    exists(address: AddressHex): Promise<boolean>;
    del(address: AddressHex): Promise<void>;

    getAllAddresses(): Promise<Uint[]>;
    selectNextMinter(slot: Uint64): Promise<AddressHex>;

    getIndexes(): LevelRangeIndexes;
}

export class MinterDB extends LevelBasedStorageWithRangeIndexes<AddressHex, MinterData> implements IMinterDB {

    protected keyByteLengthWithoutPrefix = 20;
    protected keyPrefix = PX.A_0e;

    constructor() {
        super("/minters");
    }

    async get(address: AddressHex) {
        const raw_minter_data = await this.level.get(address);
        if (!raw_minter_data) return null;
        return MinterData.fromDecodedHex(address, raw_minter_data);
    }

    async set(minter: MinterData) {
        if (!await this.exists(minter.address)) {
            await this.indexes.addKey(minter.address.getBody());
        }
        return this.level.put(minter.address, minter.encodeToHex());
    }

    async del(key: AddressHex): Promise<void> {
        const exists = await this.exists(key);
        if (exists) {
            await this.indexes.removeKey(key.getBody());
            return super.del(key);
        }
    }

    private async adjustStakeByBlock(block: Block) {
        
        //const inActive = this.getMinterInLevel(address, "active");

    }

    /**
     * get a minter address by an index in all minters
     * @param index - the index of the minter to get
     * @returns the address of the minter at the given index or null if the index is out of range
     */
    async getAddressByIndex(index: Uint64) {
        
        const { range, offset } = await this.indexes.getRangeByIndex(index);

        const count = Uint64.from(0);
        const minterAddressesStream = this.level.createKeyStream({gte: range.firstPossibleKey, lte: range.lastPossibleKey});

        for await (const addr of minterAddressesStream) {
            if (count.eq(offset)) {
                minterAddressesStream.destroy();
                return new AddressHex(addr);
            }
            count.iadd(1);
        }

        return null;
    }

    /**
     * @deprecated Use {@link MinterHandler.getProposer} instead.
     */
    async selectNextMinter(slot: Uint64) {
        
        throw new Error("Deprecated. Use MinterHandler.getProposer instead.");

        const dbSize = await this.indexes.getTotalSize();

        // get a random index from the database size and the hash of the slot index
        const randomIndex = LCrypt.sha256(slot).mod(dbSize);
        const result = await this.getAddressByIndex(Uint64.from(randomIndex));

        if (!result) {
            throw new Error("Error in selectNextMinter: Index is not part of any range. Is the Database initialized and indexed?");
        }
        return result as AddressHex;        
    }

    async getAllAddresses() {
        return this.level.keys().all();
    }

    public getIndexes() {
        return this.indexes;
    }

}

