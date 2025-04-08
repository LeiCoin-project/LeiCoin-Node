import { describe, test, expect } from "bun:test";
import { LNMsgRegistry } from "../src/network/messaging/index.js";
import { GetBlocksMsg } from "../src/network/messaging/messages/block.js";
import { Uint32, Uint64 } from "low-level";
import { LNResponseMsg } from "../src/network/messaging/networkMessages.js";
import { NetworkSyncManager } from "../src/network/chain-sync.js";
import { NetworkUtils } from "@leicoin/utils/network-utils";

describe("leicoin-net", () => {
    test("unique_message_ids", async () => {
        const ids: string[] = [];
        for (const value of Object.values(LNMsgRegistry)) {
            expect(ids).not.toContain(value.ID.toHex());
            ids.push(value.ID.toHex());
        }
    });
    test("send_large_get_blocks_msg_response", async () => {
        // NetworkSyncManager.state = "synchronized";
        // const decoded_response = new LNResponseMsg(Uint32.from(0x1234), await GetBlocksMsg.Handler.receive(new GetBlocksMsg(Uint64.from(0), Uint64.from(512)))).encodeToHex();
        // const response = LNResponseMsg.fromDecodedHex(decoded_response);

        // expect(response).not.toBeNull();
    });

});

describe("ip_tests", () => {
    test("ip_checks", async () => {
        // IPv4 tests
        expect(NetworkUtils.isIPv4("192.168.1.1")).toBe(true); // Valid IPv4
        expect(NetworkUtils.isIPv4("255.255.255.255")).toBe(true); // Valid IPv4 (broadcast address)
        expect(NetworkUtils.isIPv4("0.0.0.0")).toBe(true); // Valid IPv4 (unspecified address)
        expect(NetworkUtils.isIPv4("192.168.1.256")).toBe(false); // Invalid (out of range octet)
        expect(NetworkUtils.isIPv4("192.168.1")).toBe(false); // Invalid (missing octet)
        expect(NetworkUtils.isIPv4("192.168.1.")).toBe(false); // Invalid (trailing dot)
        expect(NetworkUtils.isIPv4("192.168.1.-1")).toBe(false); // Invalid (negative octet)
        expect(NetworkUtils.isIPv4("192.168.1.a")).toBe(false); // Invalid (non-numeric octet)
        expect(NetworkUtils.isIPv4("300.300.300.300")).toBe(false); // Invalid (out of range)
        expect(NetworkUtils.isIPv4("192.168.1.01")).toBe(false); // Invalid (leading zero)
        expect(NetworkUtils.isIPv4("192.168.1..1")).toBe(false); // Invalid (double dot)

        // IPv6 tests
        expect(NetworkUtils.isIPv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(true); // Valid IPv6
        expect(NetworkUtils.isIPv6("2001:db8:85a3::8a2e:370:7334")).toBe(true); // Valid IPv6 (compressed)
        expect(NetworkUtils.isIPv6("::1")).toBe(true); // Valid IPv6 (loopback)
        expect(NetworkUtils.isIPv6("::")).toBe(true); // Valid IPv6 (unspecified)
        expect(NetworkUtils.isIPv6("::ffff:127.0.0.1")).toBe(true); // Valid IPv6-mapped IPv4
        expect(NetworkUtils.isIPv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334:")).toBe(false); // Invalid (trailing colon)
        expect(NetworkUtils.isIPv6("2001:0db8:85a3:0000:::")).toBe(false); // Invalid (multiple consecutive colons without compression)
        expect(NetworkUtils.isIPv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334:7334")).toBe(false); // Invalid (too many segments)
        expect(NetworkUtils.isIPv6("12345::")).toBe(false); // Invalid (segment out of range)
        expect(NetworkUtils.isIPv6("2001:0db8:85a3::8a2e:0370g:7334")).toBe(false); // Invalid (non-hex character)

        // Edge cases
        expect(NetworkUtils.isIPv6("::ffff:255.255.255.255")).toBe(true); // Valid IPv6-mapped IPv4 (broadcast)
        expect(NetworkUtils.isIPv6("::ffff:0.0.0.0")).toBe(true); // Valid IPv6-mapped IPv4 (unspecified)
        expect(NetworkUtils.isIPv6("2001:db8::")).toBe(true); // Valid IPv6 (compressed)
        expect(NetworkUtils.isIPv6("::ffff:192.168.1.256")).toBe(false); // Invalid (mapped IPv4 out of range)
        expect(NetworkUtils.isIPv6("2001::85a3::7334")).toBe(false); // Invalid (double "::" in incorrect positions)
    });

    test("normalize_ip", async () => {
        // IPv4
        expect(NetworkUtils.normalizeIP("192.168.1.1")).toBe("192.168.1.1");

        // IPv6-mapped IPv4
        expect(NetworkUtils.normalizeIP("::ffff:127.0.0.1")).toBe("127.0.0.1");

        // Full expansion
        expect(NetworkUtils.normalizeIP("2001:db8::1")).toBe("2001:db8:0:0:0:0:0:1");

        // Loopback address
        expect(NetworkUtils.normalizeIP("::1")).toBe("0:0:0:0:0:0:0:1");

        // Unspecified address
        expect(NetworkUtils.normalizeIP("::")).toBe("0:0:0:0:0:0:0:0");

        // Invalid inputs
        expect((NetworkUtils.normalizeIP("invalid"))).toBeNull();
    });

    test("format_ip", async () => {
        // IPv4
        expect(NetworkUtils.formatIP("192.168.1.1")).toBe("192.168.1.1");

        // IPv6-mapped IPv4
        expect(NetworkUtils.formatIP("::ffff:127.0.0.1")).toBe("127.0.0.1");

        // IPv6 with brackets
        expect(NetworkUtils.formatIP("2001:db8::1")).toBe("[2001:db8:0:0:0:0:0:1]");
        expect(NetworkUtils.formatIP("[2001:db8::1]")).toBe("[2001:db8:0:0:0:0:0:1]");

        // Loopback IPv6
        expect(NetworkUtils.formatIP("::1")).toBe("[0:0:0:0:0:0:0:1]");

        // Unspecified IPv6
        expect(NetworkUtils.formatIP("::")).toBe("[0:0:0:0:0:0:0:0]");

        // Invalid IP
        expect(NetworkUtils.formatIP("invalid")).toBe(null);
    });
    test("spilt_host_port", async () => {

        expect(NetworkUtils.splitHostAndPort("192.168.1.1:12200")).toEqual(["192.168.1.1", 12200]);
        expect(NetworkUtils.splitHostAndPort("[2001:db8::1]:12200")).toEqual(["2001:db8:0:0:0:0:0:1", 12200]);
        expect(NetworkUtils.splitHostAndPort(":::12200")).toEqual(["0:0:0:0:0:0:0:0", 12200]);
        expect(NetworkUtils.splitHostAndPort("leicraftmc.de:12200")).toEqual(["leicraftmc.de", 12200]);

        expect(NetworkUtils.splitHostAndPort("192.168.1.1")).toEqual(["192.168.1.1", null]);

    });

});