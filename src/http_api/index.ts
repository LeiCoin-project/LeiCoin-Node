import EventEmitter from "events";
import { type ModuleLike } from "@leicoin/utils/dataUtils";
import Elysia from "elysia";
import { cli } from "@leicoin/cli";
import { NetworkUtils } from "@leicoin/utils/network-utils";

export class HTTP_API implements ModuleLike<typeof HTTP_API> {
    public static initialized = false;
    public static started = false;
    
    private static app: Elysia;

    static async init() {
        if (this.initialized) return;
        this.initialized = true;

        this.app = (await import("./routes/main.js")).HTTPRootRouter;
    }

    static async start(config: {
        host: string,
        port: number,
        eventHandler?: EventEmitter
    }) {
        if (this.started) return;
        this.started = true;

        const host = NetworkUtils.normalizeIP(config.host);
        if (!host) {
            throw new Error(`Invalid Hostname: ${host}`);
        }

        this.app = this.app.listen({
            hostname: host,
            port: config.port
        });
        if (this.app.server) {
            cli.api.info(`API listening on ${NetworkUtils.formatAddress(host, config.port)}`);
        }
        if (config.eventHandler) {
            await this.setupEvents(config.eventHandler);
        }
    }

    static async stop() {
        if (!this.started) return;

        if (this.app?.server) {
            this.app.server.stop();
            cli.api.info("API stopped");
        } else {
            cli.api.error("API could not be stopped, because it is not running");
        }
    }

    private static async setupEvents(eventHandler: EventEmitter) {}
}

