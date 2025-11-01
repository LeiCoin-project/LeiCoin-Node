import { BlockLevelBackend } from "./backend/blocks.js";
import { MinterLevelBackend } from "./backend/state/minters.js";
import { SmartContractStateLevelBackend } from "./backend/state/smart-contract.js";
import { WalletLevelBackend } from "./backend/state/wallets.js";

export class Chain {

    readonly blocks: BlockLevelBackend;
    readonly wallets: WalletLevelBackend;
    readonly cstates: SmartContractStateLevelBackend;
    readonly minters: MinterLevelBackend;

    constructor() {
        this.blocks = new BlockLevelBackend();
        this.wallets = new WalletLevelBackend();
        this.cstates = new SmartContractStateLevelBackend();
        this.minters = new MinterLevelBackend();
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

