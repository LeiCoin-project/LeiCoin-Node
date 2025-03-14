import { Uint256, Uint64 } from "low-level";
import { IndexDB } from "../leveldb/indexDB";

export class BlockIndexDB extends IndexDB {

    protected readonly path = "/indexes/block";

    async getBlockHash(index: Uint64) {
        return await this.getData(index);
    }

    async setBlockHash(index: Uint64, hash: Uint256) {
        return this.level.put(index, hash);
    }

    async removeIndex(index: Uint64) {
        return this.delData(index);
    }

}