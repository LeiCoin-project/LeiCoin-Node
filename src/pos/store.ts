import type { AddressHex } from "@leicoin/common/models/address";
import type { Block, BlockHeader } from "@leicoin/common/models/block";
import type { MinterData } from "@leicoin/common/models/minterData";
import type { StorageAPI } from "@leicoin/storage/api";
import type { Uint256, Uint64 } from "low-level";

export class BlockStore {

    constructor(
        protected readonly storage: StorageAPI
    ) {}

    async add(block: Block) {

    }

    async get(index: Uint64): Promise<Block | null> {
        
    }

    async getHead(): Promise<Block> {

    }

    async getHeader(index: Uint64): Promise<BlockHeader | null> {

    }

    async delete(hash: Uint256) {

    }
    
}

export class MinterState {

    constructor(
        protected readonly storage: StorageAPI
    ) {}

    async set(minter: MinterData) {

    }

    async get(address: AddressHex): Promise<MinterData | null> {
        
    }

    async delete(address: AddressHex) {

    }

    async getProposer(slotIndex: Uint64): Promise<MinterData> {

    }

}
