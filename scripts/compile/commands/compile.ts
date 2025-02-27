import { Command } from "../command.js";
import { Compiler, PlatformArg, Platforms } from "../compiler.js";

class CompileUtils {
    static async getPackageJSONVersion() {
        try {
            const packageJSON = await Bun.file(process.cwd() + "/package.json").json() as {version: string};
            return packageJSON.version;
        } catch (err) {
            console.log("Error reading package.json: " + err.stack);
            process.exit(1);
        }
    }
    static async getTargetVersion(args: Array<string | undefined>): Promise<[string, boolean]> {
        if (args[0] === "--no-version-tag") {
            const version = await this.getPackageJSONVersion()
            return [version, false];
        }
        const argv_version = args[0] || process.env.BUN_VERSION;
        const version = argv_version || await this.getPackageJSONVersion();

        if (!version) {
            console.log("No version specified. Please specify a version.");
            process.exit(1);
        }

        const versionInFileName = args[1] === "--no-version-tag" ? false : true;
        return [version, versionInFileName];
    }
}

export const CompileAllCMD = new class CompileAllCMD extends Command {
    async run(args: string[]) {
        const builds: Promise<void>[] = [];

        const version_settings = await CompileUtils.getTargetVersion(args);

        for (const platform in Platforms) {
            builds.push(new Compiler(platform as PlatformArg, ...version_settings).build());
        }
        await Promise.all(builds);
    }
}();

export const CompileAutoCMD = new class CompileAutoCMD extends Command {
    async run(args: string[]) {
        const version_settings = await CompileUtils.getTargetVersion(args);
        await new Compiler("auto", ...version_settings).build();
    }
}();

export const CompileToTargetCMD = new class CompileToTargetCMD extends Command {
    async run(args: string[], meta: CLICMDExecMeta) {
        const platform = parent_args[0] as PlatformArg;
        if (Object.keys(Platforms).some(p => p === platform) === false) {
            console.log(`Invalid platform: ${platform}`);
            return;
        }
        const version_settings = await CompileUtils.getTargetVersion(args);
        await new Compiler(platform, ...version_settings).build();
    }
}();
