import crypto from "crypto";

type UintNew = new (input: Buffer) => Uint160;

interface UintConstructable extends UintNew {
    byteLength: number;

    alloc(): Uint160;

    from(
        arrayBuffer: WithArrayBuffer,
        byteOffset?: number,
        length?: number
    ): Uint160;
    from(data: WithImplicitCoercion<ByteArray | string>): Uint160;
    from(str: WithString, encoding?: BufferEncoding): Uint160;
    from(number: number, length?: number): Uint160;
}

type WithString =
    | { [Symbol.toPrimitive](hint: "string"): string }
    | WithImplicitCoercion<string>;
type WithArrayBuffer = WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>;

type ByteArray = readonly number[] | Uint8Array;

type NumberLike = Uint160 | number;

class UintUtils {
    static correctByteLengthBuffer(buffer: Buffer, correctByteLength: number) {
        if (buffer.byteLength === correctByteLength) {
            return buffer;
        }
        const newBuffer = Buffer.alloc(correctByteLength);
        newBuffer.set(buffer, correctByteLength - buffer.byteLength);
        return newBuffer;
    }
}

class Uint160 {
    public static readonly byteLength = 20;

    protected readonly buffer: Buffer;

    constructor(input: Buffer) {
        this.buffer = input;
    }

    public static alloc() {
        return new this(Buffer.alloc(this.byteLength));
    }

    public static from(
        arrayBuffer: WithArrayBuffer,
        byteOffset?: number,
        length?: number
    ): Uint160;
    public static from(data: WithImplicitCoercion<ByteArray | string>): Uint160;
    public static from(str: WithString, encoding?: BufferEncoding): Uint160;
    public static from(number: number): Uint160;
    public static from(input: any, arg2?: any, arg3?: any) {
        let uint: Uint160;
        let buffer: Buffer;
        if (typeof input === "number") {
            uint = this.alloc();
            uint.iadd(input);
            return uint;
        } else if (typeof input === "string" && arg2 === undefined) {
            buffer = Buffer.from(input, "hex");
        } else {
            buffer = Buffer.from(input, arg2, arg3);
        }
        return new this(
            UintUtils.correctByteLengthBuffer(buffer, this.byteLength)
        );
    }

    public clone() {
        return (this.constructor as UintConstructable).from(this.buffer);
    }

    public toHex() {
        return this.buffer.toString("hex");
    }

    /** Supports only a number up to (2^48)-1 */
    public toInt() {
        return this.buffer.readUintBE(this.buffer.byteLength - 6, 6);
    }

    public toUint64() {
        return this.buffer.subarray(this.buffer.byteLength - 8);
    }

    public getRaw() {
        return this.buffer;
    }

    public getLen(): number;
    public getLen(enc: "uint"): Uint160;
    public getLen(enc?: "number" | "uint") {
        return enc === "uint"
            ? Uint160.from(this.buffer.byteLength)
            : this.buffer.byteLength;
    }

    public set(list: ArrayLike<number> | Uint160, offset?: number) {
        this.buffer.set((list instanceof Uint160 ? list.getRaw() : list), offset);
    }

    public slice(start?: number, end?: number) {
        return new Uint160(this.buffer.subarray(start, end));
    }

    public iadd(value: NumberLike) {
        if (typeof value === "object") {
            return this.addUint(value);
        }
        return this.addNumber(value);
    }
    public add(value: NumberLike) {
        const clone = this.clone();
        clone.iadd(value);
        return clone;
    }

    public isub(value: NumberLike) {
        if (typeof value === "object") {
            return this.subUint(value);
        }
        return this.addNumber(value * -1);
    }
    public sub(value: NumberLike) {
        const clone = this.clone();
        clone.isub(value);
        return clone;
    }

    public gt(value: NumberLike) {
        return this.compare(value) === 1;
    }

    public gte(value: NumberLike) {
        return this.compare(value) !== -1;
    }

    public lt(value: NumberLike) {
        return this.compare(value) === -1;
    }

    public lte(value: NumberLike) {
        return this.compare(value) !== 1;
    }

    public eq(value: NumberLike) {
        return this.compare(value) === 0;
    }

