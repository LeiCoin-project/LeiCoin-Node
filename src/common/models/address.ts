import { FixedUint, Uint, Uint256 } from "low-level";
import { DataUtils } from "@leicoin/utils/dataUtils";
import { PX } from "../types/prefix.js";
import { LCrypt, PrivateKey, PublicKey, Signature } from "@leicoin/crypto";

export class SpecificAddress extends FixedUint {
    
    public static readonly byteLength = 20;
    public static readonly addressType: PX;

    public getType() {
        return PX.A_00;
    };

    public static fromTypeAndBody(addressBody: Uint) {
        return new this(addressBody);
    }

    public static fromPublicKey(publicKey: PublicKey) {
        return this.concat([this.addressType, LCrypt.sha256(publicKey).slice(0, 20)]);
    }

    public static fromPrivateKey(privateKey: Uint256) {
        return this.fromPublicKey(LCrypt.getPublicKeyFromPrivateKey(privateKey));
    }

    public static fromSignature(hash: Uint256, signature: Signature) {
        const publicKey = LCrypt.getPublicKeyFromSignature(hash, signature);
        return this.fromPublicKey(publicKey);
    }

}

export class AddressHex extends FixedUint {

    public static readonly byteLength = 21;

    public getType() {
        return this.slice(0, 1);
    }

    public getBody() {
        return this.slice(1);
    }

    public static fromTypeAndBody(addressType: PX.AddressType, addressBody: Uint) {
        return new this(Uint.concat([
            addressType,
            addressBody
        ]));
    }

    public static fromPublicKey(addressType: PX.AddressType, publicKey: PublicKey) {
        return this.concat([addressType, LCrypt.sha256(publicKey).slice(0, 20)]);
    }

    public static fromPrivateKey(addressType: PX.AddressType, privateKey: Uint256) {
        return this.fromPublicKey(addressType, LCrypt.getPublicKeyFromPrivateKey(privateKey));
    }

    public static fromSignature(hash: Uint256, signature: Signature) {
        const publicKey = LCrypt.getPublicKeyFromSignature(hash, signature);
        return this.fromPublicKey(signature.getSignerType(), publicKey);
    }

}


export class Address32 {

    private static address32Chars = '123456789abcdefghjklmnpqrstuvwyz';

    public static getType(address32: string) {
        return address32.slice(2, 4);
    }

    public static toAddressHex(address32: string) {

        const address32Data = "2" + address32.slice(4).toLowerCase();
        let decimalValue = 0n;
        for (let i = 0; i < address32Data.length; i++) {
            decimalValue = (decimalValue * 32n) + BigInt(this.address32Chars.indexOf(address32Data[i] as string));
        }

        return this.getType(address32).replace("x", "0") + decimalValue.toString(16).slice(1);
    }
    
    public static fromAddressHex(addressHex: AddressHex) {

        let decimalValue = BigInt('0x1' + addressHex.slice(1).toHex());
        let address32 = '';
        while (decimalValue > 0n) {
            address32 = this.address32Chars[Number(decimalValue % 32n)] + address32;
            decimalValue = decimalValue / 32n;
        }

        return "lc" + DataUtils.replaceAtIndex(addressHex.getType().toHex(), "0", "x", 1) + address32.slice(1);
    }

    public static fromPublicKey(addressType: PX.AddressType, publicKey: PublicKey) {
        return this.fromAddressHex(AddressHex.fromPublicKey(addressType, publicKey));
    }

    public static fromPrivateKey(addressType: PX.AddressType, privateKey: PrivateKey) {
        return this.fromPublicKey(addressType, LCrypt.getPublicKeyFromPrivateKey(privateKey));
    }

    public static fromSignature(hash: Uint256, signature: Signature) {
        const publicKey = LCrypt.getPublicKeyFromSignature(hash, signature);
        return this.fromPublicKey(signature.getSignerType(), publicKey);
    }

}