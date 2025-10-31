import crypto from 'crypto';
import { startTimer, getElapsedTime } from "@advena/utils/testUtils";
import { Uint, Uint256, Uint64 } from "../build/s@advena/utils/binary";
import Crypto from "../build/src/crypto/index.js";
import { AddressHex } from "../build/src/common/models/address.js";
import { PublicKey } from "../build/src/crypto/cryptoKeys.js";
import * as levelDBUtils from "./leveldb_utils.js";
import { PX } from '../build/src/objects/prefix.js';
import LevelDB from '../build/src/storage/leveldb.js';


const db = "smart-contract";
const validator_length = 20 + Uint64.byteLength;
const deposit_address = AddressHex.from("0c0000000000000000000000000000000000000001");


export class Validator {

    /** @public @type {AddressHex} */ address;
    /** @public @type {Uint64} */ amount;

    /** @type {(address: AddressHex, amount: Uint64) => Validator} */
    constructor(address, amount) {
        this.address = address;
        this.amount = amount;
    }

    /** @type {(uint: Uint) => Validator} */
    static fromDecodedHex(uint) {
        return new this(
            AddressHex.fromTypeAndBody(PX.A_00, uint.slice(0, 20)),
            new Uint64(uint.slice(20, 28))
        );
    }

}


/** @type {(size: number) => Promise<void>} */
async function genDeposit(size) {
    const level = await levelDBUtils.openDB(db);

    const validators = [];

    for (let i = 0; i < size; i++) {
        validators.push(Uint.concat([
            // Address
            new AddressHex(crypto.randomBytes(21)).getBody(),
            // Stake Amount
            Uint64.from(32_0000_0000)
        ]));
    }

    await level.put(deposit_address, Uint.concat(validators));

    await level.close();
}

/** @type {(size: number) => Promise<void>} */
async function genActive(size) {
    const level = await levelDBUtils.openDB(db);

    const validators = [];

    for (let i = 0; i < size; i++) {
        validators.push(Uint64.from(i));
    }

    await level.put(deposit_address, Uint.concat(validators));

    await level.close();
}

/** @type {(level: LevelDB) => Promise<Uint64[]>} */
async function getActiveValidators(level) {
    return (await level.get(deposit_address)).nci_split(Uint64, 8);
}

/** @type {(level: LevelDB) => Promise<Uint[]>} */
async function getValidators(level) {
    return (await level.get(deposit_address)).split(validator_length);
}


/** @type {(seedHash: Uint256) => Promise<[import('../build/s@advena/utils/objects').Dict<Uint>, number, boolean]>} */
async function selectNextValidators(seedHash) {
    const level = await levelDBUtils.openDB(db);

    let using_first_validators = false;

    let elapsedTime;
    const startTime = startTimer();

    const validators = getValidators(level);

    if (validators_count.lte(128)) {
        using_first_validators = true;
        for await (const [index, data] of level.iterator()) {
            if (index.slice(0, 1).eq(PX.META)) continue;
            validators[index.slice(1).toInt()] = data;
        }
    } else {
        let nextHash = seedHash;
        const takenIndexes = [];

        while (takenIndexes.length !== 128) {
            let nextIndex = nextHash.mod(validators_count);

            if (!takenIndexes.includes(nextIndex)) {
                takenIndexes.push(nextIndex);

                const validator_index = Uint.from(nextIndex);

                const validator_data = await level.get(Uint.concat([validator_preifx, validator_index]));
                validators[nextIndex] = validator_data;
            }
            nextHash = Crypto.sha256(Uint.concat([nextHash, seedHash]));
        }
        elapsedTime = getElapsedTime(startTime);
    }
    elapsedTime = getElapsedTime(startTime);
    await level.close();
    return [validators, elapsedTime, using_first_validators];
}


async function testGetValidators(func = getValidators) {

    const level = await levelDBUtils.openDB(db);
    
    const startTime = startTimer();

    const validators = await func(level);

    const elapsedTime = getElapsedTime(startTime);

    level.close();

    console.log("Elapsed time:", elapsedTime / 1000, "seconds");
    console.log(validators[0]);
    console.log(validators.length.toLocaleString());
}

//genDeposit(1_000_000)
//genActive(1_000_000)

//testGetValidators(getActiveValidators);
