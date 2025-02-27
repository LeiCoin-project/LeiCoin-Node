import { type LNMsgInfo, type LNMsgID } from "./abstractMsg.js";
import { ObjectiveArray, type Dict } from "@leicoin/utils/dataUtils";
import { StatusMsg } from "./messages/status.js";
import { ChallengeMsg, ChallengeREQMsg, ChallengeResponseMsg } from "./messages/challenge.js";
import { BlocksMsg, GetBlocksMsg, NewBlockMsg } from "./messages/block.js";
import { GetTransactionsMsg, NewTransactionMsg } from "./messages/transaction.js";
import { ChainstateMsg, GetChainstateMsg } from "./messages/chainstate.js";
import { OneTimeRequestMsg } from "./messages/oneTimeRequest.js";


type LNMsgRegistry<I extends readonly LNMsgInfo[], T = ObjectiveArray<I>> = {
    // @ts-ignore
    [K in T[keyof T]["Name"]]: Extract<
        T[keyof T],
        { Name: K }
    >;
};

class LNMsgUtils {
    static createLNMsgRegistry<T extends readonly LNMsgInfo[]>(msgs: T) {
        const registry: Dict<LNMsgInfo> = {};
        for (const msg of msgs) {
            registry[msg.Name] = msg;
        }
        return registry as LNMsgRegistry<T>;
    }
}


export const LNMsgRegistry = LNMsgUtils.createLNMsgRegistry([
    StatusMsg,

    // ONE_TIME_REQUEST: OneTimeRequestMsg,

    ChallengeMsg,
    ChallengeREQMsg,
    ChallengeResponseMsg,

    NewBlockMsg,
    GetBlocksMsg,
    BlocksMsg,

    NewTransactionMsg,
    GetTransactionsMsg,

    ChainstateMsg,
    GetChainstateMsg,
] as const);



/** @tode Find a new Name for MessageRouter that is more accurate */
export class MessageRouter {

    static getMsgInfo(id: LNMsgID): LNMsgInfo | undefined {
        return Object.values(LNMsgRegistry).find((msg) => msg.ID.eq(id));
    }

}

