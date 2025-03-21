import { type Uint } from "low-level";
import { cli } from "@leicoin/cli";
import { LCrypt } from "@leicoin/crypto";
import { DataEncoder, ObjectEncoding } from "flexbuf";

type NewContainer<T extends Container> = new (...args: any[]) => T;

interface ContainerConstructor {
    new(...args: any[]): Container;
    fromDict<T extends Container>(obj: Dict<any>): T;
    fromDecodedHex<T extends Container>(hexData: Uint, returnLength?: false): T | null;
    fromDecodedHex<T extends Container>(this: NewContainer<T>, hexData: Uint, returnLength?: true): { data: T, length: number } | null;
    fromDecodedHex<T extends Container>(this: NewContainer<T>, hexData: Uint, returnLength?: false): T | null;
    encodingSettings: readonly DataEncoder[];
}

export abstract class Container {

    public encodeToHex(forHash = false) {
        return ObjectEncoding.encode(this, (this.constructor as typeof Container).encodingSettings, forHash).data;
    }

    static fromDecodedHex<T extends Container>(this: NewContainer<T>, hexData: Uint, returnLength?: false): T | null;
    static fromDecodedHex<T extends Container>(this: NewContainer<T>, hexData: Uint, returnLength: true): { data: T, length: number } | null;
    static fromDecodedHex<T extends Container>(this: NewContainer<T>, hexData: Uint, returnLength: boolean): T | null;
    static fromDecodedHex(hexData: Uint, returnLength = false): any {
        try {
            const result = ObjectEncoding.decode(hexData, this.encodingSettings, returnLength);
            if (result.data) {
                const obj = this.fromDict(result.data);

                if (returnLength) {
                    if (!obj) return null;
                    return { data: obj, length: result.length };
                }
                return obj;
            }
        } catch (err: any) {
            cli.data.error(`Error loading ${this.name} from Decoded Hex: ${err.stack}`);
        }
        return null;
    }

    protected static fromDict(obj: Dict<any>): Container | null {
        throw new Error("Method not implemented.");
    }

    protected static readonly encodingSettings: readonly DataEncoder[] = [];

}


export abstract class HashableContainer extends Container {
    public calculateHash() {
        return LCrypt.sha256(this.encodeToHex(true));
    }
}

