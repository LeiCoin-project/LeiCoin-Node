import { AddressHex } from "@leicoin/common/models/address";
import { MinterData } from "@leicoin/common/models/minterData";
import { BasicBinarySet, Uint, Uint64 } from "low-level";
import type { StorageAPI } from "../index.js";
import { AbstractChainStateStoreWithIndexes } from "./abstractStore";
import type { Ref } from "ptr.js";
import { PX } from "@leicoin/common/types/prefix";
import type { IKeyIndexRange } from "../leveldb/rangeIndexes.js";

/**
 * This class is used to store and manage the current state of active minters and keep track of their deposits.
 */
export class MinterStateStore extends AbstractChainStateStoreWithIndexes<
	AddressHex,
	MinterData,
	StorageAPI.IMinters
> {

	constructor(isMainChain: Ref<boolean>, storage: StorageAPI.IMinters) {
		super(isMainChain, storage, AddressHex, MinterData as any, {
			byteLength: 20,
			prefix: PX.A_0e,
		});
	}

	async set(minter: MinterData) {
		if (this.isMainChain == true) {
			await this.storage.set(minter);
		} else {
			const type = (await this.storage.exists(minter.address))
				? "modified"
				: "added";
			this.tempStorage.set(minter.address, minter, type);
		}
	}

	async getAddressByIndex(index: Uint64) {
		const { range, offset } = await this.getRangeByIndexFromMergedIndexes(index);

		const count = Uint64.from(0);
		const minterAddressesBaseStream = this.storage.createKeyStream({
			gte: range.firstPossibleKey,
			lte: range.lastPossibleKey
		});

		const minterAddressesStream = MinterStateStore.mergeSortedStreamAndArray(
			minterAddressesBaseStream,
			this.tempStorage.added.keys().all(),
			this.tempStorage.deleted
		);

        for await (const addr of minterAddressesStream) {
            if (count.eq(offset)) {
                minterAddressesBaseStream.destroy();
                return new AddressHex(addr);
            }
            count.iadd(1);
        }

        return null;		
	}

	public getDBSize() {
		const baseSize = this.storage.getDBSize();
		const { added, deleted } = this.tempStorage.size;

		return baseSize.add(added).sub(deleted);
	}

	
	protected async getRangeByIndexFromMergedIndexes(index: Uint64) {

		const totalOffset = Uint64.from(0);
		
		const rangesAmount = this.storage.getIndexes().getRangesAmount();

		const baseStorageRanges = this.storage.getIndexes().getRanges();
		const tempStorageRanges = this.tempStorage.indexes.getRanges();

        for (let i = 0; i < rangesAmount; i++) {

			const baseRange = baseStorageRanges[i] as IKeyIndexRange;
			const tempStorageRangeSize = (tempStorageRanges[i] as IKeyIndexRange).size;

			const rangeSize = baseRange.size.add(tempStorageRangeSize);

            if (totalOffset.add(rangeSize).gt(index)) {
                return {
                    range: {
						firstPossibleKey: baseRange.firstPossibleKey,
						lastPossibleKey: baseRange.lastPossibleKey,
						size: rangeSize,
					} as IKeyIndexRange,
                    offset: index.sub(totalOffset)
                };
            }
            totalOffset.iadd(baseRange.size);
        }

		/** @todo Better Error Handling: Error shoudl not run when there are no Minter in the DB */
        throw new Error("Index is not part of any range. Are the ranges initialized?");
	}

	protected static async* mergeSortedStreamAndArray(
		baseStream: AsyncIterable<Uint>,
		added: Uint[],
		deleted: BasicBinarySet<Uint>
	) {
		const iterator = baseStream[Symbol.asyncIterator]();
		let arrayIndex = 0;
		let streamItem = await iterator.next();

		while (!streamItem.done) {
			const streamVal = streamItem.value;
			const arrayVal = arrayIndex < added.length ? added[arrayIndex] : null;

			if (deleted.has(streamVal)) {
				streamItem = await iterator.next();
				continue;
			}
			if (!arrayVal || streamVal.lt(arrayVal)) {
				yield streamVal;
				streamItem = await iterator.next();
				continue;
			}
			yield arrayVal;
			arrayIndex++;
		}

		while (arrayIndex < added.length) {
			yield added[arrayIndex++] as Uint;
		}
	}

}
