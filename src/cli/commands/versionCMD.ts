import { Main } from "@leicoin/core";
import { cli } from "../cli.js";
import { CLICMD } from "@cleverjs/cli";

export class VersionCMD extends CLICMD {
    readonly name = "--version";
    readonly description = "Prints the version of LeiCoin-Node.";
    readonly usage = "--version";
    readonly environment = "shell";

    async run() {
        cli.cmd.info(Main.version);
    }
}

