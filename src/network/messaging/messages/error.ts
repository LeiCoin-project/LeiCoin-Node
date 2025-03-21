import { Uint16 } from "low-level";
import { BE, type DataEncoder } from "flexbuf";
import { LNAbstractMsgBody, LNMsgID } from "../abstractMsg.js";
import { LNMsgResponseHandler } from "../abstractMsgHandler.js";

export class ErrorResponseMsg extends LNAbstractMsgBody {

    constructor(
        readonly id: Uint16,
    ) {super()}

    static fromCode(code: number) {
        return new ErrorResponseMsg(Uint16.from(code));
    }

    protected static fromDict(obj: Dict<any>) {
        return new ErrorResponseMsg(obj.id);
    }

    protected static readonly encodingSettings: DataEncoder[] = [
        BE(Uint16, "id")
    ]

}

export namespace ErrorResponseMsg {
    export const Name = "ERROR_RESPONSE";
    export const ID = LNMsgID.from("fff0");
    export const Handler = new class Handler extends LNMsgResponseHandler {}
}
