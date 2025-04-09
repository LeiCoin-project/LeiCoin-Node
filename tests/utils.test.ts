import { describe, test, expect } from "bun:test";
import { Deferred } from "@leicoin/utils/deferred";
import { QuickSort } from "@leicoin/utils/quick-sort";
import { Readable } from 'stream';
import { Uint, Uint64 } from "low-level";

describe("utility", () => {

    test("deferred", async () => {

        const deferred = new Deferred<string>();
        expect(deferred.hasResolved()).toBe(false);

        const result = await deferred.resolve("test");
        expect(result).toBe("test");

        expect(await deferred).toBe("test");
        /*expect(deferred.hasResolved()).toBe(true);
        expect(deferred.awaitResult()).resolves.toBe("test");
        
        deferred.resolve("test2");
        expect(deferred).resolves.toBe("test");

        const deferred2 = new Deferred<string>();
        deferred2.reject("test");
        expect(deferred2).rejects.toBe("test");
        expect(deferred2.hasResolved()).toBe(true);*/

    });

    test("merge_stream_and_array", async () => {

        async function* mergeSortedStreamAndArray(
            stream: AsyncIterable<Uint>,
            array: Uint[]
        ): AsyncGenerator<Uint> {
            const iterator = stream[Symbol.asyncIterator]();
            let arrayIndex = 0;
            let streamItem = await iterator.next();

            while (!streamItem.done) {
                const streamVal = streamItem.value;
                const arrayVal = arrayIndex < array.length ? array[arrayIndex] : null;

                if (!arrayVal || streamVal.lt(arrayVal)) {
                    yield streamVal;
                    streamItem = await iterator.next();
                    continue;
                }
                yield arrayVal;
                arrayIndex++;
            }
            while (arrayIndex < array.length) {
                yield array[arrayIndex++];
            }

        }

        const values = [
            Uint.from('aaa000000000000000000'),
            Uint.from('bbb000000000000000000'),
            Uint.from('ccc000000000000000000'),
            Uint.from('ddd000000000000000000'),
            Uint.from('eee000000000000000000'),
            Uint.from('fff000000000000000000')
        ]

        // Example stream emitting sorted 21-byte buffers
        const inputStream = Readable.from([
            values[0],
            values[2],
            values[4],
        ]);

        // Array also sorted
        const array = [
            values[1],
            values[3],
            values[5],
        ];

        const mergedStream = mergeSortedStreamAndArray(inputStream, array);

        let count = 0;
        for await (const chunk of mergedStream) {
            expect(chunk).toEqual(values[count]);
            count++;
        }

    });

    test("quick_sort", async () => {

        const randomNumArr: number[] = [];
        const randomUintArr: Uint64[] = [];

        for (let i = 0; i < 10_000; i++) {
            const randomNum = Math.floor(Math.random() * 10_000);
            randomNumArr.push(randomNum);
            randomUintArr.push(Uint64.from(randomNum));
        }

        const sortedNumArr = QuickSort.NumArray.sort(randomNumArr, true);
        const sortedUintArr = QuickSort.UintArray.sort(randomUintArr, true) as Uint64[];

        expect(QuickSort.NumArray.isSorted(randomNumArr)).toBe(false);
        expect(QuickSort.NumArray.isSorted(sortedNumArr)).toBe(true);

        expect(QuickSort.UintArray.isSorted(randomUintArr)).toBe(false);
        expect(QuickSort.UintArray.isSorted(sortedUintArr)).toBe(true);
    });

});
