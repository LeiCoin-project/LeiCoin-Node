import path from "path";
import fs from "fs";
import { Utils } from "@advena/utils";
import { cli } from "@advena/cli";

export type PeersConfigLike = string[];

export class PeersConfigParser {

    private static instance: PeersConfigParser;

    constructor() {
        if (PeersConfigParser.instance) {
            return PeersConfigParser.instance;
        }
        PeersConfigParser.instance = this;
    }

    public parse() {
        const configFilePath = path.join(Utils.procCWD, '/config/peers.json');
        try {
            if (fs.existsSync(configFilePath)) {
                const configData = fs.readFileSync(configFilePath, 'utf-8');
                return JSON.parse(configData) as PeersConfigLike;
            } else {
                fs.writeFileSync(configFilePath, JSON.stringify(this.sample, null, 4));
                return this.sample as PeersConfigLike;
            }
        } catch (error: any) {
            cli.data.error(`Error loading peers configuration: ${error.stack}`);
            return null;
        }
    }

    private sample: string[] = []

}