import { GeneralConfigLike, GeneralConfigParser } from "./general.js";
import { ENVConfigLike, ENVConfigParser } from "./dotenv.js";
import { PeersConfigParser } from "./peers.js";
import fs from "fs";
import path from "path";
import { cli } from "@advena/cli";
import { NodeStartupFlags } from "@advena/cli/types";
import { Utils } from "@advena/utils";

export interface ConfigLike extends GeneralConfigLike, ENVConfigLike {
    peers: string[];
}


export class Configs {

    private static config: ConfigLike;

    private constructor() {}

    static loadFullConfig() {
        if (!this.config) {
            this.createConfigDir();

            const defaultConfig = new GeneralConfigParser().parse();
            const peersConfig = new PeersConfigParser().parse();
            const envConfig = new ENVConfigParser().parse();
    
            if (!defaultConfig || !peersConfig || !envConfig) {
                Utils.gracefulShutdown(1);
                return {} as ConfigLike;
            }

            this.config = {
                ...defaultConfig,
                ...envConfig,
                peers: peersConfig
            };

        }
        return this.config;
    }

    private static createConfigDir() {
        const configDir = path.join(Utils.procCWD, '/config');
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
            cli.data.info(`Directory /config was created because it was missing.`);
        }
    }

    static adjustConfigByProcessArgs(processFlags: NodeStartupFlags) {
        const pArgs = processFlags;
        const netConfig = this.config.leicoin_net;

        if (pArgs["--port"]) netConfig.port = pArgs["--port"];
        if (pArgs["--host"]) netConfig.host = pArgs["--host"];
        if (pArgs["--experimental"]) this.config.experimental = pArgs["--experimental"];
    }

}

