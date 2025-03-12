import { LNBroadcastingMsgHandler, LNMsgRequestHandler, LNMsgResponseHandler } from "../abstractMsgHandler.js";
import { BE, type DataEncoder } from "@leicoin/encoding";
import { Uint64 } from "low-level";
import { ErrorResponseMsg } from "./error.js";
import { Blockchain } from "@leicoin/storage/blockchain";
import { CB } from "@leicoin/utils/callbacks";
import { AutoProcessingQueue } from "@leicoin/utils/queue";
import { Block } from "@leicoin/common/models/block";
import { LNAbstractMsgBody, LNMsgID } from "../abstractMsg.js";
import { SlotExecutionManager } from "@leicoin/pos";
import { Slot } from "@leicoin/pos/slot";
import { Verification } from "@leicoin/verification";
import { NetworkSyncManager } from "../../index.js";

export class NewBlockMsg extends LNAbstractMsgBody {

    constructor(readonly block: Block) {super()}

    protected static fromDict(obj: Dict<any>) {
        return new NewBlockMsg(obj.block);
    }

    protected static readonly encodingSettings: DataEncoder[] = [
        BE.Object("block", Block)
    ]
}

export namespace NewBlockMsg {
    export const Name = "NEW_BLOCK";
    export const ID = LNMsgID.from("2096");
    
    export const Handler = new class Handler extends LNBroadcastingMsgHandler {
        async receive(data: NewBlockMsg) {
            const block = data.block;
            if (!block) return null;

            if (!block.slotIndex.eqn(SlotExecutionManager.calulateCurrentSlotIndex())) {
                this.handleUnverifiableForkBlock(block);
                return null;
            }

            if (NetworkSyncManager.state === "synchronized") {

                const currentSlot = await SlotExecutionManager.getSlot(block.slotIndex);
                if (currentSlot) {
                    const verification_result = await Verification.verifyBlockProposal(data.block);
    
                    if (verification_result !== 12000) {
                        /** @todo CLI Debug Mode for log messages like this */
                        //cli.data.info(`Block rejected. Code: ${verification_result}, Message: ${VCodes[verification_result]}`);
                        this.handleUnverifiableForkBlock(block);
                        return null;
                    }
                    
                    currentSlot.processBlock(block, FallbackIncomingBlockQueue);
                } else {
                    FallbackIncomingBlockQueue.enqueue(block);
                }

            } else {                
                NetworkSyncManager.blockQueue.enqueue(block);
            }
            return data;
        }

        private async handleUnverifiableForkBlock(block: Block) {
            const chainID = block.hash.toHex();
            await Blockchain.createFork(chainID, chainID, block);
        
            Blockchain.chains[chainID].blocks.add(block);
            Blockchain.chainstate.updateChainStateByBlock(
                chainID,
                chainID,
                block,
            );
        }
    } as LNBroadcastingMsgHandler;
}

const FallbackIncomingBlockQueue = new AutoProcessingQueue<Block>(async (ps) => {
    const block = ps.data;
    await Slot.processPastSlot(block.slotIndex, block);
    ps.proccessed.resolve();
});
export type { FallbackIncomingBlockQueue };


export class GetBlocksMsg extends LNAbstractMsgBody {
    
    constructor(
        readonly startingIndex: Uint64,
        readonly count: Uint64,
    ) {super()}

    protected static fromDict(obj: Dict<any>) {
        return new GetBlocksMsg(obj.startingIndex, obj.count);
    }

    protected static readonly encodingSettings: DataEncoder[] = [
        BE(Uint64, "startingIndex"),
        BE(Uint64, "count")
    ]

}

export namespace GetBlocksMsg {
    export const Name = "GET_BLOCKS";
    export const ID = LNMsgID.from("d372");

    export const Handler = new class Handler extends LNMsgRequestHandler {
        async receive(data: GetBlocksMsg) {
            if (NetworkSyncManager.state !== "synchronized") {
                return ErrorResponseMsg.fromCode(1);
            }

            /** Maybe ajust this later */
            if (data.count.gt(512)) {
                return ErrorResponseMsg.fromCode(2);
            }

            const blocks: Block[] = [];

            const index = data.startingIndex;
            const maxIndex = index.add(data.count);
            
            while (index.lt(maxIndex)) {
                const block = Blockchain.blocks.get(index);
                if (block.cb !== CB.SUCCESS || !block.data) break;
                blocks.push(block.data);
                index.iadd(1);
            }

            return new BlocksMsg(blocks);
        }
    }
}


export class BlocksMsg extends LNAbstractMsgBody {

    constructor(readonly blocks: Block[]) {super()}

    protected static fromDict(obj: Dict<any>) {
        return new BlocksMsg(obj.blocks);
    }

    protected static readonly encodingSettings: DataEncoder[] = [
        BE.Array("blocks", 2, Block)
    ]

}

export namespace BlocksMsg {
    export const Name = "BLOCKS";
    export const ID = LNMsgID.from("8017");
    export const Handler = new class Handler extends LNMsgResponseHandler {}
}
