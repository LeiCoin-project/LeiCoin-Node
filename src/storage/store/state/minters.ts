import { AddressHex } from "@advena/common/models/address";
import { MinterData } from "@advena/common/models/minterData";
import type { StorageBackend } from "../../backend/exports/index.js";
import { AbstractChainStateStoreWithIndexes } from "../abstractStore.js";
import type { Ref } from "ptr.js";
import { PX } from "@advena/common/types/prefix";

/**
 * This class is used to store and manage the current state of active minters and keep track of their deposits.
 */
export class MinterStateStore extends AbstractChainStateStoreWithIndexes<
	AddressHex,
	MinterData,
	StorageBackend.MinterDB.Abstract
> {

	constructor(isMainChain: Ref<boolean>, storageBackend: StorageBackend.MinterDB.Abstract) {
		super(isMainChain, storageBackend, AddressHex, MinterData as any, {
			byteLength: 20,
			prefix: PX.A_0e,
		});
	}

	async set(minter: MinterData) {
		if (this.isMainChain == true) {
			await this.storageBackend.set(minter);
		} else {
			const type = (await this.storageBackend.exists(minter.address))
				? "modified"
				: "added";
			this.tempStorage.set(minter.address, minter, type);
		}
	}

}
