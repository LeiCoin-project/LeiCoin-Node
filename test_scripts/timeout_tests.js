import { startTimer, getElapsedTime } from "@advena/utils/testUtils";

async function callAsyncFunction(params) { return 1 + 1 };

(async () => {
    const startTime = startTimer();

    for (let i = 0; i < 1_000_000; i++) {
        setTimeout(() => { callAsyncFunction(); }, 1000);
    }
    const elapsedTime = getElapsedTime(startTime);
    console.log("Elapsed time Sync:", elapsedTime / 1000, "seconds");
})();

(async () => {
    const startTime = startTimer();

    for (let i = 0; i < 1_000_000; i++) {
        setTimeout(async () => { await callAsyncFunction(); }, 1000);
    }
    const elapsedTime = getElapsedTime(startTime);
    console.log("Elapsed time Async:", elapsedTime / 1000, "seconds");
})();

