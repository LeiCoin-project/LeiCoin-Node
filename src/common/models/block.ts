import { Transaction } from "./transaction.js";
import { Uint256, Uint64 } from "low-level";
import { AddressHex } from "./address.js";
import { PX } from "../types/prefix.js";
import { BE, DataEncoder } from "@leicoin/encoding";
import { Container, HashableContainer } from "./container.js";
import { Signature } from "@leicoin/crypto";

export class BlockBody extends Container {

    constructor(
        public transactions: Transaction[],
        //public slashings: Uint256[] = []
    ) {super()}

    protected static fromDict(obj: Dict<any>) {
        return new BlockBody(obj.transactions);
    }

    protected static encodingSettings: DataEncoder[] = [
        BE.Array("transactions", 2, Transaction)
    ]

}

export class Block extends HashableContainer {

    constructor(
        public index: Uint64,
        public slotIndex: Uint64,
        public hash: Uint256,
        public previousHash: Uint256,
        public timestamp: Uint64,
        public minter: AddressHex,
        public signature: Signature,
        public body: BlockBody,
        public readonly version: PX = PX.A_00
    ) {super()}

    protected static fromDict(obj: Dict<any>) {
        if (!obj.version.eq(0)) return null;

        const block = new Block(
            obj.index,
            obj.slotIndex,
            obj.hash,
            obj.previousHash,
            obj.timestamp,
            null as any,
            obj.signature,
            obj.body,
            obj.version
        );

        block.minter = AddressHex.fromSignature(block.calculateHash(), block.signature);

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
        BE.Object("body", BlockBody),
    ]

}



