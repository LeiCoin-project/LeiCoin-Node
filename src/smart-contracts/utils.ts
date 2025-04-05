import { LCrypt } from "@leicoin/crypto";
import { Uint } from "low-level";

export class SCUtils {

    static getFNID(fn: Uint): Uint;
    static getFNID(fn: string): string;
    static getFNID(fn: Uint | string) {
        const id = LCrypt.sha256(Uint.from(fn)).slice(0, 4);
        if (typeof fn === "string") {
            return id.toHex();
        }
        return id;
    }

}


