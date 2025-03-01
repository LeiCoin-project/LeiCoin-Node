import { Main } from "@leicoin/core";
import { Utils } from "@leicoin/utils";
import { cli } from "./cli.js";
import { BlockDBCMD } from "./commands/blockDBCMD.js";
import { ChainstateDataCMD } from "./commands/chainstateDataCMD.js";
import { CryptoCMD } from "./commands/cryptoCMD.js";
import { MinterDBCMD } from "./commands/minterDBCMD.js";
import { NetworkCMD } from "./commands/networkCMD.js";
import { RunCMD } from "./commands/runCMD.js";
import { StartServiceCMD } from "./commands/startServiceCMD.js";
import { StopCMD } from "./commands/stopCMD.js";
import { VersionCMD } from "./commands/versionCMD.js";
import { WalletDBCMD } from "./commands/walletDBCMD.js";
import { CLIApp, CMDFlag, CMDFlagsParser } from "@cleverjs/cli";


export class CLICMDHandler extends CLIApp {

    private flagParser = new CMDFlagsParser({
        '--cwd': new CMDFlag("string", "Set Directory where data, logs and config is stored")
    });

    private static instance: CLICMDHandler;

    public static getInstance() {
        if (!this.instance) {
            this.instance = new CLICMDHandler(
                "shell",
                cli.cmd.info.bind(cli.cmd),
            );
        }
        return this.instance;
    }

    protected registerCommands(): void {
        this.register(new RunCMD());
        this.register(new StopCMD());
        this.register(new CryptoCMD());
        this.register(new WalletDBCMD());
        this.register(new MinterDBCMD());
        this.register(new BlockDBCMD());
        this.register(new ChainstateDataCMD());
        this.register(new StartServiceCMD())
        this.register(new VersionCMD());
        this.register(new NetworkCMD());
    }

    public async run(args: string[]) {

        if (Main.environment === "command") {

            const parsingResult = this.flagParser.parse(args, true);
            if (typeof parsingResult === "string") {
                cli.default.error(parsingResult);
                Utils.gracefulShutdown(1); return;
            }

            const flags = parsingResult.result;
            args = parsingResult.discarded;


            if (flags["--cwd"]) {
                try {
                    process.chdir(flags["--cwd"]);
                } catch (err: any) {
                    cli.default.error(`Failed to set working directory: ${err.message}`);
                    Utils.gracefulShutdown(1); return;
                }
            }

            if (args[0] !== "run") {
                await cli.init("cmd", "none", false, false, Utils.procCWD);
            }

            if (!args[0]) {
                args.push("help");
            }
            
        }
        
        await super.run(args);
    }

}

export class CommonCLIMessages {

    static invalidNumberOfArguments(): void {
        cli.cmd.info("Invalid number of arguments!");
    }

}


