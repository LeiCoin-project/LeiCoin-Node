import { ExecutedBlock, type Block, type BlockHeader } from "@advena/common/models/block";
import type { AddressHex } from "@advena/common/models/address";
import type { Stores } from "@advena/storage/store";
import { Uint64 } from "low-level";
import type { FastEvents } from "@advena/utils/fastevents";
import { POSUtils } from "./utils.js";
import type { Transaction } from "@advena/common/models/transaction";
import { Ref } from "ptr.js";
import { AVM } from "@advena/avm";
import { LCrypt } from "@advena/crypto";

export class ChainState {

    public readonly isMain: Ref<boolean>;

    constructor(
        isMain: Ref<boolean> | boolean,
        readonly time: Uint64,
        public latestBlockIndex: Uint64,
        readonly wallets: Stores.WalletState,
        readonly minters: Stores.MinterState,
    ) {
        this.isMain = new Ref(isMain);
    }

    async getMinter(address: AddressHex) {
        return await this.minters.get(address);
    }

    /**
     * The algorithm to select a minter for a given slot index based on the db state.
     * @param slotIndex - the slot index to select a minter for
     * @returns the address of the selected minter
     */
    async getProposer(slotIndex: Uint64 = POSUtils.calulateCurrentSlotIndex(this.time)) {
        
        const dbSize = this.minters.getDBSize();

        if (dbSize < 1) {
            throw new Error("Minter DB is empty. Is the Database initialized and indexed?");
        }

        // get a random index from the database size and the hash of the slot index
        const randomIndex = LCrypt.sha256(slotIndex).mod(dbSize);

        const result = await this.minters.getAddressByIndex(Uint64.from(randomIndex));

        if (!result) {
            throw new Error("Index is not part of any range. Is the Database initialized and indexed?");
        }
        return result;   

    }

}

export class Chain {

    constructor(
        readonly blocks: Stores.Blocks,
        readonly state: ChainState
    ) {
        
        //this.updateListenerSubscription = this.blocks.
    }

    get isMain() {
        return this.state.isMain;
    }
    get time() {
        return this.state.time;
    }

    static async create(
        isMain: boolean | Ref<boolean>,
        time: Uint64,
        blocks: Stores.Blocks,
        wallets: Stores.WalletState,
        minters: Stores.MinterState
    ) {

        const state = new ChainState.create(
            time,
            wallets,
            minters
        );

        return new Chain(isMain, time, blocks, state);
    }

    async getLatestBlockHeader(): Promise<BlockHeader> {
        const head = await this.blocks.getHeader(this.state.latestBlockIndex);
        if (!head) throw new Error("Blockchain has no Blocks");
        return head;
    }

    async processBlock(block: Block) {
        
        const processor = new AVM.TXProcessor(this.state.wallets, this.state.minters);

        const txExecutionResults: AVM.TXExecResult[] = [];

        for (const tx of block.body.transactions) {
            const result = await processor.executeTransaction(tx);
            txExecutionResults.push(result);
        }

        const executedBlock = ExecutedBlock.fromBlockAndExecResults(block, txExecutionResults);

        await this.blocks.add(executedBlock);
    }

    protected async revertBlock(block: Block) {
        if (this.isMain == true) return;


    }


    async fork(): Promise<Chain> {
        throw new Error("Method not implemented.");
    }

}
