import { NumberLike, Uint, Uint64 } from "low-level";
import { cli } from "@leicoin/cli";
import { AddressHex } from "./address.js";
import { PX } from "../types/prefix.js";
import { BE, DataEncoder, ObjectEncoding } from "flexbuf";
import { PrivateKey } from "@leicoin/crypto";

export class MinterData {

    private readonly stake: Uint64;

    constructor(
        readonly address: AddressHex,
        stake: Uint64,
        readonly version = PX.V_00
    ) {
        this.stake = stake.clone();
    }

    public getStake() {
        return this.stake;
    }

    public addRewardStake(amount: NumberLike) {
        this.stake.iadd(amount);
    }

    public encodeToHex() {
        return ObjectEncoding.encode(this, MinterData.encodingSettings, false).data;
    }

    public static fromDecodedHex(address: AddressHex, hexData: Uint) {
        try {
            const resultData = ObjectEncoding.decode(hexData, MinterData.encodingSettings);
            const data = resultData.data;
        
            if (data && data.version.eq(0)) {
                return new MinterData(address, data.stake, data.version);
            }
        } catch (err: any) {
            cli.data.error(`Error loading Minter from Decoded Hex: ${err.stack}`);
        }
        return null;
    }

    private static encodingSettings: DataEncoder[] = [
        BE(PX, "version"),
        //{key: "address"},
        BE.BigInt("stake")
    ]

}

export class MinterCredentials {

	public readonly privateKey: PrivateKey;
	public readonly address: AddressHex;

    constructor(privateKey: PrivateKey, address: AddressHex) {
        this.privateKey = privateKey;
        this.address = address;
    }

    static fromPrivateKey(privateKey: PrivateKey) {
        return new MinterCredentials(privateKey, AddressHex.fromPrivateKey(PX.A_0e, privateKey));
    }

}


