import { describe, expect, it } from "vitest";

import { getClientForNetworkName, PartyBid, PartyBidStatus } from "../../src/index.ts";

const client = getClientForNetworkName("mainnet");

// v1: Metaverse, v2: PartyToad, v3: Lil Pudgys
const V1_ADDRESS = "0x5f3bf427fc5290722f0caa5c0a1a0c7a3968a077" as const;
const V2_ADDRESS = "0x3e6348a0e9f230a15ef71edc50c4edf4c7783598" as const;
const V3_ADDRESS = "0x2fdf0e2484305d404242e924a4be630815005119" as const;

describe("PartyBid getName", () => {
  it("returns 'PartyToad' for v2 contract", async () => {
    const partyBid = await PartyBid.create(V2_ADDRESS, client);
    const name = await partyBid.getName();
    expect(name).toBe("PartyToad");
  });

  it("returns 'Metaverse' for v1 contract", async () => {
    const partyBid = await PartyBid.create(V1_ADDRESS, client);
    const name = await partyBid.getName();
    expect(name).toBe("Metaverse");
  });

  it("returns 'Lil Pudgys' for v3 contract", async () => {
    const partyBid = await PartyBid.create(V3_ADDRESS, client);
    const name = await partyBid.getName();
    expect(name).toBe("Lil Pudgys");
  });
});

describe("PartyBid getContributions", () => {
  it("returns contributions for v2 contract", async () => {
    const partyBid = await PartyBid.create(V2_ADDRESS, client);
    const contributions = await partyBid.getContributions();
    expect(contributions.length).toBeGreaterThan(0);
    const first = contributions[0];
    expect(first.contributor).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(first.amount).toBeGreaterThan(0n);
    expect(typeof first.previousTotalContributedToParty).toBe("bigint");
    expect(typeof first.totalFromContributor).toBe("bigint");
    expect(typeof first.blockNumber).toBe("bigint");
    expect(first.transactionHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it("returns contributions sorted by blockNumber descending", async () => {
    const partyBid = await PartyBid.create(V2_ADDRESS, client);
    const contributions = await partyBid.getContributions();
    for (let i = 1; i < contributions.length; i++) {
      expect(contributions[i - 1].blockNumber).toBeGreaterThanOrEqual(contributions[i].blockNumber);
    }
  });
});

describe("PartyBid getStatus", () => {
  it("returns status for v1 contract", async () => {
    const partyBid = await PartyBid.create(V1_ADDRESS, client);
    const status = await partyBid.getStatus();
    expect([PartyBidStatus.Active, PartyBidStatus.Won, PartyBidStatus.Lost]).toContain(status);
  });

  it("returns status for v3 contract", async () => {
    const partyBid = await PartyBid.create(V3_ADDRESS, client);
    const status = await partyBid.getStatus();
    expect([PartyBidStatus.Active, PartyBidStatus.Won, PartyBidStatus.Lost]).toContain(status);
  });
});

describe("PartyBid getNftInfo", () => {
  it("returns NFT info for v2 contract", async () => {
    const partyBid = await PartyBid.create(V2_ADDRESS, client);
    const nftInfo = await partyBid.getNftInfo();
    expect(nftInfo.nftContract).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(typeof nftInfo.tokenId).toBe("bigint");
  });

  it("returns NFT info for v1 contract", async () => {
    const partyBid = await PartyBid.create(V1_ADDRESS, client);
    const nftInfo = await partyBid.getNftInfo();
    expect(nftInfo.nftContract).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(typeof nftInfo.tokenId).toBe("bigint");
  });
});
