import { describe, test, expect } from "bun:test";
import { MinterData, MinterCredentials } from "@advena/common/models/minterData";
import { AddressHex } from "@advena/common/models/address";
import { Block, BlockBody, ExecutedBlock } from "@advena/common/models/block";
import { Transaction } from "@advena/common/models/transaction";
import { Wallet } from "@advena/common/models/wallet";
import { Signature, PrivateKey, LCrypt } from "@advena/crypto";
import { Uint64, Uint256 } from "low-level";
import { PX } from "@advena/common/types/prefix";
import { AVM } from "@advena/avm";

describe("encoding", () => {
    test("block_enoding_and_decoding", () => {

        const privateKey = LCrypt.generatePrivateKey();
        const address = AddressHex.fromPrivateKey(PX.A_0e, privateKey);

        const block = new Block(
            Uint64.from(0),
            Uint64.from(0),
            Uint256.empty(),
            Uint256.empty(),
            address,
            Signature.empty(),
            new BlockBody([])
        );

        block.sign(privateKey);

        const decoded: any = Block.fromDecodedHex(block.encodeToHex());
        const decoded2 = Block.fromDecodedHex(decoded.encodeToHex());
        //fs.writeFileSync("./blockchain_data/test.bin", decoded2.encodeToHex(), {encoding: "hex", flag: "w"});
        //console.log(decoded2?.encodeToHex().length);

        expect(JSON.stringify(decoded2)).toBe(JSON.stringify(block));
    });
    test("executed_block_enoding_and_decoding", () => {

        const privateKey = LCrypt.generatePrivateKey();
        const address = AddressHex.fromPrivateKey(PX.A_0e, privateKey);

        function createRandomTx(): Transaction {
            const privateKey = LCrypt.generatePrivateKey();
            const address = AddressHex.fromPrivateKey(PX.A_0e, privateKey);
            const mc = new MinterCredentials(privateKey, address);

            return Transaction.createCoinbaseTransaction(mc);
        }

        const ramdomTxs: Transaction[] = [];
        for (let i = 0; i < 10; i++) {
            ramdomTxs.push(createRandomTx());
        }

        const block = new Block(
            Uint64.from(0),
            Uint64.from(0),
            Uint256.empty(),
            Uint256.empty(),
            address,
            Signature.empty(),
            new BlockBody(ramdomTxs)
        );

        block.sign(privateKey);

        const executedBlock = ExecutedBlock.fromBlockAndExecResults(
            block,
            Array(ramdomTxs.length).fill(AVM.TXExecResult.SUCCESS)
        );

        const decoded: any = ExecutedBlock.fromDecodedHex(executedBlock.encodeToHex());
        const decoded2 = ExecutedBlock.fromDecodedHex(decoded.encodeToHex());

        expect(JSON.stringify(decoded2)).toBe(JSON.stringify(executedBlock));
    });
    test("transaction_enoding_and_decoding", () => {

        const privateKey = LCrypt.generatePrivateKey();
        const address = AddressHex.fromPrivateKey(PX.A_0e, privateKey);
        const mc = new MinterCredentials(privateKey, address);

        const tx = Transaction.createCoinbaseTransaction(mc);

        const decoded: any = Transaction.fromDecodedHex(tx.encodeToHex());
        const decoded2 = Transaction.fromDecodedHex(decoded.encodeToHex());

        expect(JSON.stringify(decoded2)).toBe(JSON.stringify(tx));
    });
    test("minter_enoding_and_decoding", () => {

        const address = AddressHex.from("0edc33296e4d20f0ef35ff9fd449e23ebbaa5a049a");

        const minter = new MinterData(
            address,
            Uint64.from(32_0000_0000)
        );

        const decoded: any = MinterData.fromDecodedHex(address, minter.encodeToHex());
        const decoded2 = MinterData.fromDecodedHex(address, decoded.encodeToHex());

        expect(JSON.stringify(decoded2)).toBe(JSON.stringify(minter));

    });
    test("wallet_enoding_and_decoding", () => {

        const address = AddressHex.from("00dc33296e4d20f0ef35ff9fd449e23ebbaa5a049a");
        
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
