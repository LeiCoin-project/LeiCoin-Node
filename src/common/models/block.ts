import { ExecutedTransaction, Transaction } from "./transaction.js";
import { Uint256, Uint64 } from "low-level";
import { AddressHex } from "./address.js";
import { PX } from "../types/prefix.js";
import { BE, DataEncoder, HashableContainer } from "flexbuf";
import { LCrypt, PrivateKey, Signature } from "@advena/crypto";
import { POSUtils } from "@advena/pos/utils";

export class BlockHeader extends HashableContainer {
    constructor(
        readonly index: Uint64,
        readonly slotIndex: Uint64,
        readonly hash: Uint256,
        readonly previousHash: Uint256,
        readonly minter: AddressHex,
        readonly signature: Signature,
        readonly body_hash: Uint256,
        readonly timestamp: Uint64 = Uint64.from(POSUtils.calculateSlotExecutionTime(slotIndex)),
        readonly version: PX = PX.A_00
    ) { super() }

    protected static fromDict(obj: Dict<any>) {
        if (!obj.version.eq(0)) return null;

        const minter = AddressHex.fromSignature(obj.hash, obj.signature);
        if (!minter) return null;

        const block_header = new BlockHeader(
            obj.index,
            obj.slotIndex,
            obj.hash,
            obj.previousHash,
            minter,
            obj.signature,
            obj.body_hash,
            Uint64.from(POSUtils.calculateSlotExecutionTime(obj.slotIndex)),
            obj.version
        );

        return block_header;
    }

    protected static encodingSettings: DataEncoder[] = [
        BE(PX, "version"),
        BE.BigInt("index"),
        BE.BigInt("slotIndex"),
        BE(Uint256, "hash", true),
        BE(Uint256, "previousHash"),
        BE(Signature, "signature", true),
        BE(Uint256, "body_hash"),
    ]

    public sign(privateKey: PrivateKey) {
        this.hash.set(this.calculateHash());
        this.signature.set(LCrypt.sign(this.hash, PX.A_0e, privateKey));
    }

}

export class BlockBody extends HashableContainer {

    constructor(
        readonly transactions: Transaction[],
        //public slashings: Uint256[] = []
    ) { super() }

    protected static fromDict(obj: Dict<any>) {
        return new BlockBody(obj.transactions);
    }

    protected static encodingSettings: DataEncoder[] = [
        BE.Array("transactions", 2, Transaction)
    ]

}

export class Block extends BlockHeader {

    constructor(
        index: Uint64,
        slotIndex: Uint64,
        hash: Uint256,
        previousHash: Uint256,
        minter: AddressHex,
        signature: Signature,
        readonly body: BlockBody,
        body_hash: Uint256 = body.calculateHash(),
        timestamp: Uint64 = Uint64.from(POSUtils.calculateSlotExecutionTime(slotIndex)),
        version: PX = PX.A_00
    ) {
        super(
            index,
            slotIndex,
            hash,
            previousHash,
            minter,
            signature,
            body_hash,
            timestamp,
            version
        )
    }

    protected static fromDict(obj: Dict<any>) {
        if (!obj.version.eq(0)) return null;

        const minter = AddressHex.fromSignature(obj.hash, obj.signature);
        if (!minter) return null;

        const block = new Block(
            obj.index,
            obj.slotIndex,
            obj.hash,
            obj.previousHash,
            minter,
            obj.signature,
            obj.body,
            obj.body_hash,
            Uint64.from(POSUtils.calculateSlotExecutionTime(obj.slotIndex)),
            obj.version
        );

        return block;
    }

    protected static encodingSettings: DataEncoder[] = [
        ...BlockHeader.encodingSettings,
        BE.Object("body", BlockBody, true)
    ]

}



export class ExecutedBlockBody extends BlockBody {

    constructor(
        readonly transactions: ExecutedTransaction[],
        // slashings: Uint256[] = []
    ) { super(transactions) }

    protected static fromDict(obj: Dict<any>) {
        return new ExecutedBlockBody(obj.transactions);
    }

    protected static encodingSettings: DataEncoder[] = [
        BE.Array("transactions", 2, ExecutedTransaction)
    ]

}

export interface ExecutedBlock {
    readonly body: ExecutedBlockBody;
}

export class ExecutedBlock extends Block {

    constructor(
        index: Uint64,
        slotIndex: Uint64,
        hash: Uint256,
        previousHash: Uint256,
        minter: AddressHex,
        signature: Signature,
        body: ExecutedBlockBody,
        body_hash: Uint256 = body.calculateHash(),
        timestamp: Uint64 = Uint64.from(POSUtils.calculateSlotExecutionTime(slotIndex)),
        version: PX = PX.A_00
    ) {
        super(
            index,
            slotIndex,
            hash,
            previousHash,
            minter,
            signature,
            body,
            body_hash,
            timestamp,
            version
        )
    }

    protected static fromDict(obj: Dict<any>) {
        if (!obj.version.eq(0)) return null;

        const minter = AddressHex.fromSignature(obj.hash, obj.signature);
        if (!minter) return null;

        const block = new ExecutedBlock(
            obj.index,
            obj.slotIndex,
            obj.hash,
            obj.previousHash,
            minter,
            obj.signature,
            obj.body,
            obj.body_hash,
            Uint64.from(POSUtils.calculateSlotExecutionTime(obj.slotIndex)),
            obj.version
        );

        return block;
    }

    protected static encodingSettings: DataEncoder[] = [
        ...BlockHeader.encodingSettings,
        BE.Object("body", ExecutedBlockBody, true)
    ]

}
