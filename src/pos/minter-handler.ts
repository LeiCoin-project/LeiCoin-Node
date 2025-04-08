import { AddressHex } from "@leicoin/common/models/address";
import { MinterData } from "@leicoin/common/models/minterData";
import type { Transaction } from "@leicoin/common/models/transaction";
import { PX } from "@leicoin/common/types/prefix";
import { LCrypt } from "@leicoin/crypto";
import { DepositContract } from "@leicoin/smart-contracts";
import type { Stores } from "@leicoin/storage/store/index";
import { Constants } from "@leicoin/utils/constants";
import type { Uint64 } from "low-level";


// @todo Maybe move this code somewhere else?
export class MinterHandler {
    
    /**
     * The algorithm to select a minter for a given slot index based on the db state.
     * @param slotIndex - the slot index to select a minter for
     * @param minters+ - the state of the minter db
     * @returns the address of the selected minter
     */
    static async getProposer(slotIndex: Uint64, minters: Stores.MinterState) {

        const dbSize = await minters.getSize();
        const randomIndex = LCrypt.sha256(slotIndex).mod(dbSize);

        
        
    }

    static async executeDepositContractTransaction(tx: Transaction, wallets: Stores.WalletState) {

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
