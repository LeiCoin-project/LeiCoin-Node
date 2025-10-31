import crypto from "crypto";
import { Dict } from "@advena/utils/dataUtils";

interface Constructable<T> {
    new (...args: any[]): T;
}


function createInstanceFromJSON<T>(cls: Constructable<T>, json: any): T {
    // Retrieve the constructor of the class
    const constructor = cls as any;

    // Retrieve the parameter names of the constructor
    const paramNames = constructor.toString().match(/\(([^)]+)\)/)?.[1].split(',').map((param: string) => param.trim()) || [];

    // Create an array of arguments for the constructor
    const args = paramNames.map((paramName: string) => json[paramName]);

    // Instantiate the class with the arguments
    const instance = Reflect.construct(cls, args);

    // Return the instance
    return instance;
}

function sha256(rawData: string | Dict<any>, excludedKeys: string[] = []) {
    let data = "";

    if (typeof(rawData) === "object") {
        data = JSON.stringify(getPreparedObjectForHashing(rawData, excludedKeys))
    } else {
        data = rawData;
    }

    return crypto.createHash('sha256').update(data).digest('hex');
}

function getPreparedObjectForHashing(obj: Dict<any>, excludedKeys: string[] = []): Dict<any> {
    const deepSort = (input: any): any => {
        if (typeof input !== 'object' || input === null) {
            return input;
        }

        if (Array.isArray(input)) {
            return input.map(deepSort);
        }

        const sortedObj: Dict<any> = {};
        Object.keys(input)
            .sort()
            .forEach(key => {
                if (!excludedKeys.includes(key)) {
                    sortedObj[key] = deepSort(input[key]);
                }
            });
        return sortedObj;
    };

    const sortedObj = deepSort(obj);
    return sortedObj;
}


class BigNum {

    static add(v1: any, v2: any) {
        return (BigInt(v1) + BigInt(v2)).toString();
    }

    static subtract(v1: any, v2: any) {
        return (BigInt(v1) - BigInt(v2)).toString();
    }

    static multiply(v1: any, v2: any) {
        return (BigInt(v1) * BigInt(v2)).toString();
    }

    static divide(v1: any, v2: any) {
        return (BigInt(v1) / BigInt(v2)).toString();
    }

    static mod(v1: any, v2: any) {
        return (BigInt(v1) % BigInt(v2)).toString();
    }

    static greater(v1: any, v2: any) {
        return BigInt(v1) > BigInt(v2);
    }

    static greaterOrEqual(v1: any, v2: any) {
        return BigInt(v1) >= BigInt(v2);
    }

    static less(v1: any, v2: any) {
        return BigInt(v1) < BigInt(v2);
    }

    static lessOrEqual(v1: any, v2: any) {
        return BigInt(v1) <= BigInt(v2);
    }

    static max(v1: any, v2: any): string {
        return this.greater(v1, v2) ? v1 : v2;
    }

    static min(v1: any, v2: any): string {
        return this.less(v1, v2) ? v1 : v2;
    }

    static numToHex(num: any, minLength = 2): string {
        try {
            const hexNum = BigInt(num).toString(16).toUpperCase();
            return hexNum.padStart(minLength, "0");
        } catch (error: any) {
            return error.stack;
        }
    }
    
    // Decode a hexadecimal string to a numeric string
    static hexToNum(hexStr: string) {
        try {
            let num = BigInt(`0x${hexStr}`).toString();
            return num;
        } catch (error: any) {
            return "Invalid input: Please provide a valid hexadecimal string.";
        }
    }

}

enum Callbacks {
    SUCCESS,
    NONE,
    ERROR
}


class EncodingUtils {

    public static splitWithTail(str: string, delim: string, count: number) {
        var parts = str.split(delim);
        var tail = parts.slice(count).join(delim);
        var result = parts.slice(0,count);
        result.push(tail);
        return result;
    }
    
    public static encodeBase64ToString(data: string) {
        return Buffer.from(data).toString('base64');
    }
    
    public static encodeBase64ToBuffer(data: string) {
        return Buffer.from(data, 'base64');
    }
    
    public static decodeBase64ToString(data: string) {
        return Buffer.from(data, 'base64').toString();
    }
    
    public static encodeStringToHex(stringData: string) {
        return Buffer.from(stringData).toString("hex");
    }
      
