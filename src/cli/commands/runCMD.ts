import { Main } from "@leicoin/core";
import { Configs } from "@leicoin/config";
import { HTTP_API } from "@leicoin/http-api";
import { NetworkSyncManager } from "@leicoin/net";
import { LeiCoinNetNode } from "@leicoin/net";
import { MinterClient } from "@leicoin/minter";
import { POS } from "@leicoin/pos";
import { Blockchain } from "@leicoin/storage/blockchain";
import { Utils } from "@leicoin/utils";
import { cli } from "../cli.js";
import { CLICMD, CMDFlag, CMDFlagsParser, type FlagsParsingResult } from "@cleverjs/cli";
import { CLICMDHandler } from "../index.js";

export class RunCMD extends CLICMD {
    readonly name = "run";
    readonly description = "Starts LeiCoin-Node";
    readonly usage = "run [...flags]";

    readonly environment = "shell";

    readonly flagParser = new CMDFlagsParser({
        "--host": new CMDFlag(
            "string",
            "The hostname the Node will listen on (default: 0.0.0.0)"
        ),
        "--port": new CMDFlag(
            "number",
            "The port the Node will listen on (default: 12200)"
        ),
        "--only-cli": new CMDFlag(
            "bool",
            "Starts LeiCoin-Node in CLI Only mode. (Also known as Safe Mode)"
        ),
        "--ignore-no-peers": new CMDFlag("bool", "Ignore if no peers are connected"),
        "--experimental": new CMDFlag("bool", "Enable experimental features"),
    });

    async run(args: string[]) {
        const flags = this.flagParser.parse(args);
        if (typeof flags === "string") {
            cli.default.error(flags);
            Utils.gracefulShutdown(1); return;
        }

        Main.environment = "runtime";
        CLICMDHandler.getInstance().environment = "runtime";
        
        await cli.init("all", "all", true, true, Utils.procCWD);
        cli.default.info(`Starting LeiCoin-Node v${Main.version}...`);

        const config = Configs.loadFullConfig();
        Configs.adjustConfigByProcessArgs(flags);

        await Blockchain.init();
        await Blockchain.waitAllChainsInit();

        cli.default.info(`Loaded core modules`);

        if (flags["--only-cli"]) {
            cli.default.info(`LeiCoin-Node started in CLI Only mode`);
            return;
        }

        
        await LeiCoinNetNode.init();
        await LeiCoinNetNode.start({
            ...config.leicoin_net,
            peers: config.peers,
            eventHandler: Utils.events,
        });

        if (config.api?.active) {
            await HTTP_API.init();
            await HTTP_API.start({
                ...config.api,
                eventHandler: Utils.events,
            });
        }

        POS.init(
            config.minter?.active ?
                MinterClient.createMinters(config.minter.credentials) :
                []
        );

        await NetworkSyncManager.doStartupSync(flags["--ignore-no-peers"] as boolean);
        
        POS.start();

        cli.default.info(`LeiCoin-Node started in Full Node mode`);
    }
}


export type NodeStartupFlags = FlagsParsingResult<typeof RunCMD.prototype.flagParser.flagsSettings>;

