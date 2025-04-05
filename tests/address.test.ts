import { describe, test, expect } from "bun:test";
import { PrivateKey } from "../src/crypto/cryptoKeys.js";
import { LCrypt } from "@leicoin/crypto";
import { Address32, AddressHex } from "@leicoin/common/models/address";
import { PX } from "@leicoin/common/types/prefix";

describe("address", () => {
    test("address32_enoding_and_decoding", () => {

        const privateKeyHex = PrivateKey.from("c2c53b8c95f84438d86ccabd9985651afdf8fe1307f691681f9638ff04bf9caa");
        const address = Address32.fromPrivateKey(PX.A_00, privateKeyHex);

        const hashData = LCrypt.sha256(Buffer.from("0123456789abcdef"));

        const signature = LCrypt.sign(hashData, PX.A_00, privateKeyHex);
        const recoveredAddress = Address32.fromSignature(hashData, signature);

        expect((address === recoveredAddress) ? address : null).toBe("lc0x174k3e4s7enw4ss8hu2dnj6kzspks3hm");
    });
    test("addresshex_enoding_and_decoding", () => {

        const privateKeyHex = PrivateKey.from("c2c53b8c95f84438d86ccabd9985651afdf8fe1307f691681f9638ff04bf9caa");
        const address = AddressHex.fromPrivateKey(PX.A_00, privateKeyHex);

        const hashData = LCrypt.sha256(Buffer.from("0123456789abcdef"));

        const signature = LCrypt.sign(hashData, PX.A_00, privateKeyHex);
        const recoveredAddress = AddressHex.fromSignature(hashData, signature);

        expect((address.toHex() === recoveredAddress.toHex()) ? address.toHex() : null).toBe("000187213479336bd1e72786c2cac4b2fe6d2c8a14");
    });
    test("coinbase_address_gettting", () => {

        const privateKeyHex = PrivateKey.empty();
        const address = AddressHex.fromPrivateKey(PX.A_00, privateKeyHex);

        expect(address.toHex()).toBe("00dc33296e4d20f0ef35ff9fd449e23ebbaa5a049a");
    });
});