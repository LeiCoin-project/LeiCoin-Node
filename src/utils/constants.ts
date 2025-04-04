
export class Constants {

    static readonly GENESIS = 0;

    // please change this value when using in MainNet
    static readonly GENESIS_TIME = 1718841600_000;

    // 5000 milliseconds (= 5 seconds) the goal is to reach 1 second later
    static readonly SLOT_TIME = 5_000;

    // SLOT_TIME in Seconds * 2.000 = 10.000 Transactions per Block. Ideal is 2.000 Transactions per Block when we have 1 second Slot Time later
    static readonly TRANSACTIONS_PER_BLOCK = this.SLOT_TIME * 2;
    
    /**
     * Minimum amount for a minter to be an active minter
     * Minimum amount for an initial join
     * 100.000.00 Leis = 100.000,00 LeiCoins
     */
    static readonly MIN_MINTER_DEPOSIT = 100_000_00;

    // maybe later in percentage
    static readonly MINTING_REWARD = 4_000_00;

    // maybe later in percentage
    static readonly SLASHING_AMOUNT = 3_000_00;

}

