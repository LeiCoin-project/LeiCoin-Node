import { MinterData } from "@advena/common/models/minterData";
import { AddressHex } from "@advena/common/models/address";
import { type Uint, Uint64 } from "low-level";
import { LevelBasedStateStorageWithIndexes } from "../../leveldb/levelBasedStorage.js";
import { PX } from "@advena/common/types/prefix";
import type { StorageBackend } from "../exports/index.js";


export interface IMinterDB extends StorageBackend.IChainStateStoreWithIndexes<AddressHex, MinterData> {
    get(address: AddressHex): Promise<MinterData | null>;
    set(minter: MinterData): Promise<void>;
    exists(address: AddressHex): Promise<boolean>;
    del(address: AddressHex): Promise<void>;
}

export class MinterLevelBackend extends LevelBasedStateStorageWithIndexes<AddressHex, MinterData> implements IMinterDB {

    constructor() {
        super("/minters", undefined, {
            keyByteLengthWithoutPrefix: 20,
            keyPrefix: PX.A_0e,
        });
    }

    async get(address: AddressHex) {
        const raw_minter_data = await this.level.get(address);
        if (!raw_minter_data) return null;
        return MinterData.fromDecodedHex(address, raw_minter_data);
    }

    async set(minter: MinterData) {
        if (!await this.exists(minter.address)) {
            await this.indexes.addKey(minter.address);
        }
        return this.level.put(minter.address, minter.encodeToHex());
    }

    async del(key: AddressHex): Promise<void> {
        const exists = await this.exists(key);
        if (exists) {
            await this.indexes.removeKey(key);
            return super.del(key);
        }
    }

}

