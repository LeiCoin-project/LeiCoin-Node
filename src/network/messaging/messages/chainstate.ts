import { LNMsgRequestHandler, LNMsgResponseHandler } from "../abstractMsgHandler.js";
import { LNAbstractMsgBody, LNMsgID } from "../abstractMsg.js";
import { ForkChainstateData } from "@leicoin/storage/chainstate";
import { Dict } from "@leicoin/utils/dataUtils";
import { BE, DataEncoder } from "flexbuf";
import { Blockchain } from "@leicoin/storage/blockchain";
import { ErrorResponseMsg } from "./error.js";
import { NetworkSyncManager } from "../../chain-sync.js";

export class GetChainstateMsg extends LNAbstractMsgBody {}

export namespace GetChainstateMsg {
    export const Name = "GET_CHAINSTATE";
    export const ID = LNMsgID.from("1f76");
    
    export const Handler = new class Handler extends LNMsgRequestHandler {
        async receive() {

            if (NetworkSyncManager.state !== "synchronized") {
                // @todo Better error handling later with explicit error codes
                return ErrorResponseMsg.fromCode(1);
            }

            const cs = Blockchain.chainstate.getChainState("main");
            if (cs) {
                return new ChainstateMsg(cs);
            }

            return ErrorResponseMsg.fromCode(1);
        }
    }
}

// @ts-ignore
export class ChainstateMsg extends LNAbstractMsgBody {
    constructor(readonly chainstate: ForkChainstateData) {super()}

    protected static fromDict(obj: Dict<any>) {
        return new ChainstateMsg(obj.chainstate);
    }

    protected static encodingSettings: readonly DataEncoder[] = [
        BE.Object("chainstate", ForkChainstateData)
    ]
}

export namespace ChainstateMsg {
    export const Name = "CHAINSTATE";
    export const ID = LNMsgID.from("ffab");
    export const Handler = new class Handler extends LNMsgResponseHandler {}
}
