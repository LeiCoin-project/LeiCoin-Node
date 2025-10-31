import { describe, test, expect } from "bun:test";
import { AddressHex } from "@advena/common/models/address";
import { Block } from "@advena/common/models/block";
import { Signature } from "@advena/crypto";
import { Blockchain } from "@advena/storage/blockchain";
import { Uint256, Uint64 } from "low-level";

describe("blockchain", () => {
    /*test("is_valid_genesis_block", () => {
        const result = Blockchain.chainstate.isBlockChainStateMatching(new Block(
            Uint64.from(0),
            Uint64.from(0),
            Uint256.empty(),
            Uint256.empty(),
            Uint64.from(0),
            AddressHex.empty(),
            Signature.empty(),
            []
        ));
        expect(JSON.stringify(result)).toBe(JSON.stringify({ status: 12000, targetChain: "main", parentChain: "main" }));
    });*/
});