import { QuickSort } from "@leicoin/utils/quick-sort";
import { LevelDB } from "./index.js";
import { Uint, Uint64 } from "low-level";

export interface IKeyIndexRange {
    readonly firstPossibleKey: Uint;
    readonly lastPossibleKey: Uint;
    size: Uint64;
}

export class KeyIndexRange {

    constructor(
        protected rangeStartingPoint: Uint,
        protected byteLength: number,
        protected prefix: Uint,
        public size: Uint64
    ) {}

    static fromStep(step: number, byteLength: number, prefix: Uint) {
        return new KeyIndexRange(
            Uint.concat([
                Uint.from(step),
                Uint.alloc(byteLength -1)
            ]),
            byteLength,
            prefix,
            Uint64.from(0)
        );
    }

    public get firstPossibleKey() {
        return Uint.concat([
            this.prefix,
            this.rangeStartingPoint
        ]);
    }

    public get lastPossibleKey(): Uint {
        return Uint.concat([
            this.prefix,
            this.rangeStartingPoint.slice(0, 1),
            Uint.alloc(this.byteLength -1, 0xff)
        ]);
    }
}

type RangeIndexConstructor<K extends Uint> = {
    new (...args: any[]): AbstractRangeIndexes<K>;
    readonly rangeSize: number;
    readonly prototype: AbstractRangeIndexes<K>;
}

export abstract class AbstractRangeIndexes<K extends Uint = Uint> {

    static readonly rangeSize = 256;

    /**
     * Constructs a new instance of the class.
     * @param byteLength - The length in bytes without the prefix for keys.
     * @param prefix - A Uint representing the prefix for keys (default is an empty Uint).
     * @param ranges - An array of KeyIndexRange defining the ranges for indexing (default is an empty array).
     */    
    constructor(
        protected readonly byteLength: number,
        protected readonly prefix: Uint = Uint.alloc(0),
        protected readonly ranges: KeyIndexRange[] = []
    ) {
        if (ranges.length !== this.getRangesAmount()) {
            this.ranges = [];
            for (let n = 0; n < this.getRangesAmount(); n++) {
                this.ranges.push(KeyIndexRange.fromStep(n, this.byteLength, this.prefix));
            }
        }
    }

    abstract load(...args: any[]): Promise<void>;


    public getRange(n: number) {
        return this.ranges[n];
    }

    public getRanges() {
        return this.ranges as readonly KeyIndexRange[];
    }

    async getRangeByKey(key: K) {
        for (const range of this.ranges) {
            if (key.gte(range.firstPossibleKey) && key.lte(range.lastPossibleKey)) {
                return range;
            }
        }
        // Should never reach this point bacause any key has a corresponding range
        throw new Error("No range found for key. Are the ranges initialized?");
    }

    /**
     * 
     * @param index - The index to get the range for.
     * @returns object containing the range and the relative offset of the index in the range.
     */
    async getRangeByIndex(index: Uint64) {
        const totalOffset = Uint64.from(0);

        for (const range of this.ranges) {
            if (totalOffset.add(range.size).gt(index)) {
                return {
                    range,
                    offset: index.sub(totalOffset)
                };
            }
            totalOffset.iadd(range.size);
        }

        /** @todo Better Error Handling: Error shoudl not run when there are no Minter in the DB */
        throw new Error("Index is not part of any range. Are the ranges initialized?");
    }

    public isInRange(key: K, range: KeyIndexRange) {
        return key.gte(range.firstPossibleKey) && key.lte(range.lastPossibleKey);
    }


    async addKey(key: K) {
        (await this.getRangeByKey(key)).size.iadd(1);
    }

    async removeKey(key: K) {
        (await this.getRangeByKey(key)).size.isub(1);
    }

    async getTotalSize() {
        let totalSize = Uint64.from(0);

        for (const range of this.ranges) {
            totalSize.iadd(range.size);
        }
        return totalSize;
    }


    public getRangesAmount() {
        return (this.constructor as RangeIndexConstructor<K>).rangeSize;
    }
}


export class BasicRangeIndexes<K extends Uint = Uint> extends AbstractRangeIndexes<K> {

    /**
     * Initializes the ranges based on the provided keys.
     * @param keys - Array of unique keys to be used for range initialization.
     */
    async load(keys: K[]) {
        
        const sorted = QuickSort.UintArray.sort(keys, true);
        let totalCount = 0;

        for (const range of this.ranges) {
            while (totalCount < sorted.length && this.isInRange(sorted[totalCount] as K, range)) {
                range.size.iadd(1);
                totalCount++;
            }
        }
    }
}

export class LevelRangeIndexes<K extends Uint = Uint, V extends Uint = Uint> extends AbstractRangeIndexes<K> {

    /**
     * Initializes the ranges based on the provided keys in the LevelDB.
     * @param level - The LevelDB instance to be used for range initialization.
     */
    async load(level: LevelDB<K, V>) {

        for (const range of this.ranges) {

            const keyStream = level.createKeyStream({gte: range.firstPossibleKey as K, lte: range.lastPossibleKey as K});

            for await (const address of keyStream) {
                range.size.iadd(1);
            }
        }
    }

}
