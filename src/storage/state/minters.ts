import { MinterData } from "@leicoin/common/models/minterData";
import { Block } from "@leicoin/common/models/block";
import { AddressHex } from "@leicoin/common/models/address";
import { Uint, Uint64 } from "low-level";
import { LevelBasedStorageWithRangeIndexes } from "../leveldb/levelBasedStorage.js";
import { PX } from "@leicoin/common/types/prefix";
import { LCrypt } from "@leicoin/crypto";

export class MinterDB extends LevelBasedStorageWithRangeIndexes {
    protected path = "/validators";

    protected keyByteLengthWithoutPrefix = 20;
    protected keyPrefix = PX.A_0e;

    public async getMinter(address: AddressHex) {
        const raw_minter_data = await this.getData(address);
        if (!raw_minter_data) return null;
        return MinterData.fromDecodedHex(address, raw_minter_data);
    }

    public async setMinter(minter: MinterData) {
        return this.level.put(minter.address, minter.encodeToHex());
    }

    public async removeMinter(minter: MinterData) {
        return this.delData(minter.address);
    }

    private async adjustStakeByBlock(block: Block) {
        
        //const inActive = this.getMinterInLevel(address, "active");

    }

    public async selectNextMinter(slot: Uint64) {
        const dbSize = await this.indexes.getTotalSize();
        const randomIndex = LCrypt.sha256(slot).mod(dbSize);

        const { range, offset } = await this.indexes.getRangeByIndex(Uint64.from(randomIndex));

        const count = Uint64.from(0);
        const minterAddressesStream = this.level.createKeyStream({gte: range.firstPossibleKey, lte: range.lastPossibleKey});

        for await (const key of minterAddressesStream) {
            if (count.eq(offset)) {
                minterAddressesStream.destroy();
                return new AddressHex(key);
            }
            count.iadd(1);
        }

        throw new Error("Error in selectNextMinter: Index is not part of any range. Is the Database initialized and indexed?");
    }

}

