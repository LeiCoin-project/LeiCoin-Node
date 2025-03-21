import { type Uint } from "low-level";
import { cli } from "@leicoin/cli";
import { LockedUint } from "@leicoin/common/types/prefix";
import { type Dict } from "@leicoin/utils/dataUtils";
import { type LNBasicMsgHandler } from "./abstractMsgHandler.js";
import { DataEncoder, ObjectEncoding } from "flexbuf";

/**
 * Stores the message types used in the LeiCoin network
 * The IDs a deffined hashing the message type name and selecting the last 2 bytes
 */
export class LNMsgID extends LockedUint {
    public static readonly byteLength = 2;
}


export abstract class LNAbstractMsgBody {

    public getTypeID() {
        return (this.constructor as LNMsgInfo).ID;
    }

    public getHandler() {
        return (this.constructor as LNMsgInfo).Handler;
    }

    
    public encodeToHex() {
        return ObjectEncoding.encode(this, (this.constructor as typeof LNAbstractMsgBody).encodingSettings, false).data;
    }

    static fromDecodedHex<T extends LNAbstractMsgBody>(this: new (...args: any[]) => T, hexData: Uint, returnLength?: false): T | null;
    static fromDecodedHex<T extends LNAbstractMsgBody>(this: new (...args: any[]) => T, hexData: Uint, returnLength: true): { data: T, length: number } | null;
    static fromDecodedHex<T extends LNAbstractMsgBody>(this: new (...args: any[]) => T, hexData: Uint, returnLength: boolean): T | null;
    static fromDecodedHex(hexData: Uint, returnLength = false): any {
        try {
            const result = ObjectEncoding.decode(hexData, this.encodingSettings, returnLength);
            if (result.data) {
                if (returnLength) {
                    return { data: this.fromDict(result.data), length: result.length };
                }
                return this.fromDict(result.data);
            }
        } catch (err: any) {
            cli.data.error(`Error loading ${this.name} from Decoded Hex: ${err.stack}`);
        }
        return null;
    }

    protected static fromDict(obj: Dict<any>): LNAbstractMsgBody {
        throw new Error("Method not implemented.");
    }

    protected static readonly encodingSettings: readonly DataEncoder[] = [];
}


export interface LNMsgBodyConstructor<T extends LNAbstractMsgBody = LNAbstractMsgBody> {
    new(...args: any[]): T;
    fromDecodedHex(hexData: Uint, returnLength: boolean): T | null;
}

export interface LNMsgInfo extends LNMsgBodyConstructor {
    readonly Name: string;
    readonly ID: LNMsgID;
    readonly Handler: LNBasicMsgHandler;
}

