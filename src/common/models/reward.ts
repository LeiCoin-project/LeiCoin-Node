// import { cli } from "@leicoin/cli";
// import Crypto from "@leicoin/crypto";
// import { ObjectEncoding, EncodingSettings } from "flexbuf";
// import { Uint, Uint64 } from "@leicoin/utils/binary";
// import { DataUtils } from "@leicoin/utils/dataUtils";
// import { AddressHex } from "./address.js";


// export class Reward {

//     public address: AddressHex;
//     public amount: Uint64;

//     constructor(address: AddressHex, amount: Uint64) {
//         this.address = address;
//         this.amount = amount;
//     }

//     public encodeToHex(forHash = false) {
//         return ObjectEncoding.encode(this, Reward.encodingSettings, forHash).data;
//     }

//     public static fromDecodedHex(hexData: Uint) {
//         try {
//             const returnData = ObjectEncoding.decode(hexData, Reward.encodingSettings);
//             const data = returnData.data;
        
//             if (data && data.version.eq(0)) {
//                 return DataUtils.createInstanceFromJSON(Reward, data);;
//             }
//         } catch (err: any) {
//             cli.data_message.error(`Error loading Attestation from Decoded Hex: ${err.stack}`);
//         }
//         return null;
//     }

//     public calculateHash() {
//         return Crypto.sha256(this.encodeToHex(true));
//     }

//     private static encodingSettings: EncodingSettings[] =[
//         {key: "address"},
//         {key: "amount", type: "bigint"},
//     ]

// }


