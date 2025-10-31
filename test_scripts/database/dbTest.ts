import { ClassicLevel } from "classic-level";
import { LevelDB } from "@advena/storage/leveldb/index";
import { shuffleArray } from '../cryptoUtils.js';
import { startTimer, getElapsedTime } from "../utils/testUtils";
import { Uint, Uint256, Uint64 } from "low-level";
import { UintMap } from "low-level";
import { AddressHex } from "@advena/common/models/address";
import { LCrypt } from "../../src/crypto/index.js";
import { PX } from "@advena/common/types/prefix";
import { LevelDBUtils } from "./leveldb_utils.js";
import { Dict } from "@advena/utils/dataUtils";
import { gen_minter } from "./generateRandData.js";

async function speedTest(db1: LevelDBUtils.DBs = "stake1", db2?: LevelDBUtils.DBs) {

    const level1 = new LevelDB(LevelDBUtils.getDBPath(db1));

    async function doTest(level: ClassicLevel | LevelDB) {
        await level.open();
        const startTime = startTimer();
        const keys = await level.keys().all();
        const elapsedTime = getElapsedTime(startTime);

        //console.log(await level.get(keys[2]));
        //console.log(Validator.fromDecodedHex(await level.get(keys[2])));

        //const address = "9a19f035c1862f331fb2b0ed8e418818f9dfa16e";
        //const validator = Validator.fromDecodedHex((await level.values({gte: Uint.from(address), limit: 1}).all())[0]);
        //console.log(validator.address.toHex());
        
        level.close();
        return elapsedTime;
    };

    const time1 = await doTest(level1);

    console.log("Elapsed time 1:", time1 / 1000, "seconds");

    if (db2) {
        const level2 = new ClassicLevel(LevelDBUtils.getDBPath(db2), {keyEncoding: "hex", valueEncoding: "hex"});
        const time2 = await doTest(level2);
        console.log("Elapsed time 2:", time2 / 1000, "seconds");
        console.log("DB working with Uint is", (time1 / time2), "times faster then with strings");
    }
}


async function selectNextValidators_old(db: LevelDBUtils.DBs, seedHash: Uint256): Promise<[Uint[], number, boolean]> {
    const level = await LevelDBUtils.openDB(db);

    let using_first_validators = false;

    let elapsedTime: number;
    const startTime = startTimer();

    let validators: Uint[] = await level.keys({limit: 129}).all();
    if (validators.length <= 128) {
        using_first_validators = true;
    } else {
        validators = [];
        let nextHash = seedHash;

        while (validators.length !== 128) {
            let winner = (
                (await level.keys({gte: nextHash, limit: 1}).all())[0] ||
                (await level.keys({lte: nextHash, limit: 1, reverse: true}).all())[0]
            );
            if (!validators.some(item => item.eq(winner))) {
                validators.push(winner);
            }
            nextHash = LCrypt.sha256(nextHash);
        }
        elapsedTime = getElapsedTime(startTime);
    }
    elapsedTime = getElapsedTime(startTime);
    await level.close();
    return [validators, elapsedTime, using_first_validators];
}

async function selectNextValidators(db: LevelDBUtils.DBs, seedHash: Uint256): Promise<[Dict<Uint>, number, boolean]> {
    const level = await LevelDBUtils.openDB(db);

    let using_first_validators = false;

    let elapsedTime: number;
    const startTime = startTimer();

    const validators: Dict<Uint> = {};
    const validators_count = await level.get(Uint.from("ff00ed"));
    const validator_preifx = PX.A_0e;

    if (validators_count.lte(128)) {
        using_first_validators = true;
        for await (const [index, data] of level.iterator()) {
            if (index.slice(0, 1).eq(PX.META)) continue;
            validators[index.slice(1).toInt()] = data;
        }
    } else {
        let nextHash = seedHash;
        const takenIndexes: number[] = [];

        while (takenIndexes.length !== 128) {
            let nextIndex = nextHash.mod(validators_count);

            if (!takenIndexes.includes(nextIndex)) {
                takenIndexes.push(nextIndex);

                const validator_index = Uint.from(nextIndex);

                const validator_data = await level.get(Uint.concat([validator_preifx, validator_index]));
                validators[nextIndex] = validator_data;
            }
            nextHash = LCrypt.sha256(Uint.concat([nextHash, seedHash]));
        }
        elapsedTime = getElapsedTime(startTime);
    }
    elapsedTime = getElapsedTime(startTime);
    await level.close();
    return [validators, elapsedTime, using_first_validators];
}

