import { AddressHex } from "@leicoin/common/models/address";
import { MinterData } from "@leicoin/common/models/minterData";
import type { Transaction } from "@leicoin/common/models/transaction";
import { PX } from "@leicoin/common/types/prefix";
import { DepositContract } from "@leicoin/smart-contracts";
import { Constants } from "@leicoin/utils/constants";
import { Uint, Uint64 } from "low-level";
import type { StorageAPI } from "../index.js";
import { AbstractChainStateStore } from "./abstractStore";
import type { WalletStateStore } from "./wallets";
import type { Ref } from "ptr.js";

/**
 * This class is used to store and manage the current state of active minters and keep track of their deposits.
 */
export class MinterStateStore extends AbstractChainStateStore<AddressHex, MinterData, StorageAPI.Minters> {

    constructor(isMainChain: Ref<boolean>, storage: StorageAPI.Minters) {
        super(isMainChain, storage, AddressHex, MinterData as any);
    }

    async set(minter: MinterData) {
        if (this.isMainChain == true) {
            await this.storage.set(minter);
        } else {
            const type = await this.storage.exists(minter.address) ? "modified" : "added";
            this.tempStorage.set(minter.address, minter, type);
        }
    }

    async getAddressByIndex(index: Uint64) {

        const { range, offset } = await this.storage.getIndexes().getRangeByIndex(index);

        const count = Uint64.from(0);
        const minterAddressesBaseStream = this.storage.getLevel().createKeyStream({ gte: range.firstPossibleKey, lte: range.lastPossibleKey });

            const iterator = minterAddressesBaseStream[Symbol.asyncIterator]();
            let arrayIndex = 0;
            let streamItem = await iterator.next();

            while (!streamItem.done) {
                const streamVal = streamItem.value;
                const arrayVal = arrayIndex < array.length ? array[arrayIndex] : null;

                if (arrayVal) {
                    if (streamVal.lte(arrayVal)) {
                        yield streamVal;
                        streamItem = await iterator.next();
                    } else {
                        yield arrayVal;
                        arrayIndex++;
                    }
                } else {
                    yield streamVal;
                    streamItem = await iterator.next();
                }
            }

            while (arrayIndex < array.length) {
                yield array[arrayIndex++];
            }

        }

    }

    async getSize() {
        const baseSize = await this.storage.getSize();
        const { added, deleted } = this.tempStorage.size;

        return baseSize.add(added).sub(deleted);
    }

}
