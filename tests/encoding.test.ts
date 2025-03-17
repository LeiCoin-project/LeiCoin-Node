import { describe, test, expect } from "bun:test";
import { MinterData, MinterCredentials } from "@leicoin/common/models/minterData";
import { AddressHex } from "@leicoin/common/models/address";
import { Block, BlockBody } from "@leicoin/common/models/block";
import { Transaction } from "@leicoin/common/models/transaction";
import { Wallet } from "@leicoin/common/models/wallet";
import { Signature, PrivateKey } from "@leicoin/crypto";
import { Uint64, Uint256 } from "low-level";

describe("encoding", () => {
    test("block_enoding_and_decoding", () => {

        const address = AddressHex.from("007f9c9e31ac8256ca2f258583df262dbc7d6f68f2");

        const block = new Block(
            Uint64.from(0),
            Uint64.from(0),
            Uint256.empty(),
            Uint256.empty(),
            address,
            Signature.empty(),
            new BlockBody([])
        );

        block.hash.set(block.calculateHash());

        const decoded: any = Block.fromDecodedHex(block.encodeToHex());
        const decoded2 = Block.fromDecodedHex(decoded.encodeToHex());

        //fs.writeFileSync("./blockchain_data/test.bin", decoded2.encodeToHex(), {encoding: "hex", flag: "w"});
        //console.log(decoded2?.encodeToHex().length);

        expect(JSON.stringify(decoded2)).toBe(JSON.stringify(block));
    });
    test("transaction_enoding_and_decoding", () => {

        const address = AddressHex.from("007f9c9e31ac8256ca2f258583df262dbc7d6f68f2");
        const mc = new MinterCredentials(PrivateKey.empty(), address);

        const tx = Transaction.createCoinbaseTransaction(mc);

        const decoded: any = Transaction.fromDecodedHex(tx.encodeToHex());
        const decoded2 = Transaction.fromDecodedHex(decoded.encodeToHex());

        expect(JSON.stringify(decoded2)).toBe(JSON.stringify(tx));
    });
    test("minter_enoding_and_decoding", () => {

        const address = AddressHex.from("0e7f9c9e31ac8256ca2f258583df262dbc7d6f68f2");

        const minter = new MinterData(
            address,
            Uint64.from(32_0000_0000)
        );

        const decoded: any = MinterData.fromDecodedHex(address, minter.encodeToHex());
        const decoded2 = MinterData.fromDecodedHex(address, decoded.encodeToHex());

        expect(JSON.stringify(decoded2)).toBe(JSON.stringify(minter));

    });
    test("wallet_enoding_and_decoding", () => {

        const address = AddressHex.from("007f9c9e31ac8256ca2f258583df262dbc7d6f68f2");
        
        const wallet = new Wallet(
            address,
            Uint64.from(10000000000000),
            Uint64.from(10000000)
        );

        const decoded: any = Wallet.fromDecodedHex(address, wallet.encodeToHex());
        const decoded2 = Wallet.fromDecodedHex(address, decoded.encodeToHex());

        expect(JSON.stringify(decoded2)).toBe(JSON.stringify(wallet));
    });
});
