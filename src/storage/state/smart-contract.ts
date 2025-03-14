import { AddressHex } from "@leicoin/common/models/address";
import { Uint } from "low-level";
import { LevelBasedStorage } from "../leveldb/levelBasedStorage.js";

export class SmartContractStateDB extends LevelBasedStorage {

    protected path = "/smart-contracts/state";

    public async getState(address: AddressHex) {
        return this.level.safe_get(address.getBody());
    }

    public async setState(address: AddressHex, state: Uint) {
        return this.level.put(address.getBody(), state);
    }

}


