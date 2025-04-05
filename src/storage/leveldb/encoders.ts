import { AddressHex } from "@leicoin/common/models/address";
import { type IEncoding } from "level-transcoder";
import { type BasicUintConstructable, Uint, Uint256, Uint64 } from "low-level";

export interface LevelDBEncoderLike<T extends Uint> extends IEncoding<Uint, Uint8Array, T> {
    readonly encode: (val: Uint | Uint8Array) => Uint8Array;
    readonly decode: (val: Uint8Array) => T;
    readonly name: string;
    readonly format: "buffer";
}

export class LevelDBEncoderFactory {
    static create<T extends Uint>(name: string, CLS: BasicUintConstructable<T>) {
        return {
            name: name,
            format: "buffer",
            encode: (val: Uint | Uint8Array) => {
                return val instanceof Uint ? val.getRaw() : val;
            },
            decode: (val: Uint8Array) => {
                return CLS.from(val);
            }
        } as LevelDBEncoderLike<T>;
    }
}

export const LevelDBEncoders = {
    Uint: LevelDBEncoderFactory.create<Uint>("uint", Uint),
    Uint64: LevelDBEncoderFactory.create<Uint64>("uint64", Uint64),
    Uint256: LevelDBEncoderFactory.create<Uint256>("uint256", Uint256),
    Address: LevelDBEncoderFactory.create<AddressHex>("address", AddressHex),
}

