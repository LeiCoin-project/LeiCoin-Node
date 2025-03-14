import { Block, BlockHeader } from "@leicoin/common/models/block";
import { Uint256 } from "low-level";

export class BlockStore {

    constructor() {
        
    }

    async add(block: Block) {

    }

    async addTemporary(block: Block) {

    }


    async get(hash: Uint256): Promise<Block | null> {
        
    }

    async getHeader(hash: Uint256): Promise<BlockHeader | null> {

    }

    async getByIndex(index: number): Promise<Block | null> {

    }

    async getHeaderByIndex(index: number): Promise<BlockHeader | null> {

    }


    async deleteTemporary(hash: Uint256) {

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