    protected addUint(value: Uint160) {
        let carry = 0;
        for (let i = this.buffer.byteLength - 1; i >= 0; i--) {
            const sum = this.buffer[i] + value.buffer[i] + carry;
            this.buffer[i] = sum % 256;
            carry = Math.floor(sum / 256);
        }
    }
    protected addNumber(value: number) {
        for (let i = this.buffer.byteLength - 1; i >= 0; i--) {
            const sum = this.buffer[i] + value;
            if (sum >= 0) {
                this.buffer[i] = sum % 256;
            } else {
                this.buffer[i] = (sum % 256) + 256;
            }
            value = Math.floor(sum / 256);
        }
    }

    protected subUint(value: Uint160) {
        let carry = 0;
        for (let i = this.buffer.byteLength - 1; i >= 0; i--) {
            const sum = this.buffer[i] - value.buffer[i] + carry;
            if (sum >= 0) {
                this.buffer[i] = sum % 256;
            } else {
                this.buffer[i] = (sum % 256) + 256;
            }
            carry = Math.floor(sum / 256);
        }
    }

    protected compare(value: NumberLike) {
        if (typeof value === "number") {
            value = Uint160.from(value);
        }
        return this.buffer.compare(value.buffer);
    }

    public get [Symbol.toStringTag]() {
        return this.constructor.name;
    }
}

/**
 * Generate a pseudo-random index deterministically from the target and slot index.
 */
function hashToIndex(target: Uint160, slotIndex: number, length: number): number {
    const hash = crypto
        .createHash("sha256")
        .update(Buffer.concat([target.getRaw(), Uint160.from(slotIndex).toUint64()]))
        .digest()

    // Use the first 4 bytes of the hash to get a pseudo-random index
    const index = hash.readUInt32BE(0) % length;
    return index;
}

function hashNumber(input: number) {
    return new Uint160(
        crypto
            .createHash("sha256")
            .update(Uint160.from(input).toUint64())
            .digest()
            .subarray(0, 20)
    );
}


function findBestKey(addresses: Uint160[], target: Uint160) {
    let bestKey: Uint160 | null = null; // The key to return
    let bestDifference = Uint160.from(-1); // The smallest difference found for greater values
    let furthestKey: Uint160 | null = null; // The key with the most difference
    let furthestDifference = Uint160.from(0); // The largest difference found

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
        const absDifference = address.gt(target)
            ? difference
            : target.sub(address);
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
    return furthestKey as Uint160;
}


/**
* A deterministic pseudo-random selection of the best key.
* We use the hash of the target to simulate randomness.
*/
function findPseudoRandomBestKey(
    addresses: Uint160[],
    target: Uint160,
    slotIndex: number
): Uint160 {
    let bestKey: Uint160 | null = null;
    let bestDifference = Uint160.from(-1); // The smallest difference found
    let furthestKey: Uint160 | null = null;
    let furthestDifference = Uint160.from(0); // The largest difference found

    for (let address of addresses) {
        const difference = address.sub(target);

        if (address.eq(target)) {
            return address; // Return immediately if exact match
        }

        if (address.gt(target) && difference.lt(bestDifference)) {
            bestDifference = difference;
            bestKey = address;
        }

        const absDifference = address.gt(target)
            ? difference
            : target.sub(address);
        if (absDifference.gt(furthestDifference)) {
            furthestDifference = absDifference;
            furthestKey = address;
        }
    }

    // If no exact match found, use deterministic pseudo-random fallback
    const fallbackKey = bestKey !== null ? bestKey : furthestKey;

    // Add pseudo-randomness by hashing the fallback and slot index
    const pseudoRandomIndex = hashToIndex(
        target,
        slotIndex,
        addresses.length
    );

    // Mix the deterministic fallback with pseudo-random selection
    return addresses[pseudoRandomIndex] || fallbackKey;
}


interface ConfigLike {
    mintersFactor?: number;
    slotsFactor?: number;
    prefixLen?: number;
};

type CompleteConfigLike = Required<ConfigLike>;

const defaultConfig: Readonly<CompleteConfigLike> = {
    mintersFactor: 1,
    slotsFactor: 15.2578125,
    prefixLen: 1,
};

