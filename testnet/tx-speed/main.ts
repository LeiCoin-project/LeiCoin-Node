import { Uint, Uint256, Uint64 } from "low-level";
import { LCrypt, Signature } from "@leicoin/crypto";
import { AddressHex } from "@leicoin/common/models/address";
import { SecretWallet } from "@leicoin/common/models/wallet";
import fs from "fs";
import { Blockchain } from "@leicoin/storage/blockchain";
import { PX } from "@leicoin/common/types/prefix";
import { Transaction } from "@leicoin/common/models/transaction";
import { Block, BlockBody } from "@leicoin/common/models/block";
import { Verification } from "@leicoin/verification";

class Wallets {

    static readonly senderWallets: SecretWallet[] = [];

    static readonly targetAddresses: AddressHex[] = [];

    private static count: number;

    private static initialized = false;

    static async init(count: number) {
        if (this.initialized) return;
        this.initialized = true;

        this.count = count;
        await this.createSenderWallets();
        await this.createTargetAddresses();
    }

    private static async createSenderWallets() {
        const promises: Promise<void>[] = [];
    
        async function createSenderWallet() {
            const wallet = SecretWallet.fromPrivateKey(
                LCrypt.generatePrivateKey(),
                Uint64.from(1_000_00),
                Uint64.from(0),
            )

            Wallets.senderWallets.push(wallet);
            await Blockchain.wallets.setWallet(wallet);
        }
    
        for (let i = 0; i < this.count; i++) {
            promises.push(createSenderWallet());
        }
    
        await Promise.all(promises);
    }
    
    private static async createTargetAddresses() {
        
        const promises: Promise<void>[] = [];
    
        async function createTargetAddress() {
            const address = AddressHex.fromTypeAndBody(
                PX.A_00,
                new Uint(LCrypt.randomBytes(20))
            );
            Wallets.targetAddresses.push(address);
        }
    
        for (let i = 0; i < this.count; i++) {
            promises.push(createTargetAddress());
        }
    
        await Promise.all(promises);        

    }

}

export class TXSpeedTest {

    private static block: Block;

    private static count: number;    

    private static initialized = false;

    static async init(count: number) {
        if (this.initialized) return;
        this.initialized = true;

        this.count = count;

        console.log("Creating Wallets...")
        await Wallets.init(this.count);

        console.log("Creating Transactions and Block...")
        await this.createTransactionsAndBlock();
    }

    private static async createTransactionsAndBlock() {
        const promises: Promise<void>[] = [];

        const transactions: Transaction[] = [];

        async function createTransaction(senderWallet: SecretWallet, targetAddress: AddressHex) {
            const tx = new Transaction(
                Uint256.empty(),
                senderWallet.owner,
                targetAddress,
                Uint64.from(1_00_00),
                senderWallet.getNonce(),
                Uint64.from(Date.now()),
                Uint.empty(),
                Signature.empty()
            );

            tx.txid.set(tx.calculateHash());
            tx.signature = LCrypt.sign(tx.txid, PX.A_00, senderWallet.privateKey);

            transactions.push(tx);
        }

        for (let i = 0; i < this.count; i++) {
            promises.push(createTransaction(Wallets.senderWallets[i], Wallets.targetAddresses[i]));
        }

        await Promise.all(promises);

        const minterPrivateKey = LCrypt.generatePrivateKey();
        const minterAddress = AddressHex.fromPrivateKey(PX.A_0e, minterPrivateKey);

        this.block = new Block(
            Uint64.from(0),
            Uint64.from(0),
            Uint256.empty(),
            Uint256.empty(),
            Uint64.from(Date.now()),
            minterAddress,
            Signature.empty(),
            new BlockBody(
                transactions
            )
        );

        this.block.hash.set(this.block.calculateHash());
        this.block.signature.set(LCrypt.sign(this.block.hash, PX.A_0e, minterPrivateKey));
    }

    static async runVerify() {
        console.log("Starting Verification Speed Test...")
        console.time("TX Verify Speed");

        const promises: Promise<number>[] = [];

        for (const tx of this.block.body.transactions) {

            promises.push(Verification.verifyTransaction(tx));
        }

        const results = await Promise.all(promises);

        console.timeEnd("TX Verify Speed");
        console.log("Finished Verification Speed Test!");

        if (results.some(code => code !== 12000) || results.length !== this.count) {
            throw new Error("Verification failed!");
        }
    }


    static async runExecute() {
        console.log("Starting Execution Speed Test...");
        console.time("TX Execute Speed");

        await Blockchain.wallets.adjustWalletsByBlock(this.block);

        console.timeEnd("TX Execute Speed");
        console.log("Finished Execution Speed Test!");
    }

    static async end() {
        await Blockchain.stop();

        fs.rmSync(__dirname + "/blockchain_data", {recursive: true});
        fs.rmSync(__dirname + "/logs", {recursive: true});
        fs.rmSync(__dirname + "/config", {recursive: true});
    }

}
