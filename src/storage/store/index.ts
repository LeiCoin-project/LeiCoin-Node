import { BlockStore } from "./blocks";
import { ChainStateStore } from "./chainstate";
import { MinterStateStore } from "./minters";
import { WalletStateStore } from "./wallets";

export namespace Stores {
    export const Blocks = BlockStore;
    export const WalletState = WalletStateStore;
    export const MinterState = MinterStateStore;
    export const ChainState = ChainStateStore;
    
    export type Blocks = BlockStore;
    export type WalletState = WalletStateStore;
    export type MinterState = MinterStateStore;
    export type ChainState = ChainStateStore;
}