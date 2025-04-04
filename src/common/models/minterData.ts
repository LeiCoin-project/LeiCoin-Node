import { type NumberLike, type Uint, Uint64 } from "low-level";
import { cli } from "@leicoin/cli";
import { AddressHex } from "./address.js";
import { PX } from "../types/prefix.js";
import { BE, DataEncoder, ObjectEncoding } from "flexbuf";
import { PrivateKey } from "@leicoin/crypto";
import { Constants } from "@leicoin/utils/constants";

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

    /** Adds the deposited amount to the minter's stake. */
    public deposit(amount: NumberLike) {
        this.stake.iadd(amount);
    }

    public withdrawIFPossible(amount: NumberLike) {

        if (!this.stake.gte(amount)) return false;

        const leftOver = this.stake.sub(amount);
        // If the left over amount is less than the minimum deposit, the minter has to withdraw the whole amount or stay.
        if (leftOver.lt(Constants.MIN_MINTER_DEPOSIT)) return false;

        this.stake.set(leftOver);
        return true;
    }
    
    public addRewardStake(amount: NumberLike) {
        this.stake.iadd(amount);
    }


    static createNewMinter(address: AddressHex, stake = Uint64.from(0), version = PX.V_00) {
        return new MinterData(address, stake, version);	
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


