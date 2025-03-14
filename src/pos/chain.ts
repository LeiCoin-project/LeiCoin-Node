import { Block, BlockHeader } from "@leicoin/common/models/block";
import { Uint256, Uint64 } from "low-level";

export class BlockStore {

    constructor() {
        
    }

    async add(block: Block) {

    }

    async get(index: Uint64): Promise<Block | null> {
        
    }

    async getHeader(index: Uint64): Promise<BlockHeader | null> {

    }

    async delete(hash: Uint256) {

    }
    
}


export class ChainState {

    constructor(
        readonly latestBlockHeader: BlockHeader,
    ) {}

}

export class Chain {

    constructor(
        readonly blocks: BlockStore,
        readonly state: ChainState
    ) {}
    
}
