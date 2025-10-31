import { startTimer, getElapsedTime } from "@advena/utils/testUtils';
import elliptic from 'elliptic';
const { ec: EC } = elliptic;
import crypto from 'crypto';
import Crypto from '../build/src/crypto/index.js';
import { PX } from '../build/src/objects/prefix.js';
import { PrivateKey } from '../build/src/crypto/cryptoKeys.js';
import { AddressHex } from '../build/src/objects/address.js';

const ec = new EC('secp256k1');

const privateKeyHex = "c2c53b8c95f84438d86ccabd9985651afdf8fe1307f691681f9638ff04bf9caa";

const keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');
const publicKeyHex = keyPair.getPublic(true, "array");
const address = `lc0x${crypto.createHash("sha256").update(Buffer.from(publicKeyHex)).digest("hex").slice(0, 40)}`;

const message = "Hello, world!";
const messageHash = crypto.createHash("sha256").update(message).digest();

const raw_signature = keyPair.sign(messageHash);
const encodedSignature = encodeSignature(raw_signature);

function encodeSignature(signature) {
    return (
        signature.r.toString("hex", 64) +
        signature.s.toString("hex", 64) +
        signature.recoveryParam.toString(16).padStart(2, "0")
    );
}

function decodeSignature(signatureHex) {
    return { r: signatureHex.slice(0, 64), s: signatureHex.slice(64, 128), recoveryParam: parseInt(signatureHex.slice(128, 130), 16)};
}

function getSenderAddress(data, signatureHex) {
    try {
        const signature = decodeSignature(signatureHex);
        const publicKey = ec.recoverPubKey(data, signature, signature.recoveryParam).encode('hex');
        return `lc0x${crypto.createHash("sha256").update(publicKey).digest("hex").slice(0, 40)}`;
    } catch (error) {
        return;
    }
}

async function gen() {
    getSenderAddress(messageHash, encodedSignature);
}

function test2(keyPair) {
    const message = crypto.randomBytes(32);
    const messageHash = crypto.createHash("sha256").update(message).digest();
    const signature = keyPair.sign(messageHash);
    return [
        signature.r.toString("hex").padStart(64, "0").length,
        signature.s.toString("hex").padStart(64, "0").length,
        signature.recoveryParam.toString(16).padStart(2, "0").length
    ];
}

function test3(keyPair, originalAddress) {
    const message = crypto.randomBytes(32);
    const messageHash = crypto.createHash("sha256").update(message).digest();
    const signature = encodeSignature(keyPair.sign(messageHash));
    const address = getSenderAddress(messageHash, signature);
    return address === originalAddress;
}

async function asyncMain() {

    const promises = [];

    const startTime = startTimer();

    for (let i = 0; i < 1_000; i++) {
        promises.push(gen());
    }

    await Promise.all(promises);

    const elapsedTime = getElapsedTime(startTime);
    console.log("Elapsed time 1:", elapsedTime / 1000, "seconds");

}

async function syncMain() {

    const startTime = startTimer();

    for (let i = 0; i < 1_000; i++) {
        await gen();
    }

    const elapsedTime = getElapsedTime(startTime);
    console.log("Elapsed time 2:", elapsedTime / 1000, "seconds");

}


function main() {

    const startTime = startTimer();

    for (let i = 0; i < 1_000; i++) {
        gen();
    }

    const elapsedTime = getElapsedTime(startTime);
    console.log("Elapsed time 3:", elapsedTime / 1000, "seconds");

}

