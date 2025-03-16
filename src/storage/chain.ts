import { BlockDB } from "./blocks.js";
import { MinterDB } from "./state/minters.js";
import { SmartContractStateDB } from "./state/smart-contract.js";
import { WalletDB } from "./state/wallets.js";

export class Chain {

    readonly blocks: BlockDB;
    readonly wallets: WalletDB;
    readonly cstates: SmartContractStateDB;
    readonly minters: MinterDB;

    constructor() {
        this.blocks = new BlockDB();
        this.wallets = new WalletDB();
        this.cstates = new SmartContractStateDB();
        this.minters = new MinterDB();
    }

    public async waitAllinit() {
        await Promise.all([
            this.blocks.open(),
            this.wallets.open(),
            this.cstates.open(),
            this.minters.open(),
        ])
    }

    public async close() {
        await Promise.all([
            this.blocks.close(),
            this.wallets.close(),
            this.cstates.close(),
            this.minters.close(),
        ]);
    }

}

