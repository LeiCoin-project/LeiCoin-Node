import { describe, test, expect } from "bun:test";
import { Deferred } from "@leicoin/utils/deferred";
import { Readable, PassThrough } from 'stream';
import { Uint } from "low-level";

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

                if (arrayVal) {
                    if (streamVal.lte(arrayVal)) {
                        yield streamVal;
                        streamItem = await iterator.next();
                    } else {
                        yield arrayVal;
                        arrayIndex++;
                    }
                } else {
                    yield streamVal;
                    streamItem = await iterator.next();
                }
            }

            while (arrayIndex < array.length) {
                yield array[arrayIndex++];
            }
            
        }



        // Example stream emitting sorted 21-byte buffers
        const inputStream = Readable.from([
            Uint.from('aaa000000000000000000'),
            Uint.from('ccc000000000000000000'),
            Uint.from('eee000000000000000000'),
        ]);

        // Array also sorted
        const array = [
            Uint.from('bbb000000000000000000'),
            Uint.from('ddd000000000000000000'),
            Uint.from('fff000000000000000000'),
        ];

        const mergedStream = mergeSortedStreamAndArray(inputStream, array);

        for await (const chunk of mergedStream) {
            console.log(chunk.toHex());
        }

    });

});
