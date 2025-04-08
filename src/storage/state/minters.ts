import { MinterData } from "@leicoin/common/models/minterData";
import { type Block } from "@leicoin/common/models/block";
import { AddressHex } from "@leicoin/common/models/address";
import { type Uint, Uint64 } from "low-level";
import { LevelBasedStorageWithRangeIndexes } from "../leveldb/levelBasedStorage.js";
import { PX } from "@leicoin/common/types/prefix";
import { LCrypt } from "@leicoin/crypto";
import type { StorageAPI } from "../api.js";

export interface IMinterDB extends StorageAPI.IChainStateStore<AddressHex, MinterData> {
    get(address: AddressHex): Promise<MinterData | null>;
    set(minter: MinterData): Promise<void>;
    exists(address: AddressHex): Promise<boolean>;
    del(address: AddressHex): Promise<void>;

    getAllAddresses(): Promise<Uint[]>;
    selectNextMinter(slot: Uint64): Promise<AddressHex>;
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
        return this.level.put(minter.address, minter.encodeToHex());
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

        for await (const key of minterAddressesStream) {
            if (count.eq(offset)) {
                minterAddressesStream.destroy();
                return new AddressHex(key);
            }
            count.iadd(1);
        }

        return null;
    }

    async selectNextMinter(slot: Uint64) {
        
        const dbSize = await this.indexes.getTotalSize();

        // get a random index from the database size and the hash of the slot index
        const randomIndex = LCrypt.sha256(slot).mod(dbSize);
        const result = await this.getAddressByIndex(Uint64.from(randomIndex));

        if (!result) {
            throw new Error("Error in selectNextMinter: Index is not part of any range. Is the Database initialized and indexed?");
        }
        return result;        
    }

    async getAllAddresses() {
        return this.level.keys().all();
    }

}

