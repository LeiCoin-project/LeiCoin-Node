
async function run() {
    process.env.CUSTOM_CWD = __dirname;
    process.env.NO_CLI = "true";

    const utils = (await import("../../s@advena/utils")).default;

    //console.log(utils.procCWD);
    if (utils.procCWD !== __dirname) {
        throw new Error("CWD not set correctly!");
    }

    await (await import("../../src/storage/blockchain.js")).Blockchain.waitAllChainsInit();


    const count = 10_000;

    console.log(`\nTX Speed Test with ${count.toLocaleString()} Transactions\n`);

    const TXSpeedTest = (await import("./main.js")).TXSpeedTest;

    await TXSpeedTest.init(count);

    await TXSpeedTest.runVerify();
    await TXSpeedTest.runExecute();

    await TXSpeedTest.end();
}

run();
