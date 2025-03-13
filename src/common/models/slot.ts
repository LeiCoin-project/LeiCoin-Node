// import { Uint64 } from "@leicoin/utils/binary";
// import { Block } from "./block.js";
// import { Slashing } from "./slashing.js";

import { Uint64 } from "low-level";

// interface SlotProposedBlock {
//     status: "proposed";
//     data: Block;
// }

// interface SlotEmptyBlock {
//     status: "empty";
//     data: null;
// }

export class Slot {

    index: Uint64;
    
    constructor(index: Uint64, block: SlotProposedBlock | SlotEmptyBlock, slashings: Slashing[]) {
        this.index = index;
        this.block = block;
        this.slashings = slashings;
    }

}

