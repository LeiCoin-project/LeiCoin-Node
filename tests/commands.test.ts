import { describe, test, expect } from "bun:test";
import { CMDFlagsParser, CMDFlag } from "@cleverjs/cli";

describe("commands", () => {
    test("parse_flags", () => {
        
        const parsed = new CMDFlagsParser({
            '--port': new CMDFlag("number", "", true, null),
            '--host': new CMDFlag("string", ""),
            '--cwd': new CMDFlag("string", ""),
            '--only-cli': new CMDFlag("bool", ""),
        }).parse(["--port=1234", "--host=0.0.0.0", "--cwd=/home/user", "--only-cli"]);

        expect(parsed).toEqual({
            '--port': 1234,
            '--host': "0.0.0.0",
            '--cwd': "/home/user",
            '--only-cli': true
        });

    });
});