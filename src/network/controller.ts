import { type Uint, Uint16, Uint32 } from "low-level";
import { LeiCoinNetNode } from "./node.js";
import { type LNBroadcastMsg, LNRequestMsg, LNStandartMsg } from "./messaging/networkMessages.js";
import { PeerSocket } from "./socket.js";
import { Port } from "@advena/common/types/netinfo";
import { StatusMsg } from "./messaging/messages/status.js";
import { LNActiveRequest } from "./requests.js";
import { ChallengeMsg, ChallengeREQMsg, ChallengeResponseMsg } from "./messaging/messages/challenge.js";
import { cli } from "@advena/cli";
import { LNAbstractMsgBody } from "./messaging/abstractMsg.js";


export class LNController {

    static async broadcast(data: LNAbstractMsgBody | LNBroadcastMsg | Uint) {
        for (const connection of LeiCoinNetNode.connections.values()) {
            connection.send(data);
        }
    }

}

export class PeerSocketController {

    private static async sendStatusMsg(socket: PeerSocket) {
        /** @todo Implment Protocol Versioning Later which will replace Uint16.from(0) */
        return socket.send(new LNStandartMsg(
            new StatusMsg(
                Uint16.from(0),
                Port.from(LeiCoinNetNode.getServerInfo().port)
            )
        ));
    }

    private static verifyRemoteStatus(remoteStatus: StatusMsg) {
        if (
            /** @todo Implment Protocol Versioning Later which will replace remoteStatus.version.eq(0) */
            remoteStatus.version.eq(0)
        ) {
            return true;
        }
        return false;
    }

    static async accomplishHandshake(socket: PeerSocket) {

        if (socket.type === "OUTGOING") {
            await this.sendStatusMsg(socket);
        }

        const request = socket.activeRequests.add(new LNActiveRequest<StatusMsg>(Uint32.from(0)));

        socket.state = "READY";

        const remoteStatus = (await request.awaitResult()).data;
        socket.activeRequests.delete(request.id);
        
        if ((!remoteStatus || !this.verifyRemoteStatus(remoteStatus))) {
            socket.close(null, "Remote Status does not match or request has failed / timed out");
            return;
        }

        if (socket.type === "INCOMING") {
            socket.port = remoteStatus.port.toInt();
            await this.sendStatusMsg(socket);
            await this.challengeClient(socket, remoteStatus.port.toInt());
        }

    }

    private static async challengeClient(socket: PeerSocket, remotePort: number) {
        const request_msg = LNRequestMsg.create(new ChallengeREQMsg());
        const request = socket.request<ChallengeResponseMsg>(request_msg);

        const client = await PeerSocket.connect(socket.host, remotePort, true);
        if (!client) {
            socket.close(null, "Failed to open connection to challenge client");
            return;
        }

        const challenge_msg = ChallengeMsg.create(request_msg.requestID);
        await client.send(challenge_msg);

        // Mark the Client as closed to prevent any unnessecary procedures
        client.state = "CLOSED";

        const response = await request;

        client.close(null, true);

        if (response.status === 0 && response.data?.challenge.eq(challenge_msg.challenge)) {
            socket.state = "VERIFIED";
            cli.leicoin_net.info(`Connection with ${socket.uri} has been verified`);
        } else {
            socket.close(null, "Challenge failed: Remote did not respond with the correct challenge or timed out");
        }
    }

}

