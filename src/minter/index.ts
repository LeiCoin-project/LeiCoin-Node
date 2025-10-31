import { cli } from "@advena/cli";
import { LCrypt, PrivateKey, Signature } from "@advena/crypto";
import { LNController, LNMsgRegistry } from "@advena/net";
import { AddressHex } from "@advena/common/models/address";
import { Block, BlockBody } from "@advena/common/models/block";
import { MinterCredentials } from "@advena/common/models/minterData";
import { PX } from "@advena/common/types/prefix";
import { SlotExecution } from "@advena/pos/slot";
import { Blockchain } from "@advena/storage/blockchain";
import { Mempool } from "@advena/storage/mempool";
import { Verification } from "@advena/verification";
import { Uint256, Uint64 } from "low-level";
import { POSUtils } from "@advena/pos/utils";


export class MinterClient {

	private constructor(
		public readonly credentials: MinterCredentials,
	) {}

	public verifyCredentials(): { cb: true } | { cb: false, message: string } {
		if (!Verification.verifyAddress(this.credentials.address, PX.A_0e)) {
			return { cb: false, message: "MinterClient could not be started: Invalid Address." };
		}
		if (!AddressHex.fromPrivateKey(PX.A_0e, this.credentials.privateKey).eq(this.credentials.address)) {
			return { cb: false, message: "MinterClient could not be started: Invalid PrivateKey - Address Pair." };
		}
		return { cb: true };
	}

	static createMinters(
		config: Array<{
			address: string,
			privateKey: string
		}>
	) {

		const clients: MinterClient[] = [];

		for (const staker of config) {
			const mc = new MinterClient(
				new MinterCredentials(
					PrivateKey.from(staker.privateKey),
					AddressHex.from(staker.address)
				),
			);

			const mc_verification = mc.verifyCredentials();

			if (mc_verification.cb) {
				clients.push(mc);
			} else {
				cli.minter.error(mc_verification.message);
			}
		}

		cli.minter.info(`MinterClients started. Addresses: ${clients.map(mc => mc.credentials.address.toHex()).join(", ")}`);

		return clients;
	}

	private async createNewBlock(currentSlotIndex: Uint64) {

		const previousBlock = Blockchain.chainstate.getLatestBlock();
		const block = new Block(
			previousBlock?.index.add(1) || Uint64.from(0),
			currentSlotIndex,
			Uint256.alloc(),
			previousBlock?.hash || Uint256.alloc(),
			this.credentials.address,
			Signature.empty(),
			
			new BlockBody(
				Mempool.transactions.values().all()
			)
		)

		block.sign(this.credentials.privateKey);
		return block;
	}

    async mint(currentSlot: SlotExecution) {
		const block = await this.createNewBlock(currentSlot.index);

		LNController.broadcast(new LNMsgRegistry.NEW_BLOCK(block));

		currentSlot.processBlock(block);
		
		cli.minter.success(`Created Block on Slot ${block.slotIndex.toBigInt()} with hash ${block.hash.toHex()}. Broadcasting now.`);
    }

}