    public static decodeHexToString(hexData: string) {
        return Buffer.from(hexData, "hex").toString();
    }
    
    public static hexToBuffer(hexData: string) {
        return Buffer.from(hexData, "hex");
    }

    public static bufferToHex(buffer: Buffer) {
        return buffer.toString("hex");
    }
    
    public static encodePublicKeyToBase64(public_key_pem: string) {
        return this.encodeBase64ToString(public_key_pem);
    }
    
    public static decodeBase64ToPublicKey(encoded_public_key: string) {
        return this.decodeBase64ToString(encoded_public_key);
    }
    
    
    /*public static compressZeros(numberStr: string) {
        // Define a regular expression pattern to match consecutive zeros
        const pattern = /0{3,9}/g; // Matches 4 or more consecutive zeros globally
    
        // Replace matches with E(number of zeros)
        const convertedStr = numberStr.replace(pattern, function(match) {
            return 'E' + match.length;
        });
    
        return convertedStr;
    }
    
    public static decompressZeros(compressedStr: string) {
        // Define a regular expression pattern to match compressed sequences
        var pattern = /E(\d+)/g; // Matches E followed by one or more digits
    
        // Replace matches with the corresponding number of zeros
        var decompressedStr = compressedStr.replace(pattern, function(match, numZeros) {
            return '0'.repeat(parseInt(numZeros));
        });
    
        return decompressedStr;
    }*/
    
    public static encodeAddressToHex(address: string) {
        return address.slice(2, address.length).replace("x", "0");
    }
    
    public static decodeHexToAddress(hexKey: string) {
        const splitetHexKey = hexKey.split("");
    
        splitetHexKey[1] = splitetHexKey[1].replace("0", "x");
        const address = "lc" + splitetHexKey.join("");
        return address;
    }
    
    public static splitHex(hexData: string, values: { key: string, length: number | string, type?: "string" | "int" | "bigint" | "array" | "bool" | "object", decodeFunc?: (hexData: string, returnLength: boolean) => any }[], returnLength = false) {
        
        try {

            const final_data: Dict<any> = {};
            let current_length = 0;
        
            for (const data of values) {
        
                const key = data.key;
                
                if (data.type === "object" && data.decodeFunc) {

                    const rawObj = hexData.slice(current_length, hexData.length);
                    const object = data.decodeFunc(rawObj, true);
                    final_data[key] = object;
                    current_length += object.length;

                } else if (data.type === "array" && data.decodeFunc) {
        
                    const final_array: any[] = [];
        
                    let total_arrayLength = 0;

                    const lenghValueLen = data.length as number;
        
                    
                    const arrayDataWithLength = hexData.slice(current_length, hexData.length);
                    const length = parseInt(arrayDataWithLength.slice(0, lenghValueLen));
            
                    let arrayData = arrayDataWithLength.slice(lenghValueLen, arrayDataWithLength.length);
        
                    total_arrayLength = arrayDataWithLength[0].length + 1;
                        
                    for (let i = 0; i < length; i++) {
            
                        const array_item = data.decodeFunc(arrayData, true);
            
                        final_array.push(array_item.data);
                            
                        arrayData = arrayData.slice(array_item.length);
        
                        total_arrayLength += array_item.length;
        
                    }
        
                    current_length += total_arrayLength;
        
                    final_data[key] = final_array;
        
                } else {
        
                    let length: number;
                    const type = data.type;
        
                    if (typeof(data.length) === "string") {
                        length = parseInt(final_data[data.length]);
                    } else {
                        length = data.length;
                    }
                    
                    let value = hexData.slice(current_length, current_length + length);
                    if (value.length !== length) {
                        return { cb: Callbacks.NONE };
                    }
                    
                    switch (type) {
                        case "int": {
                            final_data[key] = parseInt(`0x${value}`).toString();
                            break;
                        }
                        case "bigint": {
                            final_data[key] = BigInt(`0x${value}`).toString();
                            break;
                        }
                        case "bool": {
                            final_data[key] = (value === "1");
                            break;
                        }
                        default: {
                            final_data[key] = value;
                            break;
                        }
                    }
            
                    current_length += length;
        
                } 
        
            }
        
            if (returnLength) {
                return { cb: Callbacks.SUCCESS, data: final_data, length: current_length };
            }
        
            return { cb: Callbacks.SUCCESS, data: final_data };

        } catch (err: any) {
            return { cb: Callbacks.NONE };
        }
    
    }
}

