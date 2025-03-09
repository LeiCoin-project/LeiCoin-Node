import { AddressHex } from "@leicoin/common/models/address";
import { PX } from "@leicoin/common/types/prefix";
import { Wallet } from "@leicoin/common/models/wallet";
import { Blockchain } from "@leicoin/storage/blockchain";
import { Uint64 } from "low-level";
import { DataUtils } from "@leicoin/utils/dataUtils";
import { cli } from "../cli.js";
import { CLICMD, CLICMDExecMeta, CLISubCMD } from "@cleverjs/cli";
import { CommonCLIMessages } from "../commandHandler.js";

export class WalletDBCMD extends CLISubCMD {
    readonly name = "walletdb";
    readonly description = "Manage the Wallet database";
    readonly usage = "walletdb <command> [...args]";

    protected onInit(): void {
        this.register(new ReadCMD());
        this.register(new InsertCMD());
        this.register(new RemoveCMD());
    }

    async run(args: string[], meta: CLICMDExecMeta) {
        await Blockchain.init();
        await Blockchain.waitAllChainsInit();

        super.run(args, meta);
    }

}


class ReadCMD extends CLICMD {
    readonly name = "read";
    readonly description = "Read the Wallet database";
    readonly usage = "read (<wallet_address> | all)";

    public async run(args: string[]): Promise<void> {
        if (args.length !== 1) {
            CommonCLIMessages.invalidNumberOfArguments();
            return;
        }

        if (args[0] === "all") {
            cli.cmd.info(
                "Wallets:\n" + 
                (await Blockchain.wallets.getAllKeys()).map((address) => {
                    return address.toHex();
                }).join("\n")
            );
            return;
        }

        const address = AddressHex.from(args[0]);
        const wallet = await Blockchain.wallets.getWallet(address);
        if (await Blockchain.wallets.existsWallet(address)) {
            cli.cmd.info(DataUtils.stringify(wallet, (key, value) => {
                if (key === "balance") {
                    return (value.toInt() / 100).toFixed(2);
                }
            }, 2));
        } else {
            cli.cmd.info("Wallet not found!");
        }

    }
}

class InsertCMD extends CLICMD {
    readonly name = "insert";
    readonly description = "Insert Data into the Wallet database";
    readonly usage = "insert <wallet_address> <stake> <nonce> <version>";

    public async run(args: string[]): Promise<void> {
        if (args.length !== 4) {
            CommonCLIMessages.invalidNumberOfArguments();
            return;
        }

        const wallet = new Wallet(
            AddressHex.from(args[0]),
            Uint64.from(parseInt(args[1])),
            Uint64.from(parseInt(args[2])),
            PX.from(args[3])
        );
        await Blockchain.wallets.setWallet(wallet);
        cli.cmd.info("Wallet inserted!");
    }
}

class RemoveCMD extends CLICMD {
    readonly name = "remove";
    readonly description = "Remove Data from the Wallet database";
    readonly usage = "remove <wallet_address>";

    public async run(args: string[]): Promise<void> {
        if (args.length !== 1) {
            CommonCLIMessages.invalidNumberOfArguments();
            return;
        }

        const address = AddressHex.from(args[0]);
        if (await Blockchain.wallets.existsWallet(address)) {
            await Blockchain.wallets.deleteWallet(address);
            cli.cmd.info("Wallet removed!");
        } else {
            cli.cmd.info("Wallet not found!");
        }

    }
}

