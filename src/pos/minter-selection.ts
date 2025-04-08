import { LCrypt } from "@leicoin/crypto";
import type { Stores } from "@leicoin/storage/store/index";
import type { Uint64 } from "low-level";


// @todo Maybe move this code somewhere else?
export class MinterSelection {
    
    /**
     * The algorithm to select a minter for a given slot index based on the db state.
     * @param slotIndex - the slot index to select a minter for
     * @param state - the state of the minter db
     * @returns the address of the selected minter
     */
    static async getProposer(slotIndex: Uint64, state: Stores.MinterState, stateDBSize: Uint64) {

        const randomIndex = LCrypt.sha256(slotIndex).mod(stateDBSize);

    }

}
