
export abstract class Command {
    abstract run(args: string[], meta: CLICMDExecMeta): Promise<void>;
}

export abstract class SubCommand extends Command {

    protected readonly registry: {[key: string]: Command} = {};

    constructor() {
        super();
        this.registerCommands();
    }

    protected register(key: string, cmd: Command) {
        this.registry[key] = cmd;
    }

    protected abstract registerCommands(): void;

}