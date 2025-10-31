import { type TCPSocketListener } from "bun";
import { LNSocketHandler, PeerSocket } from "./socket.js";
import { cli } from "@advena/cli";
import { PeerConnections } from "./connections.js";
import { type EventEmitter } from "events";
import { type ModuleLike } from "@advena/utils/dataUtils";
import { Utils } from "@advena/utils";
import { NetworkUtils } from "@advena/utils/network-utils";

export class LeiCoinNetNode implements ModuleLike<typeof LeiCoinNetNode> {
    public static initialized = false;
    public static started = false;

    private static server: TCPSocketListener<PeerSocket>;

    static connections: PeerConnections;

    static async init() {
        if (this.initialized) return;
        this.initialized = true;

        this.connections = new PeerConnections();
    }

    static async start(config: {
        host: string,
        port: number,
        peers: readonly string[]
        eventHandler?: EventEmitter
    }) {
        if (this.started) return;
        this.started = true;

        await this.startServer(config.host, config.port);
        
        const tasks: Promise<void>[] = [
            this.initPeers(config.peers)
        ];

        if (config.eventHandler) {
            tasks.push(this.setupEvents(config.eventHandler));
        }

        await Promise.all(tasks);
    }

    private static async startServer(host: string, port: number) {
        try {

            const hostIP = NetworkUtils.normalizeIP(host);
            if (!hostIP) {
                throw new Error(`Invalid Hostname: ${hostIP}`);
            }

            this.server = Bun.listen({
                hostname: hostIP, port,
                socket: LNSocketHandler.Server
            });

            cli.leicoin_net.info(`LeiCoinNet-Node started on ${NetworkUtils.formatAddress(host, port)}.`);

        } catch (error: any) {
            cli.leicoin_net.error(`Failed to start Node on ${NetworkUtils.formatAddress(host, port)}. Error: ${error.stack}`);
            Utils.gracefulShutdown(1);
        }
    }

    /** @param peers Array of strings in the format "host:port" if no port is provided, the default port is 12200 */
    private static async initPeers(peers: readonly string[]) {
        const promises: Promise<any>[] = [];

        // Connect to other peer nodes and create peer-to-peer connections
        for (const targetData of peers) {
            let [host, port] = NetworkUtils.splitHostAndPort(targetData);

            if (!host) {
                cli.leicoin_net.error(`Invalid Connection Data: ${targetData}`);
                continue;
            }
            if (!port) port = 12200;
            
            async function saveConnect(host: string, port: number) {
                const socket = await PeerSocket.connect(host, port);
                if (!socket) {
                    cli.leicoin_net.error(`Failed to connect to ${NetworkUtils.formatAddress(host, port)}.`);
                    return Promise.resolve();
                }
                return socket;
            }

            promises.push(saveConnect(host, port));
        }

        await Promise.all(promises);
    }

    static getServerInfo() {
        return {
            host: this.server.hostname,
            port: this.server.port
        }
    }

    static async stop() {
        if (!this.started) return;

        for (const connection of this.connections.values()) {
            connection.close();
        }

        if (this.server) {
            this.server.stop();
        } else {
            cli.leicoin_net.error(`LeiCoinNet-Node connot be stopped, because it is not running`);
        }

        cli.leicoin_net.info(`LeiCoinNet-Node stopped`);
    }

    private static async setupEvents(eventHandler: EventEmitter) { }

}

