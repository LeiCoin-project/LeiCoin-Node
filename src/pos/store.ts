import type { AddressHex } from "@leicoin/common/models/address";
import type { Block, BlockHeader } from "@leicoin/common/models/block";
import type { MinterData } from "@leicoin/common/models/minterData";
import type { Uint256, Uint64 } from "low-level";

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

export class MinterState {

    async set(minter: MinterData) {

    }

    async get(address: AddressHex): Promise<MinterData | null> {
        
    }

    async delete(address: AddressHex) {

    }

    async getProposer(slotIndex: Uint64): Promise<MinterData> {

    }

}
