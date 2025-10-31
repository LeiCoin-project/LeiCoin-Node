import crypto from "crypto";
import { sha256 } from "./cryptoUtils.js";
import { startTimer, getElapsedTime } from "@advena/utils/testUtils"

const leiCoinAddress32Chars = '123456789abcdefghjklmnpqrstuvwyz';
//const leiCoinAddress32Chars = '0123456789abcdefghijklmnopqrstuv';

function hexToAddress32(hexString) {
    let decimalValue = BigInt('0x1' + hexString);
    let address32 = '';
    while (decimalValue > 0n) {
        address32 = leiCoinAddress32Chars[Number(decimalValue % 32n)] + address32;
        decimalValue = decimalValue / 32n;
    }
    return address32.slice(1);
}

function address32ToHex(address32) {
    address32 = "2" + address32;
    let decimalValue = 0n;
    for (let i = 0; i < address32.length; i++) {
        decimalValue = (decimalValue * 32n) + BigInt(leiCoinAddress32Chars.indexOf(address32[i]));
    }
    return decimalValue.toString(16).slice(1);
}

function test1() {

    let bool = true;
    let bool2 = true;

    const startTime = startTimer();

    for (let i = 0; i < 1_000_000; i++) {
        const hexAddress = crypto.randomBytes(20).toString("hex");
        const address32 = hexToAddress32(hexAddress);
        const final_hexAddress = address32ToHex(address32);

        //console.log(address32);
        bool = ((final_hexAddress === hexAddress) === bool);
        bool2 = ((address32.length === 32) === bool2);
    }

    const elapsedTime = getElapsedTime(startTime);

    console.log(bool, bool2);
    console.log("Elapsed time:", elapsedTime / 1000, "seconds");

}

function test2() {

    let lengthAll = 0;
    let average_length = 0;
    let min_length = Infinity;
    let max_length = 0;

    let min_hex_length = Infinity;
    let max_hex_length = 0;

    for (let i = 1; i < 1_000_000; i++) {
        const orginalHex = crypto.randomBytes(20).toString("hex");
        const address32 = hexToAddress32(orginalHex);
        const length = address32.length;
        average_length = (lengthAll + length) / i;
        min_length = (length < min_length) ? length : min_length;
        max_length = (length > max_length) ? length : max_length;
        lengthAll += length;

        const hex = address32ToHex(address32);
        const hexLength = hex.length;
        min_hex_length = (hexLength < min_hex_length) ? hexLength : min_hex_length;
        max_hex_length = (hexLength > max_hex_length) ? hexLength : max_hex_length;
        if (hexLength !== 40) {
            console.log("Invalid hex lengt: ", address32, orginalHex, orginalHex.length, hex, hex.length);
        }
    }

    console.log("Average:", average_length);
    console.log("Min:", min_length);
    console.log("Max:", max_length);
    console.log("Min Hex:", min_hex_length);
    console.log("Max Hex:", max_hex_length);

}

function test3() {

    let originalHexAddress = crypto.randomBytes(20).toString("hex");
    let hexAddress = originalHexAddress;

    const startTime = startTimer();

    for (let i = 0; i < 1_000; i++) {
        const address32 = hexToAddress32(hexAddress);
        hexAddress = address32ToHex(address32);
    }

    const elapsedTime = getElapsedTime(startTime);

    console.log(originalHexAddress === hexAddress)
    console.log("Elapsed time:", elapsedTime / 1000, "seconds");

}



//test1();
//test2();
test3();
