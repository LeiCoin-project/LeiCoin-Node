import { Uint32 } from "low-level";
import crypto from "crypto";
import { startTimer, getElapsedTime } from "@advena/utils/testUtils";

async function testDotEQ(iterationsCount: number) {
    let allEqual = true;

    for (let i = 0; i < iterationsCount; i++) {
        const uint = new Uint32(crypto.randomBytes(4));
        allEqual = allEqual && (uint.eq(uint.toInt()));
    }

    return allEqual;
}

async function testJSEQ(iterationsCount: number) {
    let allEqual = true;

    for (let i = 0; i < iterationsCount; i++) {
        const uint = new Uint32(crypto.randomBytes(4));
        // @ts-ignore
        allEqual = allEqual && (uint == uint.toInt());
    }

    return allEqual;
}

async function run_test(fn: (iterationsCount: number) => Promise<boolean>, iterationsCount: number) {
    const startTime = startTimer();
    const res = await fn(iterationsCount);
    const elapsed = getElapsedTime(startTime);
    console.log(`Test ${fn.name} finished in ${elapsed.toFixed(2)}ms with result: '${res}' iterating ${iterationsCount.toLocaleString()} times`);
}

async function main() {
    const iterationsCount = 1_000_000;
    await run_test(testJSEQ, iterationsCount);
    await run_test(testDotEQ, iterationsCount);
}

main();
