import type { DatabaseOptions, GetOptions, DelOptions } from "classic-level";
import { ClassicLevel } from "classic-level";
import { LevelDBEncoders } from "./encoders.js";
import { Uint } from "low-level";
import { EntryStream, KeyStream, type ReadStreamOptions, ValueStream } from "level-read-stream";
import type { AbstractIteratorOptions, AbstractKeyIteratorOptions, AbstractValueIteratorOptions } from "abstract-level";

// @ts-ignore
export interface LevelDB<KDefault, VDefault> {
    get (key: KDefault): Promise<VDefault | undefined>
    get<K = KDefault, V = VDefault> (key: K, options: GetOptions<K, V>): Promise<V | undefined>
}

// @ts-ignore
export class LevelDB<KDefault = Uint, VDefault = Uint> extends ClassicLevel<KDefault, VDefault> {
    
    constructor(location: string, options?: DatabaseOptions<KDefault, VDefault> | string);
    constructor(location: string, options: DatabaseOptions<any, any> = {
        keyEncoding: LevelDBEncoders.Uint,
        valueEncoding: LevelDBEncoders.Uint
    }) {
        super(location, options);
    }

    async has(key: KDefault): Promise<boolean> {
        return (await this.get(key)) !== undefined;
    }

    public createReadStream(options?: ReadStreamOptions & Omit<AbstractIteratorOptions<KDefault, VDefault>, 'keys' | 'values'>) {
        return new EntryStream(this, options);
    }

    public createKeyStream(options?: ReadStreamOptions & AbstractKeyIteratorOptions<KDefault>) {
        return new KeyStream(this, options);
    }

    public createValueStream(options?: ReadStreamOptions & AbstractValueIteratorOptions<KDefault, VDefault>) {
        return new ValueStream(this, options);
    }

}


