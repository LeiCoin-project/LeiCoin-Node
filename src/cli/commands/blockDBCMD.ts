import { type Block } from "@leicoin/common/models/block";
import { Blockchain } from "@leicoin/storage/blockchain";
import { DataUtils } from "@leicoin/utils/dataUtils";
import { cli } from "../cli.js";
import { CLICMD, CLICMDExecMeta, CLISubCMD } from "@cleverjs/cli";
import { CommonCLIMessages } from "../commandHandler.js";

export class BlockDBCMD extends CLISubCMD {
    readonly name = "blockdb";
    readonly description = "Manage the Block database";
    readonly usage = "blockdb <command> [...args]";

    protected onInit(): void {
        this.register(new ReadCMD());
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

    public async run(args: string[]): Promise<void> {
        if (args.length !== 1) {
            CommonCLIMessages.invalidNumberOfArguments();
            return;
        }

        const blockIndex = args[0];
        const block = Blockchain.blocks.get(blockIndex).data as Block;
        if (block) {
            cli.cmd.info(DataUtils.stringify(block, null, 2));
        } else {
            cli.cmd.info(`Block with Index: ${blockIndex} not found!`);
        }

    }
}

