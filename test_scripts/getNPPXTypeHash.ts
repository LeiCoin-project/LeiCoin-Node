import LCrypt from "../src/crypto/index.js";
import { Uint } from "../s@advena/utils/binary";

function getHash(str: string) {
    return LCrypt.sha256(Uint.from(str.toUpperCase(), "utf-8")).slice(30).toHex();
}

const types = [
    "message",
    "block",
    "transaction",
]

for (const type of types) {
    console.log(`${type} hash: ${getHash(type)}`);
}