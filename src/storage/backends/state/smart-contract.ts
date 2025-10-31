import { AddressHex } from "@advena/common/models/address";
import { Uint } from "low-level";
import { LevelBasedStorage } from "../../leveldb/levelBasedStorage.js";

export class SmartContractStateLevelBackend extends LevelBasedStorage<AddressHex, Uint> {

    constructor() {
        super("/smart-contracts/state");
    }

    public async get(address: AddressHex) {
        return this.level.get(address.getBody());
    }

    public async set(address: AddressHex, state: Uint) {
        return this.level.put(address.getBody(), state);
    }

}


