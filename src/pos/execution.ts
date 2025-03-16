import { type Block } from "@leicoin/common/models/block";
import { Blockchain } from "@leicoin/storage/blockchain";
import { Verification } from "@leicoin/verification";
import { Mempool } from "@leicoin/storage/mempool";


export class Execution {

    static async executeBlock(block: Block, validationresult: Verification.Result.BlockValid) {

        let forked = false;

        const { targetChain, parentChain } = validationresult;

        if (targetChain !== parentChain) { // New fork if targetChain is different from parentChain
            await Blockchain.createFork(validationresult.targetChain, validationresult.parentChain, block);
            forked = true;
        }
    
        await Blockchain.chains[targetChain].blocks.add(block);
        Blockchain.chainstate.updateChainStateByBlock(
            targetChain,
            parentChain,
            block,
        );
    
        if (targetChain === "main") {
            Mempool.clearMempoolbyBlock(block);
            
            await Blockchain.wallets.adjustWalletsByBlock(block);
        }
        
        return { forked };
    }

}

