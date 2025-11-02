import { AddressHex } from "@advena/common/models/address";
import { MinterData } from "@advena/common/models/minterData";
import type { StorageBackend } from "../../backend/exports/index.js";
import { AbstractChainStateStoreWithIndexes } from "../abstractStore.js";
import type { Ref } from "ptr.js";
import { PX } from "@advena/common/types/prefix";
import type { Uint } from "low-level";

/**
 * This class is used to store and manage the current state of active minters and keep track of their deposits.
 */
export class MinterStateStore extends AbstractChainStateStoreWithIndexes<AddressHex, MinterData, Uint, StorageBackend.IBackendWithIndexes<Uint, Uint, 20, typeof PX.A_0e>> {

	constructor(isMainChain: Ref<boolean>, storageBackend: StorageBackend.IBackendWithIndexes<Uint, Uint, 20, typeof PX.A_0e>) {
		super(isMainChain, storageBackend, AddressHex, MinterData as any, {
			byteLength: 20,
			prefix: PX.A_0e,
		});
	}

	async set(minter: MinterData) {
		if (this.isMainChain == true) {
			await this._set(minter.address, minter);
		} else {
			const type = (await this.storageBackend.exists(minter.address))
				? "modified"
				: "added";
			this.tempStorage.set(minter.address, minter, type);
		}
	}

	protected async _get(address: AddressHex) {
        const raw_minter_data = await this.storageBackend.get(address);
        if (!raw_minter_data) return null;
        return MinterData.fromDecodedHex(address, raw_minter_data);
    }

    protected async _set(address: AddressHex, minter: MinterData): Promise<void> {
        if (!await this.storageBackend.exists(address)) {
            await this.storageBackend.getIndexes().addKey(address);
        }
        return this.storageBackend.put(address, minter.encodeToHex());
    }

    protected async _del(key: AddressHex): Promise<void> {
        const exists = await this.storageBackend.exists(key);
        if (exists) {
            await this.storageBackend.getIndexes().removeKey(key);
            return this.storageBackend.del(key);
        }
    }

}
