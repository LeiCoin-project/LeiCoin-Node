import { webcrypto } from 'node:crypto';
// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;
import * as ec from '@noble/secp256k1';
import { startTimer, getElapsedTime } from "@advena/utils/testUtils';
import crypto from 'crypto';

//const privKey = ed.utils.randomPrivateKey();
//const pubKey = await ed.getPublicKeyAsync(privKey);


const privateKeyHex = "c2c53b8c95f84438d86ccabd9985651afdf8fe1307f691681f9638ff04bf9caa";

const privateKey = Buffer.from(privateKeyHex.slice(0, 64), "hex");

const publicKeyHex = Buffer.from(ec.getPublicKey(privateKey, false)).toString("hex");
const address = `lc1${crypto.createHash("sha256").update(publicKeyHex).digest("hex").slice(0, 40)}`;
const message = "Hello, world!";
const messageHash = crypto.createHash("sha256").update(message).digest();
const signature = (await ec.signAsync(messageHash, privateKey, {lowS: false})).normalizeS();

const signatureHex = encodeSignature(signature);

console.log("Public Key", publicKeyHex, publicKeyHex.length);
console.log("Private Key", privateKeyHex, privateKeyHex.length);
console.log("Signature Hex", signatureHex, signatureHex.length);

function encodeSignature(signature) {
    return signature.r.toString(16) + signature.s.toString(16) + signature.recovery.toString(16).padStart(2, "0");
}

function decodeSignature(hexData) {
    /*return {
        r: hexData.slice(0, 64),
        s: hexData.slice(64, 128),
        recovery: parseInt(hexData.slice(128, 130), 16)
    };*/
    return new ec.Signature(
        BigInt(`0x${hexData.slice(0, 64)}`),
        BigInt(`0x${hexData.slice(64, 128)}`),
        parseInt(hexData.slice(128, 130))
    )
}

async function getSenderAddress(data, signatureHex) {
    const publicKey = decodeSignature(signatureHex).recoverPublicKey(data).toHex(false);
    return `lc1${crypto.createHash("sha256").update(publicKey).digest("hex").slice(0, 40)}`;;
}

async function gen() {
    return await getSenderAddress(messageHash, signatureHex);
}

async function asyncMain() {

    const promises = [];

    const startTime = startTimer();

    for (let i = 0; i < 1_000; i++) {
        promises.push(gen());
    }

    await Promise.all(promises);

    const elapsedTime = getElapsedTime(startTime);
    console.log("Elapsed time:", elapsedTime / 1000, "seconds");

}

function main() {

    const startTime = startTimer();

    for (let i = 0; i < 1_000; i++) {
        gen();
    }

    const elapsedTime = getElapsedTime(startTime);
    console.log("Elapsed time:", elapsedTime / 1000, "seconds");

}

//main();

(async function () {

    await asyncMain();

    console.log(await getSenderAddress(messageHash, signatureHex) === address)

})();