class Transaction {

    public txid: string;
    public senderAddress: string;
    public senderPublicKey: string;
    public recipientAddress: string;
    public amount: string;
    public nonce: string;
    public timestamp: string
    public message: string;
    public signature: string;
    public readonly version: string;

    constructor(txid: string, senderAddress: string, senderPublicKey: string, recipientAddress: string, amount: string, nonce: string, timestamp: string, message: string, signature: string, version = "00") {
        this.txid = txid;
        this.senderAddress = senderAddress;
        this.senderPublicKey = senderPublicKey;
        this.recipientAddress = recipientAddress;
        this.amount = amount;
        this.nonce = nonce;
        this.timestamp = timestamp;
        this.message = message;
        this.signature = signature;
        this.version = version;
    }

    public static createCoinbaseTransaction() {
        const coinbase = new Transaction(
            "",
            "lc0x6c6569636f696e6e65745f636f696e62617365",
            "0000000000000000000000000000000000000000000000000000000000000000",
            "lc0x6c6569636f696e6e65745f636f696e62617365",
            "32",
            "0",
            new Date().getTime().toString(),
            "",
            "0000000000000000000000000000000000000000000000000000000000000000",
        );
        coinbase.txid = sha256(coinbase, ["txid", "version"]);
        return coinbase;
    }

    public encodeToHex() {      
    
        const encoded_amount = BigNum.numToHex(this.amount);
        const amount_length = BigNum.numToHex(encoded_amount.length);

        const encoded_nonce = BigNum.numToHex(this.nonce);
        const nonce_length = BigNum.numToHex(encoded_nonce.length);

        const encoded_timestamp = BigNum.numToHex(this.timestamp);
        const timestamp_length = BigNum.numToHex(encoded_timestamp.length);

        const message_length = BigNum.numToHex(this.message.length);

        const hexData = this.version +
                        this.txid +
                        EncodingUtils.encodeAddressToHex(this.senderAddress) +
                        this.senderPublicKey +
                        EncodingUtils.encodeAddressToHex(this.recipientAddress) +
                        amount_length +
                        encoded_amount +
                        nonce_length +
                        encoded_nonce +
                        timestamp_length +
                        encoded_timestamp +
                        message_length +
                        this.message +
                        this.signature;

        const empty_bytes = (add_empty_bytes && (hexData.length % 2 !== 0)) ? "0" : "";
        
        return hexData + empty_bytes;

    }

    public static fromDecodedHex(hexData: string, returnLength = false) {

        try {
            const returnData = EncodingUtils.splitHex(hexData, [
                {key: "version", length: 2},
                {key: "txid", length: 64},
                {key: "senderAddress", length: 40},
                {key: "senderPublicKey", length: 64},
                {key: "recipientAddress", length: 40},
                {key: "amount_length", length: 2, type: "int"},
                {key: "amount", length: "amount_length", type: "bigint"},
                {key: "nonce_length", length: 2, type: "int"},
                {key: "nonce", length: "nonce_length", type: "bigint"},
                {key: "timestamp_length", length: 2, type: "int"},
                {key: "timestamp", length: "timestamp_length", type: "bigint"},
                {key: "message_length", length: 3, type: "int"},
                {key: "message", length: "message_length"},
                {key: "signature", length: 128}
            ], returnLength);

            const data = returnData.data;
        
            if (data && data.version.eq(0)) {
                data.senderAddress = EncodingUtils.decodeHexToAddress(data.senderAddress);
                data.recipientAddress = EncodingUtils.decodeHexToAddress(data.recipientAddress);

                const tx = createInstanceFromJSON(Transaction, data);

                if (returnLength) {
                    return {data: tx, length: returnData.length};
                }
                return tx;
            }
        } catch (err: any) {
            console.error(`Error loading Transaction from Decoded Hex: ${err.stack}`);
        }

        return null;

    }

}

class AttestationInBlock {
    
    public readonly publicKey: string;
    public readonly vote: boolean;
    public readonly signature: string;

    constructor(publicKey: string, vote: boolean, signature: string) {
        this.publicKey = publicKey;
        this.vote = vote;
        this.signature = signature;
    }

