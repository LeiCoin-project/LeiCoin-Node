import { AddressHex } from "./address.js";
import { Uint, Uint256, Uint64, Uint8 } from "low-level";
import { PX } from "../types/prefix.js";
import { MinterCredentials } from "./minterData.js";
import { BE, DataEncoder, HashableContainer } from "flexbuf";
import { LCrypt, PrivateKey, Signature } from "@advena/crypto";

export class Transaction extends HashableContainer {

    constructor(
        readonly txid: Uint256,
        readonly senderAddress: AddressHex,
        readonly recipientAddress: AddressHex,
        readonly amount: Uint64,
        readonly nonce: Uint64,
        readonly timestamp: Uint64,
        readonly input: Uint,
        readonly signature: Signature,
        readonly version = PX.V_00
    ) {super()}

    static createCoinbaseTransaction(mc: MinterCredentials) {

        const coinbase_tx = new Transaction(
            Uint256.alloc(),
            AddressHex.from("00dc33296e4d20f0ef35ff9fd449e23ebbaa5a049a"),
            mc.address,
            Uint64.from(10),
            Uint64.from(0),
            Uint64.from(new Date().getTime()),
            Uint.empty(),
            Signature.alloc(),
        );

        coinbase_tx.sign(PrivateKey.empty());

        return coinbase_tx;
    }

    protected static fromDict(obj: any) {
        if (!obj.version.eq(0)) return null;

        const tx = new Transaction(
            obj.txid,
            AddressHex.fromSignature(obj.txid, obj.signature),
            obj.recipientAddress,
            obj.amount,
            obj.nonce,
            obj.timestamp,
            obj.input,
            obj.signature,
            obj.version
        );

        return tx;
    }

    protected static encodingSettings: DataEncoder[] = [
        BE(PX, "version"),
        BE(Uint256, "txid", true),
        BE(AddressHex, "recipientAddress"),
        BE.BigInt("amount"),
        BE.BigInt("nonce"),
        BE.BigInt("timestamp"),
        BE.Custom("input", { type: "prefix", val: "unlimited" }),
        BE(Signature, "signature", true)
    ]

    public sign(privateKey: PrivateKey) {
        this.txid.set(this.calculateHash());
        this.signature.set(LCrypt.sign(this.txid, PX.A_00, privateKey));
    }

}


export class ExecutedTransaction extends Transaction {

    constructor(
        txid: Uint256,
        senderAddress: AddressHex,
        recipientAddress: AddressHex,
        amount: Uint64,
        nonce: Uint64,
        timestamp: Uint64,
        input: Uint,
        signature: Signature,
        readonly executionResult: Uint8,
        version = PX.V_00
    ) {
        super(
            txid,
            senderAddress,
            recipientAddress,
            amount,
            nonce,
            timestamp,
            input,
            signature,
            version
        );
    }

    protected static fromDict(obj: any) {
        if (!obj.version.eq(0)) return null;

        const tx = new ExecutedTransaction(
            obj.txid,
            AddressHex.fromSignature(obj.txid, obj.signature),
            obj.recipientAddress,
            obj.amount,
            obj.nonce,
            obj.timestamp,
            obj.input,
            obj.signature,
            obj.executionResult,
            obj.version
        );

        return tx;
    }

    protected static encodingSettings: DataEncoder[] = [
        ...Transaction.encodingSettings,
        BE(Uint8, "executionResult")
    ]

}