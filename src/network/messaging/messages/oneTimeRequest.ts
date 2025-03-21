import { type Uint } from "low-level";
import { BE, type DataEncoder } from "flexbuf";
import { type PeerSocket } from "../../socket.js";
import { LNAbstractMsgBody, type LNMsgBodyConstructor, LNMsgID } from "../abstractMsg.js";
import { LNMsgDefaultHandler } from "../abstractMsgHandler";
import { StatusMsg } from "./status.js";
import { ObjectEncoding } from "flexbuf";
import { cli } from "@leicoin/cli";
import { MessageRouter } from "../index.js";

export class OneTimeRequestMsg<T extends LNAbstractMsgBody = LNAbstractMsgBody> extends LNAbstractMsgBody {

    constructor(
        readonly status: StatusMsg,
        readonly payloadType: LNMsgID,
        readonly payload: T
    ) {super()}


    static fromDecodedHex<T extends LNAbstractMsgBody, TReturn = OneTimeRequestMsg<T>>(hexData: Uint) {
    //static fromDecodedHex<T extends LNAbstractMsgBody>(hexData: Uint): OneTimeRequestMsg<T> | null {
        try {
            const CLS: LNMsgBodyConstructor | undefined = MessageRouter.getMsgInfo(new LNMsgID(hexData.slice(0, 2)));
            if (!CLS) return null;

            const data = ObjectEncoding.decode(hexData, this.getEncodingSettings(CLS), true).data;
            if (data) {
                return this.fromDict<T>(data) as TReturn;
            }
        } catch (err: any) {
            cli.data.error(`Error loading ${this.name} from Decoded Hex: ${err.stack}`);
        }
        return null;
    }

    protected static fromDict<T extends LNAbstractMsgBody>(obj: Dict<any>) {
        return new OneTimeRequestMsg<T>(obj.status, obj.payloadType, obj.payload);
    }

    protected static getEncodingSettings<T extends LNMsgBodyConstructor>(CLS: T): readonly DataEncoder[] {
        return [
            BE(LNMsgID, "payloadType"),
            BE.Object("status", StatusMsg),
            BE.Object("data", CLS)
        ];
    }

}


export namespace OneTimeRequestMsg {
    export const Name = "ONE_TIME_REQUEST";
    export const ID = LNMsgID.from("5c5f");

    export const Handler = new class Handler extends LNMsgDefaultHandler {
        async receive(data: OneTimeRequestMsg, socket: PeerSocket) {
            return;
        }
    }

}

