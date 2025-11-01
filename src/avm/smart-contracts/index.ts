
import { AddressHex } from "@advena/common/models/address";
import { MinterData } from "@advena/common/models/minterData";
import type { Transaction } from "@advena/common/models/transaction";
import { PX } from "@advena/common/types/prefix";
import { LCrypt } from "@advena/crypto";
import { DepositContract } from "@advena/smart-contracts";
import type { Stores } from "@advena/storage/store";
import { Constants } from "@advena/utils/constants";
import { Uint64 } from "low-level";

export class SmartContractExecution {

    static async executeDepositContractTransaction(tx: Transaction, minters: Stores.MinterState, wallets: Stores.WalletState, reverse = false) {

        const fnID = tx.input.slice(0, 4).toString("hex");

        // this may change in the future
        const minterAddress = AddressHex.fromTypeAndBody(PX.A_0e, tx.recipientAddress.getBody());
        let minter = await minters.get(minterAddress);

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

                if (!reverse) {

                    minter.deposit(tx.amount);

                    await minters.set(minter);

                    return true;

                }

                minter.withdrawIFPossible

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
                    minters.del(minterAddress);


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