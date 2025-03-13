import { cli } from "@leicoin/cli";
import { LCrypt, PrivateKey, Signature } from "@leicoin/crypto";
import { LNController, LNMsgRegistry } from "@leicoin/net";
import { AddressHex } from "@leicoin/common/models/address";
import { Block, BlockBody } from "@leicoin/common/models/block";
import { MinterCredentials } from "@leicoin/common/models/minterData";
import { PX } from "@leicoin/common/types/prefix";
import { SlotExecution } from "@leicoin/pos/slot";
import { Blockchain } from "@leicoin/storage/blockchain";
import { Mempool } from "@leicoin/storage/mempool";
import { Verification } from "@leicoin/verification";
import { Uint256, Uint64 } from "low-level";


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
			Uint64.from(new Date().getTime()),
			this.credentials.address,
			Signature.empty(),
			
			new BlockBody(
				Mempool.transactions.values().all()
			)
		)

		block.hash.set(block.calculateHash());
		block.signature.set(LCrypt.sign(block.hash, PX.A_0e, this.credentials.privateKey));
		return block;
	}

    async mint(currentSlot: SlotExecution) {
		const block = await this.createNewBlock(currentSlot.index);

		LNController.broadcast(new LNMsgRegistry.NEW_BLOCK(block));

		currentSlot.processBlock(block);
		
		cli.minter.success(`Created Block on Slot ${block.slotIndex.toBigInt()} with hash ${block.hash.toHex()}. Broadcasting now.`);
    }

}

