import fs from 'fs'
import { Block } from "@advena/common/models/block";
import { Uint } from "low-level";
import path from 'path';

async function read() {
    
    const block = Block.fromDecodedHex(new Uint(fs.readFileSync("./blockchain_data/blocks/0.lcb", null)));
    console.log(JSON.stringify(block, (key, value) => {
        if (value instanceof Uint) {
            return value.toHex();
        }
        return value;
    }));

    console.log(
        Uint.from(fs.readFileSync("./blockchain_data/blocks/0.lcb", null)).eq(
            Uint.from(fs.readFileSync("./blockchain_data/blocks/0.lcb", "hex"))
        )
    )

    process.exit(0);

}

async function write() {

    fs.writeFileSync("./blockchain_data/blocks/1.lcb", Uint.from("ABCDEF0123456789").getRaw());
    console.log(Uint.from(fs.readFileSync("./blockchain_data/blocks/1.lcb", null)).toHex())
    process.exit(0);

}

//read()
//write()
