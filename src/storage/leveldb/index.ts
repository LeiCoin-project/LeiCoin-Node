import type { DatabaseOptions, GetOptions, DelOptions } from "classic-level";
import { ClassicLevel } from "classic-level";
import { LevelDBEncoders } from "./encoders.js";
import { Uint } from "low-level";
import { EntryStream, KeyStream, type ReadStreamOptions, ValueStream } from "level-read-stream";
import type { AbstractIteratorOptions, AbstractKeyIteratorOptions, AbstractValueIteratorOptions, NodeCallback } from "abstract-level";

export class LevelDB<KDefault = Uint, VDefault = Uint> extends ClassicLevel<KDefault, VDefault> {
    
    constructor(location: string, options?: DatabaseOptions<KDefault, VDefault> | string);
    constructor(location: string, options: DatabaseOptions<any, any> = {
        keyEncoding: LevelDBEncoders.Uint,
        valueEncoding: LevelDBEncoders.Uint
    }) {
        super(location, options);
    }

    /*
    public get(key: KDefault): Promise<VDefault>
    public get(key: KDefault, callback: NodeCallback<VDefault>): void
    public get<K = KDefault, V = VDefault>(key: K, options: GetOptions<K, V>): Promise<V>
    public get<K = KDefault, V = VDefault>(key: K, options: GetOptions<K, V>, callback: NodeCallback<V>): void

    public get(key: any, arg1?: any, arg2?: any): any {
        if (typeof arg1 === "function" || typeof arg2 === "function") {
            return super.get(key, arg1, arg2);
        }
        return this.safe_get(key, arg1);
    }
    */

    async safe_get(key: KDefault): Promise<VDefault | null>;
    async safe_get<K = KDefault, V = VDefault>(key: K, options: GetOptions<K, V>): Promise<V | null>;
    async safe_get(key: any, options?: any): Promise<any> {
        try {
            return await this.get(key, options);
        } catch {
            return null;
        }

    }

    async safe_del(key: KDefault): Promise<boolean>;
    async safe_del<K = KDefault> (key: K, options: DelOptions<K>): Promise<boolean>;
    async safe_del(key: any, options?: any) {
        try {
            await this.del(key, options);
            return true;
        } catch {
            return false;
        }
    }

    async has(key: KDefault): Promise<boolean> {
        return (await this.safe_get(key)) !== null;
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


