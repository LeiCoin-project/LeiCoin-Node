import { BlockLevelBackend } from "./backends/blocks.js";
import { MinterLevelBackend } from "./backends/state/minters.js";
import { SmartContractStateLevelBackend } from "./backends/state/smart-contract.js";
import { WalletLevelBackend } from "./backends/state/wallets.js";

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

