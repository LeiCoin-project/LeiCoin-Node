import { Uint } from "low-level";

interface LockedUintConstructable {
    new(buffer: Buffer): LockedUint;
    from(hexType: string): LockedUint;

    readonly byteLength: number;
}

class LockedUintConstructError extends Error {
    name = "LockedUintConstructError";
    message = "LockedUint can only be constructed from two digit Strings";
}

class LockedUintLockedError extends Error {
    name = "LockedUintLockedError";
    message = "LockedUint are Locked and cannot be modified";
};

function constructErr(): any {
    throw new LockedUintConstructError();
}

function lockedErr(...args: any[]): any {
    throw new LockedUintLockedError();
}

export abstract class LockedUint extends Uint {
    public static readonly byteLength: number;

    public static from<T>(this: new(buffer: Buffer) => T, hexType: string): T;
    /** @deprecated If you don't use {@link Prefix.from}(hexType: string) instead, an error will occur! */
    public static from(...args: any[]): any;
    public static from(this: LockedUintConstructable, input: string) {
        if (typeof input === "string" && input.length === this.byteLength * 2) {
            return new this(Buffer.from(input, "hex"));
        }
        constructErr();
    }

    /** @deprecated Don't try to construct a LockedUint with alloc(), an error will occur! */
    public static alloc(): any {constructErr()};
    /** @deprecated Don't try to construct a LockedUint with empty(), an error will occur! */
    public static empty(): any {constructErr()};
    /** @deprecated Don't try to construct a LockedUint with concat(), an error will occur! */
    public static concat(): any {constructErr()};


    /** @deprecated Don't try to modify a LockedUint, an error will occur! */
    public set(): any {lockedErr()};

    /** @deprecated Don't try to modify a LockedUint, an error will occur! */
    public appendData(): any {lockedErr()};

    /** @deprecated Don't try to modify a LockedUint, an error will occur! */
    public iadd(): any {lockedErr()};
    /** @deprecated Don't try to modify a LockedUint, an error will occur! */
    public add(): any {lockedErr()};

    /** @deprecated Don't try to modify a LockedUint, an error will occur! */
    public isub() {lockedErr()};
    /** @deprecated Don't try to modify a LockedUint, an error will occur! */
    public sub(): any {lockedErr()};

    /** @deprecated Don't try to modify a LockedUint, an error will occur! */
    public idiv(): any {lockedErr()};
    /** @deprecated Don't try to modify a LockedUint, an error will occur! */
    public div(): any {lockedErr()};
    /** @deprecated Don't try to modify a LockedUint, an error will occur! */
    public mod(): any {lockedErr()};

}

class Prefix extends LockedUint {
    public static readonly byteLength = 1;
}

namespace Prefix {

    /** Prefix vor version 00 */
    export const V_00 = Prefix.from("00") as PX_V_00;
    declare type PX_V_00 = Prefix & { __type: "V_00" };

    /** Meta Data Prefix */
    export const META = Prefix.from("ff") as PX_META;
    declare type PX_META = Prefix & { __type: "META" };

    /** Standard Address Prefix: 00 */
    export const A_00 = Prefix.from("00") as PX_A_00;
    declare type PX_A_00 = Prefix & { __type: "A_00" };

    /** Smart Contract Address Prefix: 0c */
    export const A_0c = Prefix.from("0c") as PX_A_0c;
    declare type PX_A_0c = Prefix & { __type: "A_0c" };

    /** Node Address Prefix: 0d */
    export const A_0d = Prefix.from("0d") as PX_A_0d;
    declare type PX_A_0d = Prefix & { __type: "A_0d" };

    /** Minter Address Prefix: 0e */
    export const A_0e = Prefix.from("0e") as PX_A_0e;
    declare type PX_A_0e = Prefix & { __type: "A_0e" };

    export type AddressType = typeof Prefix.A_00 | typeof Prefix.A_0c | typeof Prefix.A_0d | typeof Prefix.A_0e;
}

export { Prefix as PX };
