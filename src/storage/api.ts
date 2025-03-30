import { FastEvents } from "@leicoin/utils/fastevents";
import { BlockDB } from "./blocks";
import { ChainstateStore } from "./chainstate";
import { type SmartContractStateDB } from "./smart-contract-state";
import { MinterDB } from "./state/minters";
import { WalletDB } from "./state/wallets";
import type { Block } from "@leicoin/common/models/block";

export class StorageAPI {

    constructor(
        readonly blocks: BlockDB,
        readonly wallets: WalletDB,
        readonly minters: MinterDB,
        readonly scstates: SmartContractStateDB,
        readonly chainstate: ChainstateStore,
        readonly events = new FastEvents.Emitter([
            new FastEvents.Topic<"block", [Block]>("block")
        ])
    ) {}

}
