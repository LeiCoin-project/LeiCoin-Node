import { Mempool } from "@leicoin/storage/mempool";
import { Transaction } from "@leicoin/common/models/transaction";
import { cli } from "@leicoin/cli";
import { Verification } from "@leicoin/verification"
import { Uint } from "low-level";
import { LNAbstractMsgBody, LNMsgID } from "../abstractMsg.js";
import { LNBroadcastingMsgHandler, LNMsgRequestHandler } from "../abstractMsgHandler.js";
import { Dict } from "@leicoin/utils/dataUtils";
import { BE, type DataEncoder } from "flexbuf";
import { type PeerSocket } from "../../socket.js";

export class NewTransactionMsg extends LNAbstractMsgBody {
    
    constructor(readonly transaction: Transaction) {super()}
    
    protected static fromDict(obj: Dict<any>) {
        return new NewTransactionMsg(obj.transaction)
    }

    protected static readonly encodingSettings: DataEncoder[] = [
        BE.Object("transaction", Transaction)
    ]

}

export namespace NewTransactionMsg {
    export const Name = "NEW_TRANSACTION";
    export const ID = LNMsgID.from("8356");
    
    export const Handler = new class Handler extends LNBroadcastingMsgHandler {

        async receive(data: NewTransactionMsg) {

            const transaction = data.transaction;
        
            if (!(transaction.txid.toHex() in Mempool.transactions)) {
        
                const validationresult = await Verification.verifyTransaction(transaction);
        
                if (validationresult === 12000) {

                    Mempool.addTransactionToMempool(transaction);
            
                    cli.leicoin_net.success(`Received Transaction with hash ${transaction.txid} has been validated. Adding to Mempool.`);

                    return data;

                } else {
                    cli.leicoin_net.error(`Transaction with hash ${transaction.txid} is invalid. Error: ${JSON.stringify(validationresult)}`);
                }
            }
        
            //cli.ws_client_message.error(`Transaction with hash ${transaction.txid} is invalid.`);
            return data;
        }

    }
}

export class GetTransactionsMsg extends LNAbstractMsgBody {}

export namespace GetTransactionsMsg {
    export const Name = "GET_TRANSACTIONS";
    export const ID = LNMsgID.from("09aa");
    
    export const Handler = new class Handler extends LNMsgRequestHandler {
        async receive(data: GetTransactionsMsg, socket: PeerSocket) {
            return null;
            
        }
    }
}
