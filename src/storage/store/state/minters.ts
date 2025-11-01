import { AddressHex } from "@advena/common/models/address";
import { MinterData } from "@advena/common/models/minterData";
import type { StorageAPI } from "../../index.js";
import { AbstractChainStateStoreWithIndexes } from "../abstractStore.js";
import type { Ref } from "ptr.js";
import { PX } from "@advena/common/types/prefix";

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

}
