import { EventEmitter } from "events";
import { cli } from "@leicoin/cli";
import { HTTP_API } from "@leicoin/http-api";
import { SlotExecutionManager } from "@leicoin/pos";
import { LeiCoinNetNode } from "@leicoin/net";
import { Blockchain } from "@leicoin/storage/blockchain";
import { type IModuleLike } from "./dataUtils.js";

export class Utils {
    private static initialized = false;

    static readonly events = new EventEmitter();

    static get procCWD() {
        return process.cwd();
    }

    static init() {
        if (this.initialized) return;
        this.initialized = true;
        
        if (process.env.CUSTOM_CWD) {
            process.chdir(process.env.CUSTOM_CWD);
        }

        //process.on("SIGINT", this.gracefulShutdown);
        process.once("SIGTERM", Utils.gracefulShutdown.bind(Utils, 0));

        process.once("uncaughtException", Utils.uncaughtException);
        process.once("unhandledRejection", Utils.unhandledRejection);
    }

    static async gracefulShutdown(exitCode: number = 0) {
        try {            
            cli.default.info('Shutting down...');

            await Promise.all([
                this.stopService(HTTP_API),
                this.stopService(SlotExecutionManager),
                this.stopService(LeiCoinNetNode)
            ]);

            await Blockchain.stop();

            cli.default.info(`LeiCoin-Node stopped with exit code ${exitCode}`);
            await cli.close();
            process.exit(exitCode);

        } catch (error: any) {
            cli.default.error(`Uncaught Exception:\n${error.stack}`);
            this.forceShutdown();
        }
    }

    private static async stopService(service: IModuleLike) {
        try {
            if (!service.started) return;
            await service.stop();
        } catch (error: any) {
            cli.default.error(`Error stopping service: ${error.message}`);
        }

    }

    private static forceShutdown() {
        process.once("SIGTERM", ()=>{});
        process.exit(1);
    }

    private static async uncaughtException(error: Error) {
        cli.default.error(`Uncaught Exception:\n${error.stack}`);
        Utils.gracefulShutdown(1);
    }

    private static async unhandledRejection(reason: any) {
        if (reason.stack) {
            // reason is an error
            return Utils.uncaughtException(reason);
        }
        cli.default.error(`Unhandled Rejection:\n${reason}`);
        Utils.gracefulShutdown(1);
    }

}

Utils.init();
