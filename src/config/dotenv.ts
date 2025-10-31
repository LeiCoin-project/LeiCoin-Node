import path from "path";
import { type Dict } from "@advena/utils/dataUtils";
import dotenv from "dotenv";
import fs from "fs";
import { Utils } from "@advena/utils";
import { cli } from "@advena/cli";

export interface ENVConfigLike extends Dict<any> {}

export class ENVConfigParser {

    private static instance: ENVConfigParser;

    constructor() {
        if (ENVConfigParser.instance) {
            return ENVConfigParser.instance;
        }
        ENVConfigParser.instance = this;
    }

    public parse() {
        const envFilePath = path.join(Utils.procCWD, '/config/.env');
        try {
            if (fs.existsSync(envFilePath)) {
                dotenv.config({ path: envFilePath });
                const envData: ENVConfigLike = {};
                /* only load env vars into config that are in the env file
                for (let key in process.env) {
                    envData[key] = process.env[key];
                }
                */
                return envData;
            } else {
                let sampleFile = "";
                for (let key in this.sample) {
                    sampleFile += `${key}=${this.sample[key]}\n`;
                }

                fs.writeFileSync(envFilePath, sampleFile);
                return this.sample;
            }
        } catch (error: any) {
            cli.data.error(`Error loading .env configuration: ${error.stack}`);
            return null;
        }
    }

    private sample: ENVConfigLike = {}

}
