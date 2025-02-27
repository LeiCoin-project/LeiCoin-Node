import { Uint } from "low-level";
import { CB } from "@leicoin/utils/callbacks";
import { AnyObj, Dict } from "@leicoin/utils/dataUtils";
import { DataEncoder } from "./binaryEncoders.js";
import { EncodingUtils } from "./utils.js";


interface OEDecodeStandardResult {
    cb: CB.SUCCESS;
    data: Dict<any>;
}
interface OEDecodeWithLengthResult extends OEDecodeStandardResult {
    length: number;
}
interface OEDecodeUnknownResult extends OEDecodeStandardResult {
    length?: number;
}
interface OEDecodeErrorResult {
    cb: CB.ERROR;
    data: undefined;
}
type OEDecodeResult<T> = T | OEDecodeErrorResult;


export class ObjectEncoding {

    private static initialized = false; 

    public static init() {
        if (this.initialized) return;
        this.initialized = true;
    }

    public static encodeLengthForUnlimited(length: number) {
        const lenStr = length.toString(15) + "F";
        return Uint.from((lenStr.length % 2 === 0) ? lenStr : ("0" + lenStr));
    }

    public static decodeLengthFromUnlimited(hexData: Uint) {
        const base15Length = EncodingUtils.splitNTimes(hexData.toHex().toUpperCase(), "F", 1)[0];
        return [
            parseInt(base15Length, 15),
            Math.ceil((base15Length.length + 1) / 2)
        ];
    }
    
    public static encode(object: AnyObj, keyConfigs: readonly DataEncoder[], forHash: boolean) {
        try {
            const hexData: Uint[] = [];

            for (const keyConfig of keyConfigs) {
                if (forHash && keyConfig.hashRemove) continue;

                const value = object[keyConfig.key]
                const rawData = keyConfig.encode(value);

                if (!rawData) {
                    return { cb: CB.ERROR, data: Uint.empty() };
                }

                hexData.push(...rawData);
            }

            return { cb: CB.SUCCESS, data: Uint.concat(hexData) };

        } catch (err: any) {
            return { cb: CB.ERROR, data: Uint.empty() };
        }
    }
    
    public static decode(hexData: Uint, keyConfigs: readonly DataEncoder[], returnLength?: false): OEDecodeResult<OEDecodeStandardResult>;
    public static decode(hexData: Uint, keyConfigs: readonly DataEncoder[], returnLength: true): OEDecodeResult<OEDecodeWithLengthResult>;
    public static decode(hexData: Uint, keyConfigs: readonly DataEncoder[], returnLength: boolean): OEDecodeResult<OEDecodeUnknownResult>;
    public static decode(hexData: Uint, keyConfigs: readonly DataEncoder[], returnLength = false) {
        try {
            const final_data: Dict<any> = {};
            let current_length = 0;
        
            for (const keyConfig of keyConfigs) {
                const currentPart = hexData.slice(current_length);
                const decoded = keyConfig.decode(currentPart);

                if (!decoded) {
                    return { cb: CB.ERROR };
                }

                final_data[keyConfig.key] = decoded.data;
                current_length += decoded.length;
            }
        
            if (returnLength) {
                return { cb: CB.SUCCESS, data: final_data, length: current_length };
            }

            if (hexData.getLen() !== current_length) {
                // Buffer underflow or overflow
                return { cb: CB.ERROR };
            }
        
            return { cb: CB.SUCCESS, data: final_data };

        } catch (err: any) {
            return { cb: CB.ERROR };
        }
    }

}

ObjectEncoding.init();

