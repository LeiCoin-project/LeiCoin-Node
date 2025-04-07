import { AddressHex } from "@leicoin/common/models/address";
import { MinterData } from "@leicoin/common/models/minterData";
import type { Transaction } from "@leicoin/common/models/transaction";
import { PX } from "@leicoin/common/types/prefix";
import { DepositContract } from "@leicoin/smart-contracts";
import { Constants } from "@leicoin/utils/constants";
import { Uint64 } from "low-level";
import type { StorageAPI } from "../api";
import { AbstractChainStateStore } from "./abstractStore";
import type { WalletStateStore } from "./wallets";
import type { Ref } from "ptr.js";

export class MinterStateStore extends AbstractChainStateStore<AddressHex, MinterData, StorageAPI.Minters> {

    constructor(isMainChain: Ref<boolean>, storage: StorageAPI.Minters) {
        super(isMainChain, storage, AddressHex, MinterData as any);
    }    

    async set(minter: MinterData) {
        if (this.isMainChain == true) {
            await this.storage.set(minter);
        } else {
            this.tempStorage.set(minter.address, minter);
        }
    }

    /** @todo selectNextMinter should be moved to this class. */
    async getProposer(slotIndex: Uint64) {
        const minter = await this.storage.selectNextMinter(slotIndex);
        if (minter) {
            return await this.get(minter);
        }
        throw new Error("Error in getProposer: Minter not found.");
    }

    async executeDepositContractTransaction(tx: Transaction, wallets: WalletStateStore) {

        const fnID = tx.input.slice(0, 4).toString("hex");

        // this may change in the future
        const minterAddress = AddressHex.fromTypeAndBody(PX.A_0e, tx.recipientAddress.getBody());
        let minter = await this.get(minterAddress);

        switch (fnID) {
            case DepositContract.depositFNID: {

                // minter is not already active
                if (!minter) {

                    if (tx.amount.lt(Constants.MIN_MINTER_DEPOSIT)) {
                        return false;
                    }

                    minter = MinterData.createNewMinter(minterAddress);
                    /**
                     * @todo Implement join validation.
                     * for now all minters join immediately. this have to be changed in the future.
                     */
                }

                minter.deposit(tx.amount);

                await this.set(minter);

                return true;
            }
            case "withdraw": {
                // @todo Implement withdraw function

                // minter is not in the db
                if (!minter) return false;

                if (tx.input.getLen() !== 12) return false;
                const amount = new Uint64(tx.input.slice(4, 12));

                if (amount.eq(minter.getStake())) {
                    // minter want to exit
                    this.del(minterAddress);

                    
                    wallets.addMoney(tx.recipientAddress, amount);
                    return true;
                } else {
                    const result = minter.withdrawIFPossible(amount);
                    if (!result) return false;
                }

                // add delay in the future to make sure slashing can be done before minter gets his money
                wallets.addMoney(tx.recipientAddress, amount);

                return true;
            }
            default: {
                // undefined function
                return false;
            }
        }

    }

}