async function selectNextMinter(slot: Uint64, customLevel?: LevelDB) {
    let level = customLevel || await LevelDBUtils.openDB("stake1");

    const slotHash = AddressHex.fromTypeAndBody(PX.A_0e, LCrypt.sha256(slot).slice(0, 20));

    const address = new AddressHex(
        (await level.keys({gte: slotHash, limit: 1}).all())[0] ||
        (await level.keys({lte: slotHash, limit: 1}).all())[0]
    );

    if (!customLevel) {
        await level.close();
    }
    return address;
}

function findBestKey(addresses: AddressHex[], target: AddressHex) {
    let bestKey: AddressHex | null = null;  // The key to return
    let bestDifference = Uint.from(-1, 21);  // The smallest difference found for greater values
    let furthestKey: AddressHex | null = null;  // The key with the most difference
    let furthestDifference = AddressHex.from(0);  // The largest difference found

    // Iterate through each key-value pair in the object
    for (let address of addresses) {
        const difference = address.sub(target);

        // If the value is equal to the target, return the key immediately
        if (address.eq(target)) {
            return address;
        }

        // If the value is greater than the target, check if it's the smallest greater value so far
        if (address.gt(target) && difference.lt(bestDifference)) {
            bestDifference = difference;
            bestKey = address;
        }

        // Track the furthest difference if we don't find a suitable greater value
        const absDifference = address.gt(target) ? difference : target.sub(address);
        if (absDifference.gt(furthestDifference)) {
            furthestDifference = absDifference;
            furthestKey = address;
        }
    }

    // If we found a key with a greater value, return it
    if (bestKey !== null) {
        return bestKey;
    }

    // Otherwise, return the key with the most difference
    return furthestKey as AddressHex;
}

async function test1(db: LevelDBUtils.DBs, func: (db: LevelDBUtils.DBs, seedHash: Uint256) => Promise<any>, returnTime?: false): Promise<undefined>;
async function test1(db: LevelDBUtils.DBs, func: (db: LevelDBUtils.DBs, seedHash: Uint256) => Promise<any>, returnTime: true): Promise<number>;
async function test1(db: LevelDBUtils.DBs = "stake1", func = selectNextValidators, returnTime = false) {
    let nextHash = LCrypt.sha256(LCrypt.randomBytes(32));
    
    const startTime = startTimer();

    for (let i = 0; i < 10; i++) {
        await func(db, nextHash);
        nextHash = LCrypt.sha256(LCrypt.randomBytes(32));
    }

    const elapsedTime = getElapsedTime(startTime);
    if (returnTime) {
        return elapsedTime;
    }
    console.log("Elapsed average time:", elapsedTime / 1000 / 10, "seconds");
}

async function fastestSelectNextValidators() {

    //const time1 = await test1("stake1", selectNextValidators_old, true);
    const time2 = await test1("stake3", selectNextValidators, true);

    //console.log("Elapsed average time 1:", time1 / 1000 / 10, "seconds");
    console.log("Elapsed average time 2:", time2 / 1000 / 10, "seconds");
    //console.log("New Selecting is", time1 / time2, "times faster then the old method");

}

async function test2(db1: LevelDBUtils.DBs = "stake1", db2: LevelDBUtils.DBs = "stake2", func = selectNextValidators, seedHash = LCrypt.sha256(LCrypt.randomBytes(32))) {
    
    const results = [
        await func(db1, seedHash),
        await func(db2, seedHash)
    ];

    for (const [index, result] of results.entries()) {
        console.log(`Results for DB ${index + 1}`);
        //console.log(result[0]);
        console.log("  Elapsed time:", result[1] / 1000, "seconds");
        console.log(result[2] ? "  Using first 128 validators" : "  Using selected validators");
    }

    console.log("Result is the same:", results[0][0].toString() === results[1][0].toString());

}

async function test3(db: LevelDBUtils.DBs = "stake1", func = selectNextValidators_old, seedHash = LCrypt.sha256(LCrypt.randomBytes(32))) {
    
    const result = await func(db, seedHash);
    const temp: Uint[] = [];
    let noDuplicates = true;

    for (const validator of result[0]) {
        noDuplicates = noDuplicates && !(temp.some(item => item.eq(validator)));
        temp.push(validator);
    }

    console.log(noDuplicates);

}

