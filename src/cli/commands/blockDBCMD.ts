import { Blockchain } from "@leicoin/storage/blockchain";
import { DataUtils } from "@leicoin/utils/dataUtils";
import { cli } from "../cli.js";
import { CLICMD, type CLICMDExecMeta, CLISubCMD, CMDFlag, CMDFlagsParser } from "@cleverjs/cli";
import { CommonCLIMessages } from "../commandHandler.js";
import { Uint, Uint64 } from "low-level";
import { Block, BlockHeader } from "@leicoin/common/models/block";

export class BlockDBCMD extends CLISubCMD {
    readonly name = "blockdb";
    readonly description = "Manage the Block database";
    readonly usage = "blockdb <command> [...args]";

    protected onInit(): void {
        this.register(new ReadCMD());
        this.register(new AddCMD());
    }

    async run(args: string[], meta: CLICMDExecMeta) {
        await Blockchain.init();
        await Blockchain.waitAllChainsInit();

        super.run(args, meta);
    }

}


class ReadCMD extends CLICMD {
    readonly name = "read";
    readonly description = "Read the Block database";
    readonly usage = "read <index>";

    async run(args: string[]): Promise<void> {
        if (args.length !== 1) {
            CommonCLIMessages.invalidNumberOfArguments();
            return;
        }

        const blockIndex = args[0];
        const block = await Blockchain.blocks.get(Uint64.from(blockIndex));
        if (block) {
            cli.cmd.info(DataUtils.stringify(block, null, 2));
        } else {
            cli.cmd.info(`Block with Index: ${blockIndex} not found!`);
        }

    }
}

class AddCMD extends CLICMD {
    readonly name = "add";
    readonly description = "Add a Block to the Block database";
    readonly usage = "add <rawBlockData> [--overwrite]";

    readonly flagParser = new CMDFlagsParser({
        "--overwrite": new CMDFlag("bool", "Overwrite existing Block with the same index")
    });

    async run(args: string[]): Promise<void> {
        if (args.length < 1) {
            CommonCLIMessages.invalidNumberOfArguments();
            return;
        }

        const flags = this.flagParser.parse(args, true);
        if (typeof flags === "string") {
            cli.cmd.error(flags);
            return;
        }

        const block = Block.fromDecodedHex(Uint.from(args[0]));

        if (!block) {
            cli.cmd.error(`Raw Block Data could not be parsed!`);
            return;
        }

        const overwrite = !!flags.result["--overwrite"];
        const add_result = await Blockchain.blocks.add(block, overwrite);

        if (!add_result && !overwrite) {
            cli.cmd.warn(`Block with Index: ${block.index} already exists!`);
        } else {
            cli.cmd.info(`Successfully added Block with Index: ${block.index}`);
        }
    }
}