interface TestSettings {
    mintersCount: number;
    slotsCount: number;
    prefixLength: number;
}

async function preTest(testIndex: number, testDescription: string, config?: ConfigLike): Promise<TestSettings> {
    console.log(`Test ${testIndex}: ${testDescription}`)

    const completeConfig: CompleteConfigLike = { ...defaultConfig, ...config };
    let { mintersFactor, slotsFactor, prefixLen } = completeConfig;

    const mintersCount = mintersFactor * 256;
    const slotsCount = Math.round(mintersCount * slotsFactor);
    const prefixLength = prefixLen;

    return { mintersCount, slotsCount, prefixLength };
}

async function calulateResults(frequency: Map<string, Uint160>, slotsCount: number, prefixLength: number) {
    const expectedFrequency = slotsCount / 256 ** prefixLength;

    let totalDeviation = 0;
    let highestDeviation = 0;

    for (let [prefix, count] of frequency) {
        const actualFreq = count.toInt();
        const deviation = Math.abs(actualFreq - expectedFrequency);
        totalDeviation += deviation;

        if (deviation > highestDeviation) {
            highestDeviation = deviation;
        }
    }

    console.log("Expected Frequency:", expectedFrequency);
    console.log("Highest Deviation:", highestDeviation);
}


async function testRandomness1(config?: ConfigLike) {
    const { mintersCount, slotsCount, prefixLength } = await preTest(1, "with random addresses", config);

    const minters: Uint160[] = [];
    for (let i = 0; i < mintersCount; i++) {
        minters.push(hashNumber(i));
    }

    const frequency = new Map<string, Uint160>();

    for (let i = 0; i < slotsCount; i++) {
        const address = findBestKey(minters, hashNumber(i));
        const prefix = address.slice(0, prefixLength).toHex();

        if (frequency.has(prefix)) {
            (frequency.get(prefix) as Uint160).iadd(1);
        } else {
            frequency.set(prefix, Uint160.from(1));
        }
    }

    await calulateResults(frequency, slotsCount, prefixLength);
}

async function testRandomness2(config?: ConfigLike) {
    const { mintersCount, slotsCount, prefixLength } = await preTest(2, "with pseudo-random selection", config);

    const minters: Uint160[] = [];
    for (let i = 0; i < mintersCount; i++) {
        minters.push(hashNumber(i));
    }

    const frequency = new Map<string, Uint160>();

    for (let i = 0; i < slotsCount; i++) {
        const address = findPseudoRandomBestKey(minters, hashNumber(i), i);
        const prefix = address.slice(0, prefixLength).toHex();

        if (frequency.has(prefix)) {
            (frequency.get(prefix) as Uint160).iadd(1);
        } else {
            frequency.set(prefix, Uint160.from(1));
        }
    }

    await calulateResults(frequency, slotsCount, prefixLength);
}


async function testRandomness3(config?: ConfigLike) {
    const { mintersCount, slotsCount, prefixLength } = await preTest(3, "with set prefixes for the adresses", config);

    const minters: Uint160[] = [];
    for (let i = 0; i < mintersCount; i++) {
        const address = Uint160.alloc();
        address.set([i % 256], 0);
        minters.push(address);
    }

    const frequency = new Map<string, Uint160>();

    for (let i = 0; i < slotsCount; i++) {
        const address = findBestKey(minters, hashNumber(i));
        const prefix = address.slice(0, prefixLength).toHex();

        if (frequency.has(prefix)) {
            (frequency.get(prefix) as Uint160).iadd(1);
        } else {
            frequency.set(prefix, Uint160.from(1));
        }
    }

    await calulateResults(frequency, slotsCount, prefixLength);
}

(async () => {
    
    // const config: ConfigLike = {
    //     mintersFactor: 1,
    //     slotsFactor: 15.2578125,
    //     prefixLen: 1
    // };
    
    // const config: ConfigLike = {
    //     mintersFactor: 1,
    //     slotsFactor: 1,
    //     prefixLen: 1
    // };

    const config: ConfigLike = {
        mintersFactor: 256,
        slotsFactor: 15.2578125,
        prefixLen: 1
    };

    await testRandomness1(config);
    //await testRandomness2(config);
    //await testRandomness3(config);
})();
