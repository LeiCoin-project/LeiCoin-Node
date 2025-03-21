import { Uint16, Uint32 } from "low-level";
import { Port } from "@leicoin/common/types/netinfo";
import { type Dict } from "@leicoin/utils/dataUtils";
import { LNAbstractMsgBody, LNMsgID } from "../abstractMsg.js";
import { LNMsgDefaultHandler } from "../abstractMsgHandler.js";
import { type PeerSocket } from "../../socket.js";
import { BE, DataEncoder } from "flexbuf";

export class StatusMsg extends LNAbstractMsgBody {

    constructor(
        readonly version: Uint16,
        readonly port: Port
    ) {super()}
    
    protected static fromDict(obj: Dict<any>) {
        return new StatusMsg(
            obj.version,
            obj.port
        )
    }

    protected static readonly encodingSettings: DataEncoder[] = [
        BE(Uint16, "version"),
        BE(Port, "port")
    ]

}

export namespace StatusMsg {
    export const Name = "STATUS";
    export const ID = LNMsgID.from("1761");

    export const Handler = new class Handler extends LNMsgDefaultHandler {
        async receive(data: StatusMsg, socket: PeerSocket) {

            const req = socket.activeRequests.get(Uint32.from(0));
            if (!req) return;

            req.resolve(data);
            return;
        }
    }
}
