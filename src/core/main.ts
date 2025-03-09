import { CLICMDHandler } from "@leicoin/cli";

export class Main {

    private static initialized = false;

    static readonly version = process.env.LEICOIN_NODE_VERSION || "DEV";

    private static _environment: "runtime" | "command" = "command";

    public static async init() {
        if (this.initialized) return;
        this.initialized = true;

        const args = process.argv.slice(2);
        await CLICMDHandler.getInstance().handle(args);
    }

    public static get environment(): typeof Main._environment {
        return this._environment;
    }

    public static set environment(env: "runtime") {
        this._environment = env;
    }

}
