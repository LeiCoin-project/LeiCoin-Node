import { Uint64 } from "low-level";
import { Blockchain } from "@leicoin/storage/blockchain";
import { Queue } from "@leicoin/utils/queue";
import { type ForkChainstateData } from "@leicoin/storage/chainstate";
import { type ChainstateMsg, GetChainstateMsg } from "./messaging/messages/chainstate.js";
import { type PeerSocket } from "./socket.js";
import { BlocksMsg, GetBlocksMsg } from "./messaging/messages/block.js";
import { cli } from "@leicoin/cli";
import { Utils } from "@leicoin/utils";
import { Block } from "@leicoin/common/models/block";
import { SlotExecution } from "@leicoin/pos/slot";
import { LeiCoinNetNode } from "./node.js";

export class NetworkSyncManager {

    static state: "synchronizing" | "synchronized" = "synchronizing";

    static readonly blockQueue = new Queue<Block>();

    private static async getRemoteChainstate(socket: PeerSocket) {
        const result = await socket.request<ChainstateMsg>(new GetChainstateMsg());
        if (result.status !== 0 || !result.data) {
            return null;
        }
        return result.data.chainstate;
    }

    private static async getRemoteChainstates() {
        const chainstates: Promise<ForkChainstateData | null>[] = [];

        for (const connection of LeiCoinNetNode.connections.values()) {
            chainstates.push(this.getRemoteChainstate(connection));
        }

        return (await Promise.all(chainstates)).filter(cs => cs) as ForkChainstateData[];
    }

    
    /**
     * Retrieves blocks from a remote peer starting from a specified index.
     * @param socket - The peer socket to communicate with.
     * @param sinceIndex - The index from which to start retrieving blocks.
     * @param limit - The maximum number of blocks to retrieve. Have to be a integer between 1 and 512 (512 as default).
     * @returns A promise that resolves to a `LNResponseData<BlocksMsg>` containing the requested blocks.
     */
    private static async getRemoteBlocks(socket: PeerSocket, sinceIndex: Uint64, limit = 512) {
        const requestMSG = new GetBlocksMsg(sinceIndex, Uint64.from(limit));
        return socket.request<BlocksMsg>(requestMSG);
    }

    private static async executeBlocks(blocks: Block[]) {
        let blocksSuccessfullyProcessedCount = 0;

        for (const block of blocks) {
            const result = await SlotExecution.processPastSlot(block.slotIndex, block);
            if (result) blocksSuccessfullyProcessedCount++;
        }

        return { blocksSuccessfullyProcessedCount };
    }

    private static async syncBlocks(socket: PeerSocket, sinceIndex: Uint64) {

        const stats = {
            blocksReceiveCount: Uint64.from(0),
            blocksSuccessfullyProcessedCount: Uint64.from(0),
        };
        const currentBlockIndex = sinceIndex;

        while (true) {
            const response = await this.getRemoteBlocks(socket, currentBlockIndex);
            if (response.status !== 0 || !response.data) break;

            const blocks = response.data.blocks;

            stats.blocksReceiveCount.iadd(blocks.length);
            cli.data.info(`Received next ${blocks.length} Blocks. Received ${stats.blocksReceiveCount.toBigInt()} Blocks in total.`);

            const execution_result = await this.executeBlocks(blocks);

            stats.blocksSuccessfullyProcessedCount.iadd(execution_result.blocksSuccessfullyProcessedCount);
            cli.leicoin_net.info(`Executed ${execution_result.blocksSuccessfullyProcessedCount} / ${blocks.length} Blocks successfully.`);

            if (response.data.blocks.length < 512) break;
            currentBlockIndex.iadd(512);
        }

        return stats;
    }

    static async checkRemoteChainstates() {
        const latestLocalBlockIndex = Blockchain.chainstate.getLatestBlock("main")?.index || Uint64.from(0);
        const remoteChainstatesPromise = this.getRemoteChainstates();
    }

    static async doStartupSync(ignoreNoPeers = false) {
        
        cli.leicoin_net.info("Syncing the Blockchain...");

        // wait so the node can establish connections
        // maybe change this code later
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            cli.leicoin_net.info("Checking local chainstate and puling latest blocks...");
            const result = await this.syncChain();
            this.state = "synchronized";
            cli.leicoin_net.success(`Successfully synced the Blockchain. Blocks processed: ${result.blocksSuccessfullyProcessedCount.toBigInt()}`);
        } catch (err: any) {
            cli.leicoin_net.error(`Failed to sync the Blockchain: ${err.message}`);
            if (ignoreNoPeers) {
                this.state = "synchronized";
            } else {
                Utils.gracefulShutdown(1);
            }
        }

    }

    static async syncChain() {

        const latestBlock = Blockchain.chainstate.getLatestBlock("main") || { index: Uint64.from(0), slotIndex: Uint64.from(0) };

        /** @todo Do sync with multiple peers and check if no one is online*/

        const syncPeers = LeiCoinNetNode.connections.values().all();

        if (syncPeers.length === 0) {
            throw new Error("No peers to sync with");
        }

        const sync_stats = await this.syncBlocks(syncPeers[0], latestBlock.index);
        
        while (this.blockQueue.size > 0) {
            const block = this.blockQueue.dequeue() as Block;
            const result = await SlotExecution.processPastSlot(block.slotIndex, block);
            if (result) sync_stats.blocksSuccessfullyProcessedCount.iadd(1);
        }

        return sync_stats;
    }


}

