import { AddressHex } from "@leicoin/common/models/address";
import type { Block, BlockHeader } from "@leicoin/common/models/block";
import type { MinterData } from "@leicoin/common/models/minterData";
import type { Transaction } from "@leicoin/common/models/transaction";
import type { Wallet } from "@leicoin/common/models/wallet";
import type { StorageAPI } from "@leicoin/storage/api";
import { Uint64, BasicBinaryMap, Uint, type BasicUintConstructable } from "low-level";

abstract class AbstractChainStore<K extends Uint, V, S extends StorageAPI.IChainStore<K, V>> {

    protected readonly tempStorage: BasicBinaryMap<K, V>;

    constructor(
        public isMainChain: boolean,
        protected readonly storage: S,
        keyCLS: BasicUintConstructable<K>,
    ) {
        this.tempStorage = new BasicBinaryMap<K, V>(keyCLS);
    }

    async get(key: K): Promise<V | null> {
        const value = this.tempStorage.get(key);
        if (value) {
            return value;
        }
        return await this.storage.get(key);
    }

    async exists(key: K) {
        if (this.tempStorage.has(key)) {
            return true;
        }
        return this.storage.exists(key);
    }
    
    async del(key: K) {
        const result = await this.storage.del(key);
        if (this.isMainChain) {
            return result || this.tempStorage.delete(key);
        }
        return result;
    }

}


abstract class AbstractChainStateStore<K extends Uint, V, S extends StorageAPI.IChainStateStore<K, V>> extends AbstractChainStore<K, V, S> {
    abstract set(value: V): Promise<void>;
}


class BlockStore extends AbstractChainStore<Uint64, Block, StorageAPI.Blocks> {

    constructor(isMainChain: boolean, storage: StorageAPI.Blocks) {
        super(isMainChain, storage, Uint64);
    }

    async add(block: Block, overwrite: boolean = false) {
        if (this.isMainChain) {
            await this.storage.add(block, overwrite);
        } else {
            if (!overwrite && this.tempStorage.has(block.index)) {
                return;
            }
            this.tempStorage.set(block.index, block);
        }
    }
    
}


class WalletStateStore extends AbstractChainStateStore<AddressHex, Wallet, StorageAPI.Wallets> {

    constructor(isMainChain: boolean, storage: StorageAPI.Wallets) {
        super(isMainChain, storage, AddressHex);
    }

    async set(wallet: Wallet) {
        if (this.isMainChain) {
            await this.storage.set(wallet);
        } else {
            this.tempStorage.set(wallet.owner, wallet);
        }
    }

    async addMoney(address: AddressHex, amount: Uint64) {
        const wallet = await this.get(address);
        if (!wallet) return false;

        wallet.addMoney(amount);
        await this.set(wallet);
        return true;
    }

    async subtractMoney(address: AddressHex, amount: Uint64) {
        const wallet = await this.get(address);
        if (!wallet) return false;

        const result = wallet.subtractMoneyIFPossible(amount);
        if (!result) return false;

        await this.set(wallet);
        return true;
    }

}

class MinterStateStore extends AbstractChainStateStore<AddressHex, MinterData, StorageAPI.Minters> {

    constructor(isMainChain: boolean, storage: StorageAPI.Minters) {
        super(isMainChain, storage, AddressHex);
    }    

    async set(minter: MinterData) {
        if (this.isMainChain) {
            await this.storage.set(minter);
        } else {
            this.tempStorage.set(minter.address, minter);
        }
    }

    /** @todo selectNextMinter should be moved to this class. */
    async getProposer(slotIndex: Uint64) {
        const minter = await this.storage.selectNextMinter(slotIndex);
        if (minter) {
            return await this.get(minter);
        }
        throw new Error("Error in getProposer: Minter not found.");
    }

}


class ChainStateStore {

    constructor(
        readonly isMainChain: boolean,
        protected readonly storage: StorageAPI.ChainState,
        readonly wallets: WalletStateStore,
        readonly minters: MinterStateStore,
    ) {}

    static create(isMainChain: boolean, chainstateAPI: StorageAPI.ChainState, walletAPI: StorageAPI.Wallets, minterAPI: StorageAPI.Minters) {
        return new ChainStateStore(
            isMainChain,
            chainstateAPI,
            new WalletStateStore(isMainChain, walletAPI),
            new MinterStateStore(isMainChain, minterAPI),
        );
    }

    async verifyAndExecuteTransaction(tx: Transaction) {
        if (!tx.validateHash(tx.txid)) return false;

        const senderWallet = await this.wallets.get(tx.senderAddress);
        if (!senderWallet) return false;

        if (!senderWallet.getNonce().eq(tx.nonce)) return false;

        const moneySubtractionResult = senderWallet.subtractMoneyIFPossible(tx.amount);
        if (!moneySubtractionResult) return false;

        senderWallet.adjustNonce(1);
        await this.wallets.set(senderWallet);

        await this.wallets.addMoney(tx.recipientAddress, tx.amount);
    }

}

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