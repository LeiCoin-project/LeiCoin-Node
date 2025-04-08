import { describe, test, expect } from "bun:test";
import { Deferred } from "@leicoin/utils/deferred";

describe("utility", () => {

    test("deferred", async () => {

        const deferred = new Deferred<string>();
        expect(deferred.hasResolved()).toBe(false);

        const result = await deferred.resolve("test");
        expect(result).toBe("test");
        
        expect(deferred).resolves.toBe("test");
        /*expect(deferred.hasResolved()).toBe(true);
        expect(deferred.awaitResult()).resolves.toBe("test");
        
        deferred.resolve("test2");
        expect(deferred).resolves.toBe("test");

        const deferred2 = new Deferred<string>();
        deferred2.reject("test");
        expect(deferred2).rejects.toBe("test");
        expect(deferred2.hasResolved()).toBe(true);*/

    });

});
