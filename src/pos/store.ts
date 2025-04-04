import { AddressHex } from "@leicoin/common/models/address";
import type { Block, BlockHeader } from "@leicoin/common/models/block";
import { MinterData } from "@leicoin/common/models/minterData";
import type { Transaction } from "@leicoin/common/models/transaction";
import type { Wallet } from "@leicoin/common/models/wallet";
import type { StorageAPI } from "@leicoin/storage/api";
import { Uint64, BasicBinaryMap, Uint, type BasicUintConstructable } from "low-level";
import { DepositContract } from "@leicoin/smart-contracts";
import { PX } from "@leicoin/common/types/prefix";
import { Constants } from "@leicoin/utils/constants";

abstract class AbstractChainStore<K extends Uint, V, S extends StorageAPI.IChainStore<K, V>> {

    protected readonly tempStorage: BasicBinaryMap<K, V>;

    constructor(
        public isMainChain: boolean,
        protected readonly storage: S,
        keyCLS: BasicUintConstructable<K>,
    ) {
        this.tempStorage = new BasicBinaryMap<K, V>(keyCLS);
    }

    // @ts-ignore
    async get(key: K): ReturnType<S["get"]> {
        const value = this.tempStorage.get(key);
        if (value) {
            return value as any;
        }
        return await this.storage.get(key) as any;
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

        wallet.addMoney(amount);
        await this.set(wallet);
    }

    async subtractMoney(address: AddressHex, amount: Uint64) {
        const wallet = await this.get(address);

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

    async executeDepositContractTransaction(tx: Transaction, wallets: WalletStateStore) {

        const fn = "" as string;

        // this may change in the future
        const minterAddress = AddressHex.fromTypeAndBody(PX.A_0e, tx.recipientAddress.getBody());
        let minter = await this.get(minterAddress);

        switch (fn) {
            case "deposit": {

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

                minter.deposit(tx.amount);

                await this.set(minter);

                return true;
            }
            case "withdraw": {
                // @todo Implement withdraw function

                // minter is not in the db
                if (!minter) return false;

                if (tx.amount.eq(minter.getStake())) {
                    // minter want to exit
                    this.del(minterAddress);

                    
                    wallets.addMoney(tx.recipientAddress, tx.amount);
                    return true;
                } else {
                    const result = minter.withdrawIFPossible(tx.amount);
                    if (!result) return false;
                }

                // add delay in the future to make sure slashing can be done before minter gets his money
                wallets.addMoney(tx.recipientAddress, tx.amount);

                return true;
            }
            default: {
                // undefined function
                return false;
            }
        }

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

        if (!senderWallet.getNonce().eq(tx.nonce)) return false;

        const moneySubtractionResult = senderWallet.subtractMoneyIFPossible(tx.amount);
        if (!moneySubtractionResult) return false;

        /** @todo Make proper handling for smart contracts in the future. */
        if (tx.recipientAddress.eq(DepositContract.address)) {

            const result = this.minters.executeDepositContractTransaction(tx, this.wallets);
            if (!result) return false;

        } else {
            await this.wallets.addMoney(tx.recipientAddress, tx.amount);
        }

        senderWallet.adjustNonce(1);
        await this.wallets.set(senderWallet);
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