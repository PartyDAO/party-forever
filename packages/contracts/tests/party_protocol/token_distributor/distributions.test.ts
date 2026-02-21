import { describe, expect, it } from "vitest";

import { DistributionTokenType, TokenDistributor } from "../../../src/index.ts";

describe("TokenDistributor", () => {
  const partyAddress = "0x3c08b69e9d5cbb9b62128fcccf634cd4f910402e";
  const networkName = "mainnet" as const;

  it("fetches distribution created events for a party", async () => {
    const tokenDistributor = TokenDistributor.create(networkName);
    const events = await tokenDistributor.fetchDistributions(partyAddress);

    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThanOrEqual(1);

    const firstEvent = events[0];
    expect(firstEvent.tokenType).toBe(DistributionTokenType.Native);
    expect(firstEvent.blockNumber).toBe(23782444n);
    expect(firstEvent.transactionHash).toBe(
      "0xdb786ed742a2df578961186e0ebf69cd6a12d810b08ee50eb2ed707196e17dcf"
    );
    expect(firstEvent.distributorAddress).toBeDefined();
    expect(firstEvent.party.toLowerCase()).toBe(partyAddress.toLowerCase());
    expect(firstEvent.memberSupply).toBeDefined();
    expect(firstEvent.fee).toBeDefined();
    expect(firstEvent.feeRecipient).toBeDefined();
  });
});
