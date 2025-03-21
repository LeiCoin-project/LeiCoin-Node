import { BasicBinaryMap, Uint256, Uint32 } from "low-level";
import { BE, DataEncoder } from "flexbuf";
import { type PeerSocket } from "../../socket.js";
import { LNMsgDefaultHandler, LNMsgRequestHandler, LNMsgResponseHandler } from "../abstractMsgHandler.js";
import { LNAbstractMsgBody, LNMsgID } from "../abstractMsg.js";
import { Deferred } from "@leicoin/utils/deferred";
import { Schedule } from "@leicoin/utils/schedule";
import { cli } from "@leicoin/cli";
import { LCrypt } from "@leicoin/crypto";

class ChallengeMsgStoreItem {
    constructor(
        readonly result = new Deferred<Uint256 | null>(),
        readonly timeout = new Schedule(() => {
            this.result.resolve(null);
        }, 5_000)
    ) {}

    public resolve(challenge: Uint256) {
        this.timeout.cancel();
        this.result.resolve(challenge);
    }

    public awaitResult() {
        return this.result.awaitResult();
    }
}

export class ChallengeMsgStore {

    private static readonly store = new BasicBinaryMap<Uint32, ChallengeMsgStoreItem>(Uint32);

    static add(id: Uint32) {
        const data = new ChallengeMsgStoreItem();
        this.store.set(id, data);
        return data;
    }

    static get(id: Uint32) {
        return this.store.get(id);
    }

    static delete(id: Uint32) {
        this.store.delete(id);
    }

}


export class ChallengeMsg extends LNAbstractMsgBody {

    constructor(
        readonly requestID: Uint32,
        readonly challenge: Uint256
    ) {super()}

    static create(requestID: Uint32) {
        return new ChallengeMsg(requestID, new Uint256(LCrypt.randomBytes(32)));
    }

    protected static fromDict(obj: Dict<any>) {
        return new ChallengeMsg(obj.requestID, obj.challenge);
    }

    protected static readonly encodingSettings: DataEncoder[] = [
        BE(Uint32, "requestID"),
        BE(Uint256, "challenge")
    ]
}

export namespace ChallengeMsg {
    export const Name = "CHALLENGE";
    export const ID = LNMsgID.from("77a9");

    export const Handler = new class Handler extends LNMsgDefaultHandler {
        async receive(data: ChallengeMsg, socket: PeerSocket) {

            const challenge = ChallengeMsgStore.get(data.requestID);
            if (challenge) {
                challenge.resolve(data.challenge);
                socket.close(null, true);
                return;
            }
        }
    }
}



export class ChallengeREQMsg extends LNAbstractMsgBody {
    protected static fromDict() {
        return new ChallengeREQMsg();
    }
}

export namespace ChallengeREQMsg {
    export const Name = "CHALLENGE_REQ";
    export const ID = LNMsgID.from("51c1");

    export const Handler = new class Handler extends LNMsgRequestHandler {
        async receive(data: ChallengeREQMsg, socket: PeerSocket, requestID: Uint32) {
            const result = await ChallengeMsgStore.add(requestID).awaitResult();
            ChallengeMsgStore.delete(requestID);
            
            if (!result) {
                return null;
            }

            socket.state = "VERIFIED";
            cli.leicoin_net.info(`Connection with ${socket.uri} has been verified`);

            return new ChallengeResponseMsg(result);
        }
    }
}


export class ChallengeResponseMsg extends LNAbstractMsgBody {

    constructor(
        readonly challenge: Uint256
    ) {super()}

    protected static fromDict(obj: Dict<any>) {
        return new ChallengeResponseMsg(obj.challenge);
    }

    protected static readonly encodingSettings: DataEncoder[] = [
        BE(Uint256, "challenge")
    ]
}

export namespace ChallengeResponseMsg {
    export const Name = "CHALLENGE_RESPONSE";
    export const ID = LNMsgID.from("39a2");
    export const Handler = new class Handler extends LNMsgResponseHandler {}
}
