import path from "path";
import fs from "fs";
import { cli } from "@leicoin/cli";
import { Utils } from "@leicoin/utils";
import { Uint } from "low-level";
import readline from "readline";

export class StorageUtils {

    private static getRelativePath(subpath: string, fork = "main") {
        let forkpath = "";
        if (fork !== "main") {
            forkpath = `/forks/${fork}`;
        }
        return '/blockchain_data' + forkpath + subpath;
    }

    static getBlockchainDataFilePath(subpath: string, fork = "main") {
        return path.join(Utils.procCWD, this.getRelativePath(subpath, fork));
    }

    static existsPath(fileORDirPath: string, fork: string) {
        return fs.existsSync(this.getBlockchainDataFilePath(fileORDirPath, fork));
    }


    static readFile(filePath: string, fork: string) {
        return new Uint(fs.readFileSync(this.getBlockchainDataFilePath(filePath, fork), null));
    }

    static writeFile(filePath: string, fork: string, data: Uint) {
        return fs.writeFileSync(this.getBlockchainDataFilePath(filePath, fork), data.getRaw());
    }
    
    static delFile(filePath: string, fork: string) {
        return fs.unlinkSync(this.getBlockchainDataFilePath(filePath, fork));
    }


    static mkDir(directoryPath: string, fork: string) {
        return fs.mkdirSync(this.getBlockchainDataFilePath(directoryPath, fork), { recursive: true });
    }

    static rmDir(directoryPath: string, fork: string) {
        return fs.rmdirSync(this.getBlockchainDataFilePath(directoryPath, fork), { recursive: true });
    }

    
    static copyChain(sourceChain: string, targetChain: string) {
        fs.cpSync(this.getBlockchainDataFilePath(sourceChain), this.getBlockchainDataFilePath(targetChain), { recursive: true });
    }
    
    
    // Function to ensure the existence of a directory
    static ensureDirectoryExists(directoryPath: string, fork = "main", silent?: boolean) {
        try {
            if (!this.existsPath(directoryPath, fork)) {
                this.mkDir(directoryPath, fork);

                if ((fork === "main" && silent !== true) || silent === false) {
                    cli.data.info(`Directory ${this.getRelativePath(directoryPath, fork)} was created because it was missing.`);
                }
            }
        } catch (err: any) {
            cli.data.error(`Error ensuring the existence of a directory at ${this.getRelativePath(directoryPath, fork)}: ${err.stack}`);
        }
    }
    
    // Function to ensure the existence of a file
    static ensureFileExists(
        filePath: string,
        fork: string,
        content: Uint,
        silent?: boolean
    ) {
        try {
            this.ensureDirectoryExists(path.dirname(filePath), fork)
            if (!this.existsPath(filePath, fork)) {
                this.writeFile(filePath, fork, content);
                
                if ((fork === "main" && silent !== true) || silent === false) {
                    cli.data.info(`File ${this.getRelativePath(filePath, fork)} was created because it was missing.`);
                }
            }

        } catch (err: any) {
            cli.data.error(`Error ensuring the existence of a file at ${this.getRelativePath(filePath, fork)}: ${err.stack}`);
        }
    }
    
    // // Function to check if a file is empty or contains an empty JSON object or array
    // /** @deprecated Needs recoding */
    // static isFileNotEmpty(filePath: string, jsonFormat = '[]') {
    //     try {
    //         const content = fs.readFileSync(this.getBlockchainDataFilePath(filePath), 'utf8');
    //         let jsonData;
    //         try {
    //             jsonData = JSON.parse(content);
    //         } catch (err: any) {
    //             jsonData = JSON.parse(jsonFormat);
    //             this.ensureFileExists(filePath, JSON.stringify(jsonData, null, 2));
    //         }
    
    //         if (Array.isArray(jsonData)) {
    //             return jsonData.length > 0;
    //         } else if (typeof jsonData === 'object') {
    //             return Object.keys(jsonData).length > 0;
    //         }
    //         return false;
    //     } catch (err: any) {
    //         const jsonData = JSON.parse(jsonFormat);
    //         this.ensureFileExists(filePath, JSON.stringify(jsonData, null, 2));
    //         return true;
    //     }
    // }
    
    // // Function to check if a directory is empty
    // /** @deprecated Needs recoding */
    // static isDirectoryNotEmpty(directoryPath: any) {
    //     try {
    //         const fullDirectoryPath = this.getBlockchainDataFilePath(directoryPath);
    //         const files = fs.readdirSync(fullDirectoryPath);
    //         return files.length > 0;
    //     } catch (err: any) {
    //         this.ensureDirectoryExists(directoryPath);
    //     }
    // }

    static async readLastNLines(filePath: string, n: number): Promise<string> {
        try {
            const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });
        
            const lines: string[] = [];
            for await (const line of rl) {
                if (!line) continue;
                lines.push(line);
                if (lines.length > n) {
                    lines.shift(); // Remove the oldest line when we exceed `n` lines
                }
            }
        
            return lines.join();
        } catch (err: any) {
            throw new Error(`Error reading the last ${n} lines of the file at ${filePath}`);
        }
    }
    
}

