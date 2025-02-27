import { HTTP_API } from "@leicoin/http-api";
import { Utils } from "@leicoin/utils";
import { cli } from "../cli.js";
import { CLICMD, CLISubCMD } from "@cleverjs/cli";

export class StartServiceCMD extends CLISubCMD {
    readonly name = "start-service";
    readonly description = "Start a service even after initial startup";
    readonly usage = "start-service <service-name> [options]";

    readonly environment = "runtime";

    protected registerCommands() {
        this.register(new StartAPI());
    }
}

class StartAPI extends CLICMD {
    readonly name = "api";
    readonly description = "Start the API service";
    readonly usage = "api [options]";

    public async run(args: string[]) {
        if (HTTP_API.started) {
            cli.cmd.info("API service already started");
            return;
        }

        if (!args[0]) {
            cli.cmd.info("No host or port specified");
            return;
        }

        const [host, port] = args[0].split(":");

        if (!host || !port) {
            cli.cmd.info("Invalid host or port");
            return;
        }

        await HTTP_API.init();
        await HTTP_API.start({
            host,
            port: parseInt(port),
            eventHandler: Utils.events
        });

    }
}
