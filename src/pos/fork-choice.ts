import { BlockHeader } from "@leicoin/common/models/block";
import { BasicBinaryMap, Uint256, Uint64 } from "low-level";

export class ForkChoice {

    static async on_Block(block: BlockHeader, store: {
        time: Uint64,
        block_headers: BasicBinaryMap<Uint256, BlockHeader>,
    }) {



    }


}
