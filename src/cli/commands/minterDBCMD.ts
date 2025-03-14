import { AddressHex } from "@leicoin/common/models/address";
import { PX } from "@leicoin/common/types/prefix";
import { MinterData } from "@leicoin/common/models/minterData";
import { Blockchain } from "@leicoin/storage/blockchain";
import { Uint64 } from "low-level";
import { DataUtils } from "@leicoin/utils/dataUtils";
import { cli } from "../cli.js";
import { CLICMD, CLICMDExecMeta, CLISubCMD } from "@cleverjs/cli";
import { CommonCLIMessages } from "../commandHandler.js";

export class MinterDBCMD extends CLISubCMD {
    readonly name = "minterdb";
    readonly description = "Manage the Minter database";
    readonly usage = "minterdb <command> [...args]";

    protected onInit(): void {
        this.register(new ReadCMD());
        this.register(new InsertCMD());
        this.register(new RemoveCMD());
        this.register(new GetNextMinterCMD());
    }

    async run(args: string[], meta: CLICMDExecMeta) {
        await Blockchain.init();
        await Blockchain.waitAllChainsInit();

        super.run(args, meta);
    }

}


class ReadCMD extends CLICMD {
    readonly name = "read";
    readonly description = "Read the Minter database";
    readonly usage = "read (<minter_address> | all)";

    public async run(args: string[]): Promise<void> {
        if (args.length !== 1) {
            CommonCLIMessages.invalidNumberOfArguments();
            return;
        }

        if (args[0] === "all") {
            cli.cmd.info(
                "Minters:\n" + 
                (await Blockchain.minters.getAllAddresses()).map((address) => {
                    return address.toHex();
                }).join("\n")
            );
            return;
        }

        const minterAddress = args[0];
        const minter = await Blockchain.minters.getMinter(AddressHex.from(minterAddress));
        if (minter) {
            cli.cmd.info(DataUtils.stringify(minter, (key, value) => {
                if (key === "stake") {
                    return (value.toInt() / 100).toFixed(2);
                }
            }, 2));
        } else {
            cli.cmd.info("Minter not found!");
        }

    }
}

class InsertCMD extends CLICMD {
    readonly name = "insert";
    readonly description = "Insert Data into the Minter database";
    readonly usage = "insert <minter_address> <stake> <version>";

    public async run(args: string[]): Promise<void> {
        if (args.length !== 3) {
            CommonCLIMessages.invalidNumberOfArguments();
            return;
        }

        const minter = new MinterData(AddressHex.from(args[0]), Uint64.from(parseInt(args[1])), PX.from(args[2]));
        await Blockchain.minters.setMinter(minter);
        cli.cmd.info("Minter inserted!");
    }
}

class RemoveCMD extends CLICMD {
    readonly name = "remove";
    readonly description = "Remove Data from the Minter database";
    readonly usage = "remove <minter_address>";

    public async run(args: string[]): Promise<void> {
        if (args.length !== 1) {
            CommonCLIMessages.invalidNumberOfArguments();
            return;
        }

        const minter = await Blockchain.minters.getMinter(AddressHex.from(args[0]));
        if (minter) {
            await Blockchain.minters.removeMinter(minter);
            cli.cmd.info("Minter removed!");
        } else {
            cli.cmd.info("Minter not found!");
        }

    }
}

class GetNextMinterCMD extends CLICMD {
    readonly name = "getnext";
    readonly description = "Get the next minter for a slot";
    readonly usage = "getnext <slot>";

    public async run(args: string[]): Promise<void> {
        if (args.length !== 1) {
            CommonCLIMessages.invalidNumberOfArguments();
            return;
        }

        const slot = Uint64.from(parseInt(args[0]));
        const nextMinter = await Blockchain.minters.selectNextMinter(slot);
        cli.cmd.info(`Next minter for slot ${slot.toBigInt()}: ${nextMinter.toHex()}`);
    }

}
