import { Uint, Uint64 } from "low-level";
import { LevelDBUtils } from "../leveldb_utils.js";
import { AddressHex } from "@advena/common/models/address";
import { PX } from "@advena/common/types/prefix";
import { LCrypt } from "@advena/crypto";
import { LevelDB } from "@advena/storage/leveldb/index";
import { LevelIndexes } from "@advena/storage/leveldb/indexes";

export const metaSizeAddress = AddressHex.fromTypeAndBody(PX.META, Uint.from(2, 20));
export const firstMetaAddress = AddressHex.fromTypeAndBody(PX.META, Uint.alloc(20));

export async function generateMinterDB(size: number, db: LevelDBUtils.DBs) {
    const level = await LevelDBUtils.openDB(db);

    const promises: Promise<void>[] = [];

    for (let i = 0; i < size; i++) {
        promises.push(
            level.put(
                AddressHex.fromTypeAndBody(PX.A_0e, Uint.from(LCrypt.randomBytes(20))),
                Uint.concat([
                    PX.V_00,
                    Uint64.from(32_0000_0000)
                ])
            )
        );
    }

    promises.push(level.put(metaSizeAddress, Uint64.from(size)));

    await Promise.all(promises);

    return level;
}


export async function selectNextMinter1(slot: Uint64, level: LevelDB, indexes?: any) {
    const size = await level.get(metaSizeAddress);
    const randomIndex = LCrypt.sha256(slot).mod(size);

    const count = Uint64.from(0);
    const minterAddressesStream = level.createKeyStream({lt: firstMetaAddress});
    for await (const key of minterAddressesStream) {
        if (count.eq(randomIndex)) {
            minterAddressesStream.destroy();
            return new AddressHex(key);
        }
        count.iadd(1);
    }
    process.exit(1); // Should never reach this point
}


export async function indexDB(level: LevelDB) {
    const indexes = new LevelIndexes(level, 20, PX.A_0e);
    await indexes.load();
    return indexes;
}

export async function selectNextMinter2(slot: Uint64, level: LevelDB, indexes: LevelIndexes) {
    const size = await indexes.getTotalSize();
    const randomIndex = LCrypt.sha256(slot).mod(size);

    const { range, offset } = await indexes.getRangeByIndex(Uint64.from(randomIndex));

    const count = Uint64.from(0);

    const minterAddressesStream = level.createKeyStream({gte: range.firstPossibleKey, lte: range.lastPossibleKey});
    for await (const key of minterAddressesStream) {
        if (count.eq(offset)) {
            minterAddressesStream.destroy();
            return new AddressHex(key);
        }
        count.iadd(1);
    }

    throw new Error("Index is not part of any range. Are the ranges initialized?");
}

export { selectNextMinter2 as selectNextMinter };
