import { startTimer, getElapsedTime } from "@advena/utils/testUtils';
import { sha256 } from './cryptoUtils.js';
import crypto from "crypto";

class BigNum {

    static add(v1, v2) {
        return (BigInt(v1) + BigInt(v2)).toString();
    }

    static subtract(v1, v2) {
        return (BigInt(v1) - BigInt(v2)).toString();
    }

    static multiply(v1, v2) {
        return (BigInt(v1) * BigInt(v2)).toString();
    }

    static divide(v1, v2) {
        return (BigInt(v1) / BigInt(v2)).toString();
    }

    static mod(v1, v2) {
        return (BigInt(v1) % BigInt(v2)).toString();
    }

    static greater(v1, v2) {
        return BigInt(v1) > BigInt(v2);
    }

    static greaterOrEqual(v1, v2) {
        return BigInt(v1) >= BigInt(v2);
    }

    static less(v1, v2) {
        return BigInt(v1) < BigInt(v2);
    }

    static lessOrEqual(v1, v2) {
        return BigInt(v1) <= BigInt(v2);
    }

    static max(v1, v2) {
        return this.greater(v1, v2) ? v1 : v2;
    }

    static min(v1, v2) {
        return this.less(v1, v2) ? v1 : v2;
    }

}

function test1() {

    const array1 = [];

    const r2 = "22742734291";

    const startTime = startTimer();


    for (let i = 0; i < 1_000_000; i++) {
        const r = i.toString();
        array1.push(BigNum.add(r, r2), BigNum.subtract(r, r2), BigNum.multiply(r, r2), BigNum.divide(r, r2), BigNum.mod(r, r2));
    }

    const elapsedTime = getElapsedTime(startTime);

    console.log(array1);
    console.log("Elapsed time:", elapsedTime / 1000, "seconds");

}

function test2() {

    const bytes = crypto.randomBytes(2048).toString("hex");
    let hash;

    const startTime = startTimer();

    for (let i = 0; i < 1_000; i++) {
        hash = sha256(bytes);
    }

    const elapsedTime = getElapsedTime(startTime);

    console.log("Elapsed time:", elapsedTime / 1000, "seconds");
    
}

test2();