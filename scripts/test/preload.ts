import { beforeAll } from "bun:test";
import { Blockchain } from "../../src/storage/blockchain";

beforeAll(async () => {
    //process.env.NO_CLI = "true";
    await Blockchain.init();
    await Blockchain.waitAllChainsInit();
});

