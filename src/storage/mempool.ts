import { Transaction } from "@advena/common/models/transaction";
import { Block } from "@advena/common/models/block";
import { CB } from "@advena/utils/callbacks";
import { BasicBinaryMap, Uint256 } from "low-level";

export class Mempool {                                                                                                                                                                                                         

    static readonly transactions = new BasicBinaryMap<Uint256, Transaction>(Uint256);
  
    private constructor() {}

    static clearMempoolbyBlock(block: Block) {

        for (const transactionData of block.body.transactions) {
            this.removeTransactionFromMempool(transactionData.txid);
        }

    }

    // Function to add a transaction to the Mempool
    static addTransactionToMempool(transaction: Transaction) {
        const txid = transaction.txid;
    
        if (txid.toHex() in this.transactions) {
            //cli.data_message.error(`Transaction ${transactionHash} already exists in the Mempool.`);
            return { cb: 'exists' };
        }
    
        this.transactions.set(txid, transaction);
        return { cb: CB.SUCCESS };
    }
    
    // Function to remove a transaction from the Mempool
    static removeTransactionFromMempool(txid: Uint256) {
    
        if (txid.toHex() in this.transactions) {
            this.transactions.delete(txid);
            return { cb: CB.SUCCESS };
        }
    
        //cli.data_message.error(`Transaction ${transactionHash} not found in the Mempool.`);
        return { cb: CB.NONE };
    }
    

}

