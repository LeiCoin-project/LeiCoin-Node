import { UintMap } from "low-level";
import { Uint, Uint64 } from "low-level";
import { type LevelIndexes } from "../../../src/storage/leveldb/indexes.js";
import { LevelDBUtils } from "../leveldb_utils.js";
import { firstMetaAddress, generateMinterDB, indexDB, selectNextMinter } from "./utils.js";
import { AddressHex } from "@advena/common/models/address";
import { getElapsedTime, startTimer } from "../../utils/testUtils.js";
import { LevelDB } from "@advena/storage/leveldb/index";
import { LCrypt } from "@advena/crypto";

async function calulateResults(frequency: UintMap<Uint64>, slotsCount: number, prefixLength: number) {
    const expectedFrequency = slotsCount / 256 ** prefixLength;

    let totalDeviation = 0;
    let highestDeviation = 0;
    let highestDeviation_prefix: Uint | undefined;

    for (let [prefix, count] of frequency) {
        const actualFreq = count.toInt();
        const deviation = Math.abs(actualFreq - expectedFrequency);
        totalDeviation += deviation;

        if (deviation > highestDeviation) {
            highestDeviation = deviation;
            highestDeviation_prefix = prefix;
        }
    }

    console.log("- Expected Frequency:", expectedFrequency);
    console.log("- Highest Deviation:", highestDeviation);
    console.log("- Highest Deviation Prefix:", highestDeviation_prefix?.toHex());
}


async function testRandomness(level: LevelDB, indexes: LevelIndexes, slotsCount: number, prefixLength: number) {
    console.log("Testing randomness of minter selection algorithm:");

    const addresses: AddressHex[] = [];
    
    const startTime = startTimer();

    for (let i = 0; i < slotsCount; i++) {
        addresses[i] = await selectNextMinter(Uint64.from(i), level, indexes);
    }

    const elapsedTime = getElapsedTime(startTime);

    console.log(`Tested ${slotsCount} slots in ${elapsedTime.toFixed(1)}ms`);
    console.log(`Average time per slot: ${(elapsedTime / slotsCount).toFixed(2)}ms`);

    const frequency = new UintMap<Uint64>(addresses.map(address => [address.getBody().slice(0, prefixLength), Uint64.from(0)]));
    for (const address of addresses) {
        const prefix = address.getBody().slice(0, prefixLength);
        (frequency.get(prefix) as Uint64).iadd(1);
    }

    await calulateResults(frequency, slotsCount, prefixLength);
}

async function testDBRandomness(level: LevelDB, mintersCount: number, prefixLength: number) {
    console.log("\nRandomness of Database:");

    const frequency = new UintMap<Uint64>();

    for await (const address of level.keys({lt: firstMetaAddress})) {
        const prefix = address.slice(1, prefixLength + 1);
        if (!frequency.has(prefix)) {
            frequency.set(prefix, Uint64.from(0));
        } else {
            frequency.get(prefix)!.iadd(1);
        }
    }
    await calulateResults(frequency, mintersCount, prefixLength);
}

async function testNumberRandomness(mintersCount: number, slot_count: number, prefixLength: number) {
    console.log("\nRandomness of Index Generation:");

    const frequency = new UintMap<Uint64>();

    for (let i = 0; i < slot_count; i++) {
        const slotHash = LCrypt.sha256(Uint64.from(i));
        const randomIndex = Uint.from(slotHash.mod(mintersCount), prefixLength);

        if (!frequency.has(randomIndex)) {
            frequency.set(randomIndex, Uint64.from(0));
        } else {
            frequency.get(randomIndex)!.iadd(1);
        }
    }
    await calulateResults(frequency, slot_count, prefixLength);

}

async function main(gen = true, destroy = true) {
    const args = process.argv.slice(2);

    const mintersCount = parseInt(args[0]) || 1000;
    const slotsCount = parseInt(args[1]) || 1000;
    const prefixLength = parseInt(args[2]) || 1;

    let level: LevelDB;

    if (gen) {
        await LevelDBUtils.destroyDB("stake1");
        level = await generateMinterDB(mintersCount, "stake1");
        console.log(`Generated minter database with ${mintersCount} minters`);
    } else {
        level = await LevelDBUtils.openDB("stake1");
        console.log("Initialized minter database");
    }

    const indexes = await indexDB(level);

    await testRandomness(level, indexes, slotsCount, prefixLength);
    //await testDBRandomness(level, mintersCount, prefixLength);
    //await testNumberRandomness(mintersCount, slotsCount, prefixLength);

    await level.close();
    if (destroy) {
        await LevelDBUtils.destroyDB("stake1");
    }
}

await main(true, true);
