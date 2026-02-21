import { describe, expect, it } from "vitest";

import { Crowdfund } from "../../../src/index.ts";

describe("Crowdfund", () => {
  // Using a known CollectionBuyCrowdfund on mainnet
  const crowdfundAddress = "0x8c2f23a3ecdaaf25438302925c7f2e9591c25e16";
  const networkName = "mainnet" as const;

  it("getCrowdfundLifecycle", async () => {
    const crowdfund = await Crowdfund.create(networkName, crowdfundAddress);
    const lifecycle = await crowdfund.getCrowdfundLifecycle();
    expect(lifecycle).toBe("Won");
  });

  it("getName", async () => {
    const crowdfund = await Crowdfund.create(networkName, crowdfundAddress);
    const name = await crowdfund.getName();
    expect(name).toBe("Party Shield");
  });

  it("getParty", async () => {
    const crowdfund = await Crowdfund.create(networkName, crowdfundAddress);
    const partyAddress = await crowdfund.getParty();
    expect(partyAddress).toBe("0x45AD3fD6Be04ADcAf3A6477a0342b6988E799dBd");
  });

  it("getTotalContributions", async () => {
    const crowdfund = await Crowdfund.create(networkName, crowdfundAddress);
    const totalContributions = await crowdfund.getTotalContributions();
    expect(totalContributions).toBe(900000000000000000n);
  });

  it("getExpiry", async () => {
    const crowdfund = await Crowdfund.create(networkName, crowdfundAddress);
    const expiry = await crowdfund.getExpiry();
    expect(expiry).toBe(1669068995);
  });

  it("getContributions", async () => {
    const crowdfund = await Crowdfund.create(networkName, crowdfundAddress);
    const contributions = await crowdfund.getContributions();
    expect(contributions.length).toBe(9);
    // getContributions sorts by blockNumber descending, so the earliest is last
    const earliestContribution = contributions[contributions.length - 1];
    expect(earliestContribution).toEqual({
      contributor: "0xB0623C91c65621df716aB8aFE5f66656B21A9108",
      amount: 100000000000000000n,
      delegate: "0xB0623C91c65621df716aB8aFE5f66656B21A9108",
      blockNumber: 15971263n,
      transactionHash: "0xde122ed60e18f9d609316982a60fb514c7bbc714acec06790a8c562f667d1d73"
    });
  });
});
