import { Constants } from "@leicoin/utils/constants";
import { Uint64 } from "low-level";

export class POSUtils {

    static calulateCurrentSlotIndex(time = Uint64.from(Date.now())) {
        return time.sub(Constants.GENESIS_TIME).div(Constants.SLOT_TIME);
    }
    
    static calculateSlotExecutionTime(index: Uint64) {
        return Constants.GENESIS_TIME + index.toInt() * Constants.SLOT_TIME;
    }

}