async function test4() {
    const target = (await selectNextValidators_old("stake1", LCrypt.sha256(LCrypt.randomBytes(32))))[0][0];
    console.log("Target:", target);

    const startTime = startTimer();

    let index = 0;

    while (true) {
        //console.log("Round:", index);
        const proposer = (await selectNextValidators_old("stake1", LCrypt.sha256(LCrypt.randomBytes(32))))[0][127];
        if (proposer.eq(target)) {
            console.log("Found:", proposer);
            break;
        }
        index ++;
    }

    const elapsedTime = getElapsedTime(startTime);
    console.log("Rounds:", index);
    console.log("Elapsed time:", elapsedTime / 1000, "seconds");
}

async function test5(returnPicks?: false, slotsCount?: number, randomSlotIndexes?: boolean, level?: LevelDB): Promise<undefined>;
async function test5(returnPicks: true, slotsCount?: number, randomSlotIndexes?: boolean, level?: LevelDB): Promise<AddressHex[]>;
async function test5(returnPicks = false, slotsCount = 100, randomSlotIndexes = false, level?: LevelDB) {
    let print = returnPicks ? () => {} : console.log;
    let slotIndexGenerator = randomSlotIndexes ? 
        (i: any) => Uint64.from(Math.floor(Math.random() * 1_000_000)) :
        (i: number) => Uint64.from(i);

    const results: AddressHex[] = [];
    
    for (let i = 0; i < slotsCount; i++) {
        results[i] = await selectNextMinter(slotIndexGenerator(i), level);;
        print("Address:", results[i].toHex());
    }
    if (returnPicks) return results;
}

async function test_minter_randomness(config: {
    mintersCount: number,
    slotsCount: number,
    randomSlotIndexes: boolean,
    randomMinters: boolean,
    sortedBy: "address" | "count",
    onlyFirstDigits: false | number
} = {
    mintersCount: 2,
    slotsCount: 100,
    randomSlotIndexes: false,
    randomMinters: false,
    sortedBy: "count",
    onlyFirstDigits: false
}) {
    const {mintersCount, slotsCount, randomSlotIndexes, randomMinters, sortedBy, onlyFirstDigits} = config;

    await gen_minter(mintersCount, "stake1");
    const level = await LevelDBUtils.openDB("stake1");

    const minterAddresses = await level.keys().all();

    let frequencyMap: UintMap<Uint64>;
    const expectedFrequency = slotsCount / (onlyFirstDigits ? (256 ** onlyFirstDigits) : mintersCount);

    if (onlyFirstDigits) {
        frequencyMap = new UintMap<Uint64>(minterAddresses.map(address => [address.slice(1, onlyFirstDigits + 1), Uint64.from(0)]));
    } else {
        frequencyMap = new UintMap<Uint64>(minterAddresses.map(address => [address, Uint64.from(0)]));
    }

    let chosenMinters: Uint[];

    if (randomMinters) {
        chosenMinters = [];
        for (let i = 0; i < slotsCount; i++) {
            chosenMinters.push(minterAddresses[Math.floor(Math.random() * mintersCount)]);
        }
    } else {
        chosenMinters = await test5(true, slotsCount, randomSlotIndexes, level);
    }

    if (onlyFirstDigits) {
        for (const address of chosenMinters) {
            (frequencyMap.get(address.slice(1, onlyFirstDigits + 1)) as Uint64).iadd(1);
        }
    } else {
        for (const address of chosenMinters) {
            (frequencyMap.get(address) as Uint64).iadd(1);
        }
    }

    let sortedResults: [Uint, Uint64][];

    if (sortedBy === "address") {
        sortedResults = frequencyMap.entries().all().sort((a, b) => {
            return a[0].toHex().localeCompare(b[0].toHex());
        });
    } else {
        sortedResults = frequencyMap.entries().all().sort((a, b) => {
            return b[1].toInt() - a[1].toInt();
        });
    }

    const green_underline = "\x1b[38;2;0;150;0m\x1b[4m";
    const reset = "\x1b[0m";

    // console.log(green_underline + `Results sorted by ${sortedBy}:` + reset);

    // for (const [index, [address, count]] of sortedResults.entries()) {
    //     const light_blue = "\x1b[38;2;58;150;221m";
    //     const light_magenta = "\x1b[38;2;221;58;150m";
    //     const color = index % 2 === 0 ? light_blue : light_magenta;

    //     console.log(color +
    //         `Minter: ${address.toHex()}` + "    " +
    //         `${count.toInt()} times` +
    //     reset);
        
    // }

    let totalDeviation = 0;
    let highestDeviation = 0;

    for (const [, count] of sortedResults) {

        const deviation = Math.abs(count.toInt() - expectedFrequency);

        totalDeviation += deviation;

        if (deviation > highestDeviation) {
            highestDeviation = deviation;
        }
    }

    console.log(green_underline + "test_minter_randomness Results:" + reset);
    console.log("- Total Deviation:", totalDeviation);
    console.log("- Expexted Frequency:", expectedFrequency);
    console.log("- Highest Deviation:", highestDeviation);

    await level.close();
    await LevelDBUtils.destroyDB("stake1");
}

