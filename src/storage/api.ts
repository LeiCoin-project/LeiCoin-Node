import { BlockDB } from "./blocks";
import { ChainstateStore } from "./chainstate";
import { type SmartContractStateDB } from "./smart-contract-state";
import { MinterDB } from "./state/minters";
import { WalletDB } from "./state/wallets";

export class StorageAPI {

    constructor(
        readonly blocks: BlockDB,
        readonly wallets: WalletDB,
        readonly minters: MinterDB,
        readonly scstates: SmartContractStateDB,
        readonly chainstate: ChainstateStore
    ) {}

}
