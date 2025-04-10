import { BlockDB } from "./state/blocks.js";
import { MinterDB } from "./state/minters.js";
import { SmartContractStateDB } from "./state/smart-contract.js";
import { WalletDB } from "./wallets.js";

export class Chain {

    readonly name: string;
    readonly blocks: BlockDB;
    readonly wallets: WalletDB;
    readonly cstates: SmartContractStateDB;
    readonly minters: MinterDB;

    constructor(name = "main") {
        this.name = name;
        this.blocks = new BlockDB(name);
        this.wallets = new WalletDB(name);
        this.cstates = new SmartContractStateDB(name);
        this.minters = new MinterDB(name);
    }

    public async waitAllinit() {
        await Promise.all([
            this.wallets.init(),
            this.cstates.init(),
            this.minters.init(),
        ])
    }

    public async close() {
        await Promise.all([
            this.wallets.close(),
            this.cstates.close(),
            this.minters.close(),
        ]);
    }

}

