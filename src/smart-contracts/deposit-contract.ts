import { AddressHex } from "@leicoin/common/models/address";
import { LCrypt } from "@leicoin/crypto";
import { Uint } from "low-level";
import { SCUtils } from "./utils";

export class DepositContract {

    static readonly address = AddressHex.from("0c0000000000000000000000000000000000000001");

    static readonly depositFNID = SCUtils.getFNID("deposit()");
    static readonly withdrawFNID = SCUtils.getFNID("withdraw(uint64)");

}

