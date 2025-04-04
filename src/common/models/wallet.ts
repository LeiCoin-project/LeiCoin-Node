import { type NumberLike, Uint, Uint256, Uint64 } from "low-level";
import { cli } from "@leicoin/cli";
import { AddressHex } from "./address.js";
import { PX } from "../types/prefix.js";
import { PrivateKey, LCrypt } from "@leicoin/crypto";
import { ObjectEncoding, DataEncoder, BE } from "flexbuf";

export class Wallet {

    private readonly balance: Uint64;
    private readonly nonce: Uint64;

    constructor(
        readonly owner: AddressHex,
        balance: Uint64,
        nonce: Uint64,
        readonly version = PX.V_00
    ) {
        this.balance = balance.clone();
        this.nonce = nonce.clone();
    }

    public static createEmptyWallet(owner: AddressHex) {
        return new Wallet(owner, Uint64.alloc(), Uint64.alloc());
    }

    public encodeToHex() {
        return ObjectEncoding.encode(this, Wallet.encodingSettings, false).data;
    }
    
    public static fromDecodedHex(ownerAddress: AddressHex, hexData: Uint) {
        try {
            const resultData = ObjectEncoding.decode(hexData, Wallet.encodingSettings);
            const data = resultData.data;

            if (data && data.version.eq(0)) {
                return new Wallet(ownerAddress, data.balance, data.nonce, data.version);
            }
        } catch (err: any) {
            cli.data.error(`Error loading Wallet from Decoded Hex: ${err.stack}`);
        }
        return null;
    }

    protected static encodingSettings: DataEncoder[] = [
        BE(PX, "version"),
        BE.BigInt("balance"),
        BE.BigInt("nonce")
    ]

    public addMoney(amount: NumberLike) {
        this.balance.iadd(amount);
    }

    public getBalance() {
        return this.balance;
    }

    public isSubtractMoneyPossible(amount: NumberLike) {
        return this.balance.gte(amount);
    }

    public subtractMoneyIFPossible(amount: NumberLike) {
        if (!this.isSubtractMoneyPossible(amount)) return false;
        
        this.balance.isub(amount);
        return true;
    }

    public getNonce() {
        return this.nonce;
    }

    public adjustNonce(height = 1) {
        this.nonce.iadd(height);
    }

}

export class SecretWallet extends Wallet {

    public privateKey: PrivateKey;

    constructor(privateKey: PrivateKey, owner: AddressHex, balance: Uint64, nonce: Uint64, version = PX.V_00) {
        super(owner, balance, nonce, version);
        this.privateKey = privateKey;
    }

    public static fromPrivateKey(privateKey: PrivateKey, balance: Uint64, nonce: Uint64, version = PX.V_00) {
        return new SecretWallet(
            privateKey,
            AddressHex.fromPrivateKey(PX.A_00, privateKey),
            balance,
            nonce,
            version
        );
    }

    public static createEmptyWallet(privateKey: PrivateKey): SecretWallet;
    public static createEmptyWallet(ownerAddress: AddressHex): SecretWallet;
    public static createEmptyWallet(privKeyORAddress: PrivateKey | AddressHex) {
        let privateKey: PrivateKey = privKeyORAddress as PrivateKey;
        if (privKeyORAddress instanceof AddressHex) {
            privateKey = LCrypt.generatePrivateKey();
        }
        return SecretWallet.fromPrivateKey(privateKey, Uint64.alloc(), Uint64.alloc());
    }

    public SencodeToHex() {
        return ObjectEncoding.encode(this, SecretWallet.SencodingSettings, false).data;
    }
    
    public static SfromDecodedHex(hexData: Uint) {
        try {
            const resultData = ObjectEncoding.decode(hexData, SecretWallet.SencodingSettings);
            const data = resultData.data;

            if (data && data.version.eq(0)) {
                return SecretWallet.fromPrivateKey(data.privateKey, data.balance, data.nonce, data.version)
            }
        } catch (err: any) {
            cli.data.error(`Error loading Wallet from Decoded Hex: ${err.stack}`);
        }
        return null;
    }

    protected static SencodingSettings: DataEncoder[] = [
        BE(PX, "version"),
        BE(Uint256, "privateKey"),
        BE.BigInt("balance"),
        BE.BigInt("nonce")
    ]

}



