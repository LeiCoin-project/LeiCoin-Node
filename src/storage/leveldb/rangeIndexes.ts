import { LevelDB } from "./index.js";
import { Uint, Uint64 } from "low-level";

export class LevelKeyIndexRange {

    constructor(
        protected rangeStartingPoint: Uint,
        protected byteLength: number,
        protected prefix: Uint,
        public size: Uint64
    ) {}

    static fromStep(step: number, byteLength: number, prefix: Uint): LevelKeyIndexRange {
        return new LevelKeyIndexRange(
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

export class LevelRangeIndexes {

    static readonly rangeSize = 256;

    protected initialized = false;

    /**
     * Constructs a new instance of the class.
     * @param level - An instance of LevelDB used for database operations.
     * @param byteLength - The length in bytes without the prefix for keys.
     * @param prefix - A Uint representing the prefix for keys (default is an empty Uint).
     * @param ranges - An array of LevelKeyIndexRange defining the ranges for indexing (default is an empty array).
     */
    constructor(
        protected readonly level: LevelDB,
        protected readonly byteLength: number,
        protected readonly prefix: Uint = Uint.alloc(0),
        protected readonly ranges: LevelKeyIndexRange[] = []
    ) {}

    async load() {
        if (this.initialized) return;

        for (let i = 0; i < LevelRangeIndexes.rangeSize; i++) {
            const currentRange = LevelKeyIndexRange.fromStep(i, this.byteLength, this.prefix);

            const keyStream = this.level.createKeyStream({gte: currentRange.firstPossibleKey, lte: currentRange.lastPossibleKey});

            for await (const address of keyStream) {
                currentRange.size.iadd(1);
            }

            this.ranges.push(currentRange);
        }
    }

    async getRange(key: Uint) {
        for (const range of this.ranges) {
            if (key.gte(range.firstPossibleKey) && key.lte(range.lastPossibleKey)) {
                return range;
            }
        }
        // Should never reach this point bacause any key has a corresponding range
        throw new Error("No range found for key. Are the ranges initialized?");
    }

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

    async addKey(key: Uint) {
        (await this.getRange(key)).size.iadd(1);
    }

    async removeKey(key: Uint) {
        (await this.getRange(key)).size.isub(1);
    }

    async getTotalSize() {
        let totalSize = Uint64.from(0);

        for (const range of this.ranges) {
            totalSize.iadd(range.size);
        }
        return totalSize;
    }

}
