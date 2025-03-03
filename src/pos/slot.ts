import { AddressHex } from "@leicoin/common/models/address";
import { type Block } from "@leicoin/common/models/block";
import { type Uint64 } from "low-level";
import { Execution } from "./execution.js";
import { cli } from "@leicoin/cli";
import { SlotExecutionManager } from "./index.js";
import { formatDate } from "date-fns/format";
import { UTCDate } from "@date-fns/utc/date";
import { ExecutionCheckpoint } from "@leicoin/utils/executionCheckpoint";
import { Schedule } from "@leicoin/utils/schedule";
import { Blockchain } from "@leicoin/storage/blockchain";
import { Verification } from "@leicoin/verification";
import { FallbackIncomingBlockQueue } from "@leicoin/net/types";

export class Slot {

    public block?: Block;

    protected slot_started = new ExecutionCheckpoint();
    readonly slot_finished = new ExecutionCheckpoint(() => {
        this.slot_started.pass();
        this.blockTimeout.cancel();
    });
    protected readonly blockTimeout: Schedule;

    protected constructor(
        readonly index: Uint64,
        readonly minter: AddressHex,
    ) {
        let timeUntilSlotStart = SlotExecutionManager.calculateSlotExecutionTime(index) - Date.now();
        if (timeUntilSlotStart < 0) timeUntilSlotStart = 0;
        new Schedule(async() => await this.onSlotStart(), timeUntilSlotStart);
        this.blockTimeout = new Schedule(async() => await this.onBlockNotMinted(), timeUntilSlotStart + 5_000);
    }

    static async create(index: Uint64) {
        const latestSlot = await SlotExecutionManager.getSlot(index.sub(1));
        if (latestSlot) {
            // Ensure minterdb was upodated before selecting the next minter
            // problem: dont ensure that minterdb is updated before block executed
            await latestSlot.slot_finished.passing();
        }

        const nextMinter = await Blockchain.minters.selectNextMinter(index);
        return new Slot(index, nextMinter);
    }

    protected async onSlotStart() {
        if (this.slot_finished.hasPassed()) return;

        cli.pos.info(`Starting new slot: ${this.index.toBigInt()} at ${formatDate(new UTCDate(), "dd-MMM-yyyy HH:mm:ss:SSS")}, Minter: ${this.minter.toHex()}`);

        for (const mc of SlotExecutionManager.minters) {
            if (this.isMinter(mc.credentials.address)) {
                await mc.mint(this);
                break;
            }
        }

        this.slot_started.pass();
    }

    protected async onBlockNotMinted() {
        if (this.slot_finished.hasPassed()) return;
        this.slot_finished.pass();

        cli.pos.error(`Minter ${this.minter.toHex()} did not mint a block on Slot ${this.index.toBigInt()}`);
    }


    public async processBlock(block: Block, fallbackBlockQueue?: typeof FallbackIncomingBlockQueue) {
        if (this.slot_finished.hasPassed()) return;
        this.blockTimeout.cancel();

        if (this.block) return;
        this.block = block;
        
        // Ensure IncomingBlockQueue is empty before processing this block
        await fallbackBlockQueue?.back()?.proccessed.awaitResult();

        // Ensure all necessary procedures are finished before executing the block
        await this.slot_started.passing();

        const verification_result = await Verification.verifyBlock(block);

        if (verification_result.status !== 12000) {
            this.slot_finished.pass();
            cli.pos.error(`Block with hash ${block.hash.toHex()} is invalid. Validation Result: Code: ${verification_result.status} Message: ${Verification.Codes[verification_result.status]}`);
            return;
        }

        const execution_result = await Execution.executeBlock(block, verification_result);
        this.slot_finished.pass();

        if (execution_result.forked) {
            cli.pos.info(`New Fork ${verification_result.targetChain} created from ${verification_result.parentChain} at block ${block.index.toBigInt()}`);
            return;
        }
        cli.pos.success(`Block on Slot ${block.slotIndex.toBigInt()} has been validated, executed and added to Blockchain. (Hash: ${block.hash.toHex()}, Index ${block.index.toBigInt()}, Target Chain: ${verification_result.targetChain})`);
    }

    public isMinter(address: AddressHex) {
        return this.minter.eq(address);
    }

    static async processPastSlot(index: Uint64, block?: Block) {

        const minter = await Blockchain.minters.selectNextMinter(index);

        if (!block || block.minter.eqn(minter)) {
            return false;
        }

        const verification_result = await Verification.verifyBlock(block);

        if (verification_result.status !== 12000) {
            return false;
        }

        await Execution.executeBlock(block, verification_result);
        return true;
    }

}