    public encodeToHex() {

        const hexData = this.publicKey +
                        this.vote +
                        this.signature;

        const empty_bytes = (add_empty_bytes && (hexData.length % 2 !== 0)) ? "0" : "";
        
        return hexData + empty_bytes;

    }

    public static fromDecodedHex(hexData: string, returnLength = false) {

        try {
            const returnData = EncodingUtils.splitHex(hexData, [
                {key: "publicKey", length: 64},
                {key: "vote", length: 1, type: "bool"},
                {key: "signature", length: 128}
            ], returnLength);

            const data = returnData.data;
        
            if (data && data.version.eq(0)) {

                const attestation = createInstanceFromJSON(AttestationInBlock, data);

                if (returnLength) {
                    return {data: attestation, length: returnData.length};
                }
                return attestation;
            }
        } catch (err: any) {
            console.error(`Error loading Attestation from Decoded Hex: ${err.stack}`);
        }

        return null;

    }

}

class Block {

    public index: string;
    public hash: string;
    public previousHash: string;
    public timestamp: string;
    public proposer: string;
    public attestations: AttestationInBlock[];
    public transactions: Transaction[];
    public readonly version: string;

    constructor(
        index: string,
        hash: string,
        previousHash: string,
        timestamp: string,
        proposer: string,
        attestations: AttestationInBlock[],
        transactions: Transaction[],
        version = "00"
    ) {

        this.index = index;
        this.hash = hash;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.proposer = proposer;
        this.attestations = attestations;
        this.transactions = transactions;
        this.version = version;

    }

    public static createNewBlock() {

        const coinbase = Transaction.createCoinbaseTransaction();

        const transactions: Transaction[] = [];
        for (let i = 0; i < 100; i++) transactions.unshift(coinbase);
    
        const newBlock = new Block(
            "0",
            '',
            "0000000000000000000000000000000000000000000000000000000000000000",
            new Date().getTime().toString(),
            "0000000000000000000000000000000000000000000000000000000000000000",
            [],
            transactions
        );
        
        newBlock.calculateHash();

        return newBlock;
    }

    public encodeToHex() {   
    
        const encoded_index = BigNum.numToHex(this.index);
        const index_length = BigNum.numToHex(encoded_index.length);

        const encoded_timestamp = BigNum.numToHex(this.timestamp);
        const timestamp_length = BigNum.numToHex(encoded_timestamp.length);

        let encoded_attestations = BigNum.numToHex(this.attestations.length);
        for (let attestation of this.attestations) {
            encoded_attestations += attestation.encodeToHex();
        }

        let encoded_transactions = BigNum.numToHex(this.transactions.length);
        for (let transaction of this.transactions) {
            encoded_transactions += transaction.encodeToHex();
        }

        const hexData = this.version +
                        index_length +
                        encoded_index +
                        this.hash +
                        this.previousHash +
                        timestamp_length +
                        encoded_timestamp +
                        this.proposer +
                        encoded_attestations +
                        encoded_transactions;

        const empty_bytes = (add_empty_bytes && (hexData.length % 2 !== 0)) ? "0" : "";
        
        return hexData + empty_bytes;

    }

    public static fromDecodedHex(hexData: string, returnLength = false) {

        try {
            const returnData = EncodingUtils.splitHex(hexData, [
                {key: "version", length: 2},
                {key: "index_length", length: 2, type: "int"},
                {key: "index", length: "index_length", type: "bigint"},
                {key: "hash", length: 64},
                {key: "previousHash", length: 64},
                {key: "timestamp_length", length: 2, type: "int"},
                {key: "timestamp", length: "timestamp_length", type: "bigint"},
                {key: "proposer", length: 64},
                {key: "attestations", length: 2, type: "array", decodeFunc: AttestationInBlock.fromDecodedHex},
                {key: "transactions", length: 2, type: "array", decodeFunc: Transaction.fromDecodedHex}
            ], returnLength);

            const data = returnData.data;
        
            if (data && data.version.eq(0)) {
                const block = createInstanceFromJSON(Block, data);

                if (returnLength) {
                    return {data: block, length: returnData.length};
                }
                return block;
            }
        } catch (err: any) {
            console.error(`Error loading Block from Decoded Hex: ${err.stack}`);
        }

        return null;
    }

    public calculateHash() {
        this.hash = sha256(this, ["hash"]);
    }

    public addAttestation(attestation: AttestationInBlock) {
        this.attestations.push(attestation);
    }

}