async function test_minter_randomness2(config: {
    mintersCount: number,
    reverse: boolean,
} = {
    mintersCount: 10,
    reverse: false
}) {
    const { mintersCount, reverse } = config;

    await gen_minter(mintersCount, "stake1");
    const level = await LevelDBUtils.openDB("stake1");

    const hash = Uint.concat([
        PX.A_0e,
        LCrypt.sha256(LCrypt.randomBytes(32)).split(20)[0]
    ]);

    let results: Uint[];

    if (reverse) {
        results = await level.keys({lte: hash, reverse: true}).all();
    } else {
        results = await level.keys({gte: hash}).all();
        if (!results[0]) {
            console.log("No results found, trying reverse");
            results = await level.keys({lte: hash}).all();
        }
    }

    const green_underline = "\x1b[38;2;0;150;0m\x1b[4m";
    const reset = "\x1b[0m";

    console.log("Base Hash:\n" + green_underline +
        hash.toHex() +
    reset);

    for (const [index, address] of results.entries()) {
        const light_blue = "\x1b[38;2;58;150;221m";
        const light_magenta = "\x1b[38;2;221;58;150m";
        const color = index % 2 === 0 ? light_blue : light_magenta;

        console.log(color +
            address.toHex() +
        "\x1b[0m");
    }

    console.log("Results count:", results.length);

    await level.close();
    await LevelDBUtils.destroyDB("stake1");
}

async function test_minter_randomness3(config: {
    mintersCount: number,
    slotsCount: number,
    prefixLength: number
} = {
    mintersCount: 65536,
    slotsCount: 1000000,
    prefixLength: 1
}) {
    const { mintersCount, slotsCount, prefixLength } = config;

    function sha256(input: number) {
        return LCrypt.sha256(Uint64.from(input)).toHex();
        //return LCrypt.randomBytes(32).toString("hex")
    }

    let frequency = {};
    const expectedFrequency = slotsCount / mintersCount;

    for (let i = 1; i <= slotsCount; i++) {
        const hash = sha256(i);
        const prefix = hash.substring(0, prefixLength * 2);

        if (frequency[prefix]) {
            frequency[prefix]++;
        } else {
            frequency[prefix] = 1;
        }
    }

    let totalDeviation = 0;
    let highestDeviation = 0;

    const green_underline = "\x1b[38;2;0;150;0m\x1b[4m";
    const reset = "\x1b[0m";

    for (let prefix in frequency) {
        const actualFreq = frequency[prefix];
        const deviation = Math.abs(actualFreq - expectedFrequency);
        totalDeviation += deviation;

        if (deviation > highestDeviation) {
            highestDeviation = deviation;
        }
    }

    console.log(green_underline + "test_minter_randomness3 Results:" + reset);
    console.log("- Total Deviation:", totalDeviation);
    console.log("- Expexted Frequency:", expectedFrequency);
    console.log("- Highest Deviation:", highestDeviation);

}

