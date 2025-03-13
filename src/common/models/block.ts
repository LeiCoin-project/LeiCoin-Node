import { Transaction } from "./transaction.js";
import { Uint256, Uint64 } from "low-level";
import { AddressHex } from "./address.js";
import { PX } from "../types/prefix.js";
import { BE, DataEncoder } from "@leicoin/encoding";
import { HashableContainer } from "./container.js";
import { Signature } from "@leicoin/crypto";

export class BlockHeader extends HashableContainer {
    constructor(
        readonly index: Uint64,
        readonly slotIndex: Uint64,
        readonly hash: Uint256,
        readonly previousHash: Uint256,
        readonly timestamp: Uint64,
        readonly minter: AddressHex,
        readonly signature: Signature,
        readonly body_hash: Uint256,
        readonly version: PX = PX.A_00
    ) {super()}

    protected static fromDict(obj: Dict<any>) {
        if (!obj.version.eq(0)) return null;

        const block_header = new BlockHeader(
            obj.index,
            obj.slotIndex,
            obj.hash,
            obj.previousHash,
            obj.timestamp,
            AddressHex.fromSignature(obj.hash, obj.signature),
            obj.signature,
            obj.body_hash,
            obj.version
        );

        if (!block_header.calculateHash().eq(block_header.hash)) return null;

        return block_header;
    }

    protected static encodingSettings: DataEncoder[] = [
        BE(PX,"version"),
        BE.BigInt("index"),
        BE.BigInt("slotIndex"),
        BE(Uint256, "hash", true),
        BE(Uint256, "previousHash"),
        BE.BigInt("timestamp"),
        BE(Signature,"signature", true),
        BE(Uint256, "body_hash"),
    ]

}

export class BlockBody extends HashableContainer {

    constructor(
        readonly transactions: Transaction[],
        //public slashings: Uint256[] = []
    ) {super()}

    protected static fromDict(obj: Dict<any>) {
        return new BlockBody(obj.transactions);
    }

    protected static encodingSettings: DataEncoder[] = [
        BE.Array("transactions", 2, Transaction)
    ]

}

export class Block extends BlockHeader {

    constructor(
        readonly index: Uint64,
        readonly slotIndex: Uint64,
        readonly hash: Uint256,
        readonly previousHash: Uint256,
        readonly timestamp: Uint64,
        readonly minter: AddressHex,
        readonly signature: Signature,
        readonly body: BlockBody,
        readonly body_hash: Uint256 = body.calculateHash(),
        readonly version: PX = PX.A_00
    ) {super(
        index,
        slotIndex,
        hash,
        previousHash,
        timestamp,
        minter,
        signature,
        body_hash,
        version
    )}

    protected static fromDict(obj: Dict<any>) {
        if (!obj.version.eq(0)) return null;

        const block = new Block(
            obj.index,
            obj.slotIndex,
            obj.hash,
            obj.previousHash,
            obj.timestamp,
            AddressHex.fromSignature(obj.hash, obj.signature),
            obj.signature,
            obj.body,
            obj.body_hash,
            obj.version
        );

        if (!block.calculateHash().eq(block.hash)) return null;

        return block;
    }

    protected static encodingSettings: DataEncoder[] = [
        BE(PX,"version"),
        BE.BigInt("index"),
        BE.BigInt("slotIndex"),
        BE(Uint256, "hash", true),
        BE(Uint256, "previousHash"),
        BE.BigInt("timestamp"),
        BE(Signature,"signature", true),
        BE(Uint256, "body_hash"),
        BE.Object("body", BlockBody),
    ]

}
