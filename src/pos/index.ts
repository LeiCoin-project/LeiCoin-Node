import { cli } from "@leicoin/cli";
import { Uint64, UintMap } from "low-level";
import { Constants } from "@leicoin/utils/constants";
import { type MinterClient } from "@leicoin/minter";
import { type ModuleLike } from "@leicoin/utils/dataUtils";
import { CronJob } from "cron";
import { Slot } from "./slot";

export class SlotExecutionManager implements ModuleLike<typeof SlotExecutionManager> {
    public static initialized = false;
    public static started = false;

    private static slotTask: CronJob;
    private static readonly slots = new UintMap<Promise<Slot>>();

    static readonly minters: MinterClient[] = [];

    static async init(minters: MinterClient[]) {
        if (this.initialized) return;
        this.initialized = true;

        this.minters.push(...minters);
     
        this.slotTask = new CronJob('1,6,11,16,21,26,31,36,41,46,51,56 * * * * *', () => {
            const nextSlotIndex = Uint64.from(SlotExecutionManager.calulateCurrentSlotIndex() + 1);

            //this.endSlot(this.currentSlot.index);
            this.startNewSlot(nextSlotIndex);

            /** @todo Adjust the amount of time this slot will be keeped in memory later when it is decided when a block is considered final and minters are getting paid */
            this.endSlot(nextSlotIndex.sub(100));
        });

        this.setupEvents();
    }

    static async start() {
        if (this.started) return;
        this.started = true;

        this.slotTask.start();
        cli.pos.info("POS started");
    }

    private static async setupEvents() {}
    
    static async stop() {
        if (!this.started) return;
        this.slotTask.stop();

        const currentSlot = await this.getCurrentSlot();
        if (currentSlot) {
            this.forceFinishAndDeleteSlot(currentSlot.index);
            await Promise.all([
                this.forceFinishAndDeleteSlot(currentSlot.index.sub(1)),
                this.forceFinishAndDeleteSlot(currentSlot.index.add(1))
            ]);
        }

        cli.pos.info("POS stopped");
    }

    static calulateCurrentSlotIndex() {
        return Math.floor(
            (Date.now() - Constants.GENESIS_TIME) / Constants.SLOT_TIME
        );
    }

    static calculateSlotExecutionTime(index: Uint64) {
        return Constants.GENESIS_TIME + index.toInt() * Constants.SLOT_TIME;
    }

    static async startNewSlot(slotIndex: Uint64) {
        const newSlot = Slot.create(slotIndex);
        this.slots.set(slotIndex, newSlot);
    }

    static async endSlot(slotIndex: Uint64) {
        return this.slots.delete(slotIndex);
    }

    static async forceFinishAndDeleteSlot(slotIndex: Uint64) {
        const slot = await this.getSlot(slotIndex);
        if (slot) {
            slot.slot_finished.pass();
            this.endSlot(slotIndex);
        }
    }

    static getSlot(index: Uint64) {
        return this.slots.get(index);
    }

    static getCurrentSlot() {
        return this.slots.get(Uint64.from(this.calulateCurrentSlotIndex()));
    }
    
}

