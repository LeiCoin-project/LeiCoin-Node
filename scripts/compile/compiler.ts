
export enum Platforms {
    "linux-x64" = "bun-linux-x64-modern",
    "linux-x64-baseline" = "bun-linux-x64-baseline",
    "linux-arm64" = "bun-linux-arm64",

    "win-x64" = "bun-windows-x64-modern",
    "win-x64-baseline" = "bun-windows-x64-baseline",

    "macos-x64" = "bun-darwin-x64-modern",
    "macos-x64-baseline" = "bun-darwin-x64-baseline",
    "macos-arm64" = "bun-darwin-arm64",
}

export type PlatformArg = keyof typeof Platforms | "auto";

class CompilerCommand {

    public sourcemap = true;
    public minify = true;
    public entrypoint = "./src/index.ts";
    public outfile = "./build/bin/leicoin-node";
    public platform: PlatformArg = "auto";
    public env: NodeJS.ProcessEnv = {};
    private additionalArgs: string[] = [];

    constructor(private baseCommand = "bun build --compile") {}

    public addArg(arg: string) {
        this.additionalArgs.push(arg);
    }

    public getCommand() {
        return [
            this.baseCommand,
            (this.sourcemap ? "--sourcemap" : ""),
            (this.minify ? "--minify" : ""),
            this.entrypoint,
            "--outfile", this.outfile,
            (this.platform === "auto" ? "" : `--target=${Platforms[this.platform]}`),
            ...Object.entries(this.env).map(([key, value]) => `--define "process.env.${key}='${value}'"`),
            ...this.additionalArgs
        ].join(" ");
    }

}

export class Compiler {

    private command = new CompilerCommand();

    constructor(
        private platform: PlatformArg,
        private version: string,
        versionInFileName: boolean
    ) {
        if (versionInFileName) {
            this.command.outfile += `-v${version}`;
        }

        this.command.platform = platform;

        if (platform !== "auto") {
            if (Object.keys(Platforms).some(p => p === platform) === false) {
                throw new Error(`Invalid platform: ${platform}`);
            }
            this.command.outfile += `-${platform}`;
        }

        /* Uncomment this if Bun fully support that also on cross-compiling
        if (platform.startsWith("win") || process.platform === "win32") {
            this.command.addArg("--windows-icon=./assets/leicoin-logo-win.ico");
        }
        */
        
        this.command.env.LEICOIN_NODE_VERSION = version;
    }

    async build() {
        try {
            const output = await Bun.$`
                echo "Building from sources. Version: ${this.version} Platform: ${this.platform}";
                ${{ raw: this.command.getCommand() }}
                `.text();
            console.log(output);
        } catch (err) {
            console.log(`Failed: ${err.message}`);
        }
    }

}

