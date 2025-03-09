
import { SubCommand } from "./command.js";
import { CompileAllCMD, CompileAutoCMD, CompileToTargetCMD } from "./commands/compile.js";
import { HelpCMD } from "./commands/help.js";
import { Platforms } from "./compiler.js";

const CompileCMD = new class CompileCMD extends SubCommand {

    protected onInit() {
        this.register("help", HelpCMD);
        this.register("-h", HelpCMD);
        this.register("--help", HelpCMD);

        this.register("all", CompileAllCMD);
        this.register("auto", CompileAutoCMD);

        for (const platform in Platforms) {
            this.register(platform, CompileToTargetCMD);
        }
    }

    async run(args: string[]) {
        const cmd_name = args[0] as string | undefined;

        if (!cmd_name) {
            return this.registry["auto"].run([], []);
        }

        const cmd = this.registry[cmd_name] as SubCommand | undefined;

        if (!cmd) {
            console.log(`Invalid Command: ${cmd_name}`);
            console.log(`Run bun compile --help`);
            return;
        }

        return cmd.run(args.slice(1), args.slice(0, 1));
    }

}();


await CompileCMD.run(
    process.argv.slice(2)
);
