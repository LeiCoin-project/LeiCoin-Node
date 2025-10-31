import { Uint64 } from "low-level";
import { type LevelDB } from "../../../src/storage/leveldb/index.js";
import { type LevelIndexes } from "../../../src/storage/leveldb/indexes.js";
import { getElapsedTime, startTimer } from "../@advena/utils/testUtils";
import { LevelDBUtils } from "../leveldb_utils.js";
import { generateMinterDB, indexDB, selectNextMinter } from "./utils.js";

async function testSpeed(level: LevelDB, indexes: LevelIndexes, slotsCount: number) {
    console.log("Testing speed...");
    
    const startTime = startTimer();
    for (let i = 0; i < slotsCount; i++) {
        await selectNextMinter(Uint64.from(i), level, indexes);
    }
    const elapsedTime = getElapsedTime(startTime);

    console.log(`Tested ${slotsCount} slots in ${elapsedTime.toFixed(1)}ms`);
    console.log(`Average time per slot: ${(elapsedTime / slotsCount).toFixed(2)}ms`);
}

async function main(gen = false, destroy = false) {
    const args = process.argv.slice(2);

    const mintersCount = parseInt(args[0]) || 1000;
    const slotsCount = parseInt(args[1]) || 1000;

    let level: LevelDB;

    if (gen) {
        await LevelDBUtils.destroyDB("stake4");
        level = await generateMinterDB(mintersCount, "stake4");
        console.log(`Generated minter database with ${mintersCount} minters`);
    } else {
        level = await LevelDBUtils.openDB("stake4");
        console.log("Initialized minter database");
    }

    const indexes = await indexDB(level);

    await testSpeed(level, indexes, slotsCount);

    await level.close();
    if (destroy) {
        await LevelDBUtils.destroyDB("stake4");
    }
}

await main(true, true);
