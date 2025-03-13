import { AddressHex } from "./address.js";
import { Uint, Uint256, Uint64 } from "low-level";
import { PX } from "../types/prefix.js";
import { MinterCredentials } from "./minterData.js";
import { BE, DataEncoder } from "@leicoin/encoding";
import { HashableContainer } from "./container.js";
import { LCrypt, Signature } from "@leicoin/crypto";

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

    public static createCoinbaseTransaction(mc: MinterCredentials) {

        const coinbase_tx = new Transaction(
            Uint256.alloc(),
            AddressHex.from("007f9c9e31ac8256ca2f258583df262dbc7d6f68f2"),
            mc.address,
            Uint64.from(10),
            Uint64.from(0),
            Uint64.from(new Date().getTime()),
            Uint.empty(),
            Signature.alloc(),
        );

        coinbase_tx.txid.set(coinbase_tx.calculateHash());
        coinbase_tx.signature.set(LCrypt.sign(coinbase_tx.txid, PX.V_00, Uint256.alloc()));

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

        if (!tx.calculateHash().eq(tx.txid)) return null;

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

}


