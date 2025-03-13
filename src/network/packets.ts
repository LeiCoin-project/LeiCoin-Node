import { Uint, Uint32, Uint8 } from "low-level";

/** @todo packages, can not connect from local to remote */
/**
 * Represents a binary data packet in the LeiCoin Network.
 */
export class LNDataPaket {

    /**
     * The maximum size of a data packet.
     */
    static readonly MAX_BYTE_SIZE = 1024 * 1024 * 1024;

    constructor(
        readonly length: Uint32,
        readonly data: Uint,
    ) {}

    static create(data: Uint) {
        if (data.getLen() > LNDataPaket.MAX_BYTE_SIZE) {
            return null;
        }
        
        return new LNDataPaket(
            Uint32.from(data.getLen()),
            data,
        );
    }


    public encodeToHex() {
        return Uint.concat([this.length, this.data]);
    }

    static fromDecodedHex(hexData: Uint) {

        const length = new Uint32(hexData.slice(0, 4));
        const data = hexData.slice(4);

        if (length.gt(LNDataPaket.MAX_BYTE_SIZE) || !length.eq(data.getLen())) {
            return null;
        }
        
        return new LNDataPaket(
            hexData.slice(0, 1),
            hexData.slice(1),
        );
    }

}
