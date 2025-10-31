import { Uint, Uint256, Uint64 } from "low-level";
import { shuffleArray } from "../cryptoUtils.js";
import { LevelDBUtils } from "./leveldb_utils.js";
import { PX } from "@advena/common/types/prefix";
import { LCrypt } from "@advena/crypto";
import { AddressHex } from "@advena/common/models/address";

export async function gen_old(size: number, db1: LevelDBUtils.DBs = "stake1", db2: LevelDBUtils.DBs = "stake2") {

    const level1 = await LevelDBUtils.openDB(db1);
    const level2 = await LevelDBUtils.openDB(db2);

    const hashes: Uint256[] = [];

    const emptyUint = Uint.from("00")

    for (let i = 0; i < size; i++) {
        hashes.push(new Uint256(LCrypt.randomBytes(32)));
    }

    const shuffledHashes = shuffleArray(hashes);

    for (let i = 0; i < size; i++) {
        await Promise.all([
            level1.put(hashes[i], emptyUint),
            level2.put(shuffledHashes[i], emptyUint)
        ]);
    }

    await level1.close();
    await level2.close();
}

export async function gen(size: number, db: LevelDBUtils.DBs = "stake1") {

    const level = await LevelDBUtils.openDB(db);
    
    const validator_preifx = PX.A_0e;
    const metaDataPrefix = PX.META;

    const promises: Promise<void>[] = [];

    for (let i = 0; i < size; i++) {
        promises.push(
            level.put(
                Uint.concat([
                    validator_preifx,
                    Uint.from(i)
                ]),
                Uint.concat([
                    // Withdraw Address
                    new AddressHex(LCrypt.randomBytes(21)).getBody(),

                    // Stake Amount
                    Uint64.from(32_0000_0000)
                ])
            )
        );
    }

    //& length
    await level.put(Uint.concat([metaDataPrefix, Uint.from("00ed")]), Uint.from(size));

    await Promise.all(promises);
    await level.close();
}

export async function gen_minter(size: number, db: LevelDBUtils.DBs = "stake1") {

    const level = await LevelDBUtils.openDB(db);
    
    const validator_preifx = PX.A_0e;
    const version_Prefix = PX.V_00;

    const promises: Promise<void>[] = [];

    for (let i = 0; i < size; i++) {
        promises.push(
            level.put(
                AddressHex.fromTypeAndBody(validator_preifx, LCrypt.sha256(Uint64.from(i)).slice(0, 20)),
                Uint.concat([
                    version_Prefix,
                    Uint64.from(32_0000_0000)
                ])
            )
        );
    }

    await Promise.all(promises);
    await level.close();
}