async function test_minter_randomness3_2(config: {
    mintersCount: number,
    slotsCount: number,
    prefixLength: number
} = {
    mintersCount: 65536,
    slotsCount: 1000000,
    prefixLength: 1
}) {
    const { mintersCount, slotsCount, prefixLength } = config;

    let frequency = {};
    const expectedFrequency = slotsCount / mintersCount;

    for (let i = 1; i <= slotsCount; i++) {
        const prefix = Math.floor(Math.random() * slotsCount) % (256 ** prefixLength);

        if (frequency[prefix]) {
            frequency[prefix]++;
        } else {
            frequency[prefix] = 1;
        }
    }

    let totalDeviation = 0;
    let highestDeviation = 0;

    const green_underline = "\x1b[38;2;0;150;0m\x1b[4m";
    const reset = "\x1b[0m";

    for (let prefix in frequency) {
        const actualFreq = frequency[prefix];
        const deviation = Math.abs(actualFreq - expectedFrequency);
        totalDeviation += deviation;

        if (deviation > highestDeviation) {
            highestDeviation = deviation;
        }
    }

    console.log(green_underline + "test_minter_randomness3_2 Results:" + reset);
    console.log("- Total Deviation:", totalDeviation);
    console.log("- Expexted Frequency:", expectedFrequency);
    console.log("- Highest Deviation:", highestDeviation);

}

async function test_minter_randomness4(config: {
    mintersCount: number,
    slotsCount: number
    prefixLength: number
} = {
    mintersCount: 65536,
    slotsCount: 1000000,
    prefixLength: 1
}) {
    const { mintersCount, slotsCount, prefixLength } = config;

    const minters: AddressHex[] = [];

    for (let i = 0; i < mintersCount; i++) {
        minters.push(AddressHex.fromTypeAndBody(PX.A_0e, LCrypt.sha256(Uint64.from(i)).slice(0, 20)));
    }

    let frequency = new UintMap<Uint64>();
    const expectedFrequency = slotsCount / (256 ** prefixLength);

    for (let i = 0; i < slotsCount; i++) {
        const address = findBestKey(minters, AddressHex.fromTypeAndBody(PX.A_0e, LCrypt.sha256(Uint64.from(i)).slice(0, 20)));
        const prefix = address.slice(1, prefixLength + 1);

        if (frequency.has(prefix)) {
            (frequency.get(prefix) as Uint64).iadd(1);
        } else {
            frequency.set(prefix, Uint64.from(1));
        }
    }

    let totalDeviation = 0;
    let highestDeviation = 0;

    const green_underline = "\x1b[38;2;0;150;0m\x1b[4m";
    const reset = "\x1b[0m";

    for (let [prefix, count] of frequency) {
        const actualFreq = count.toInt();
        const deviation = Math.abs(actualFreq - expectedFrequency);
        totalDeviation += deviation;

        if (deviation > highestDeviation) {
            highestDeviation = deviation;
        }
    }

    console.log(green_underline + "test_minter_randomness4 Results:" + reset);
    console.log("- Expexted Frequency:", expectedFrequency);
    console.log("- Highest Deviation:", highestDeviation);
}

//gen_old(129);
//gen(129, "stake3");
//gen_old(100_000);
//gen_old(1_000);
//gen(1_000_000, "stake3")
//gen_minter(1_000_000, "stake1")
//gen_minter(2, "stake1")

//await gen();

//speedTest("stake3", null);

//test2("stake1", "stake2");
//test2("stake3", "stake4");

//test1("stake3");

//fastestSelectNextValidators();

/*
(async() => {

    let uint;
    let uint1 = Uint.from("abcdef");
    let uint2 = Uint.from("012345");

    const startTime = startTimer();

    for (let i = 0; i < 1_000_000; i++) {
        uint = Uint.concat([uint1, uint2]);
    }

    const elapsedTime = getElapsedTime(startTime);
    console.log(uint);
    console.log("Elapsed time:", elapsedTime / 1000, "seconds");

})();
*/

//test1("stake1", selectNextValidators_old);
//test2("stake1", "stake2", selectNextValidators_old);
//test3();
//test4()
//test5();



// test_minter_randomness({
//     mintersCount: 256,
//     slotsCount: 3906,
//     randomSlotIndexes: false,
//     randomMinters: false,
//     sortedBy: "count",
//     onlyFirstDigits: 1
// });

// test_minter_randomness2({
//     mintersCount: 10,
//     reverse: false
// });

test_minter_randomness3({
    // mintersCount: 256,
    // slotsCount: 3906,
    mintersCount: 1_000_000,
    slotsCount: 1_000_000,
    //slotsCount: 512,
    prefixLength: 2
});


test_minter_randomness3_2({
    // mintersCount: 256,
    // slotsCount: 3906,
    mintersCount: 1_000_000,
    slotsCount: 1_000_000,
    //slotsCount: 512,
    prefixLength: 2
});


// test_minter_randomness4({
//     mintersCount: 256,
//     slotsCount: 3906,
//     prefixLength: 1
// });