async function main2() {

    const keyPair1 = ec.keyFromPrivate("0000000000000000000000000000000000000000000000000000000000000000", "hex");
    const keyPair2 = ec.keyFromPrivate("0000000000000000000000000000000000000000000000000000000000000001", "hex");

    let lengthAll = [0, 0, 0];
    let average_length = [0, 0, 0];
    let min_length = [Infinity, Infinity, Infinity];
    let max_length = [0, 0, 0];

    let lengthAll2 = [0, 0, 0];
    let average_length2 = [0, 0, 0];
    let min_length2 = [Infinity, Infinity, Infinity];
    let max_length2 = [0, 0, 0];

    const run1 = (async function() {
        for (let i = 1; i < 1_000; i++) {
            const length = test2(keyPair1);
            for (let i2 = 0; i2 < 3; i2++) {
                average_length[i2] = (lengthAll[i2] + length[i2]) / i;
                min_length[i2] = (length[i2] < min_length[i2]) ? length[i2] : min_length[i2];
                max_length[i2] = (length[i2] > max_length[i2]) ? length[i2] : max_length[i2];
                lengthAll[i2] += length[i2];
            }
        }
    })();

    const run2 = (async function() {
        for (let i = 1; i < 1_000; i++) {
            const length2 = test2(keyPair2);
            for (let i2 = 0; i2 < 3; i2++) {
                average_length2[i2] = (lengthAll2[i2] + length2[i2]) / i;
                min_length2[i2] = (length2[i2] < min_length2[i2]) ? length2[i2] : min_length2[i2];
                max_length2[i2] = (length2[i2] > max_length2[i2]) ? length2[i2] : max_length2[i2];
                lengthAll2[i2] += length2[i2];
            }
        }
    })();

    await Promise.all([run1, run2]);

    console.log("Average 1:", average_length);
    console.log("Min 1:", min_length);
    console.log("Max 1:", max_length);

    console.log("Average 2:", average_length2);
    console.log("Min 2:", min_length2);
    console.log("Max 2:", max_length2);

}

async function main3() {

    const keyPair = ec.keyFromPrivate("0000000000000000000000000000000000000000000000000000000000000001", "hex");

    let lengthAll = [0, 0, 0];
    let average_length = [0, 0, 0];
    let min_length = [Infinity, Infinity, Infinity];
    let max_length = [0, 0, 0];

    for (let i = 1; i < 1_000; i++) {
        const length = test2(keyPair);
        for (let i2 = 0; i2 < 3; i2++) {
            average_length[i2] = (lengthAll[i2] + length[i2]) / i;
            min_length[i2] = (length[i2] < min_length[i2]) ? length[i2] : min_length[i2];
            max_length[i2] = (length[i2] > max_length[i2]) ? length[i2] : max_length[i2];
            lengthAll[i2] += length[i2];
        }
    }

    console.log("Average 1:", average_length);
    console.log("Min 1:", min_length);
    console.log("Max 1:", max_length);

}

async function main4() {

    const keyPair = ec.keyFromPrivate("0000000000000000000000000000000000000000000000000000000000000001", "hex");
    const address = "lc0xb3a373ff6d59118736ecbcc2de113504a9c4e1";

    let isAllTrue = true;

    for (let i = 0; i < 1_000; i++) {
        isAllTrue = isAllTrue && test3(keyPair, address);
    }

    console.log(isAllTrue);

}

async function test5(amount = 1_000) {
    
    const hash = Crypto.sha256(crypto.randomBytes(32));
    const signature = Crypto.sign(
        hash,
        PX.A_00,
        PrivateKey.from("c2c53b8c95f84438d86ccabd9985651afdf8fe1307f691681f9638ff04bf9caa")
    );

    let address;
    let publicKey;

    (async () => {

        const startTime = startTimer();

        for (let i = 0; i < amount; i++) {
            address = AddressHex.fromSignature(hash, signature);
        }

        const elapsedTime = getElapsedTime(startTime);
        console.log("Address", address);
        console.log("Elapsed time 1:", elapsedTime / 1000, "seconds");

    })();

    (async () => {

        const startTime = startTimer();

        for (let i = 0; i < amount; i++) {
            publicKey = Crypto.getPublicKeyFromSignature(hash, signature);
        }

        const elapsedTime = getElapsedTime(startTime);
        console.log("Public Key", publicKey);
        console.log("Elapsed time 2:", elapsedTime / 1000, "seconds");

    })();


}

async function run() {

    //await asyncMain();

    //await syncMain();

    //console.log(await getSenderAddress(messageHash, encodedSignature) === address);

};

//main();
//run();

//main3();

test5();
