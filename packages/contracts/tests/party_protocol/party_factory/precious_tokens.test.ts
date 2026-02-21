import { describe, expect, it } from "vitest";

import { PartyFactory } from "../../../src/index.ts";

describe("PartyFactory", () => {
  const partyAddress = "0x8d38e1d4a879e3ef003da26d7b0be998cfccfb9e";
  const networkName = "mainnet" as const;

  it("fetches party creation data including precious tokens and hosts", async () => {
    const partyFactory = new PartyFactory(networkName);
    const result = await partyFactory.fetchPartyCreationData(partyAddress);

    expect(result.preciousTokens.map((a) => a.toLowerCase())).toEqual([
      "0x5af0d9827e0c53e4799bb226655a1de152a425a5"
    ]);
    expect(result.preciousTokenIds).toEqual([9076n]);
    expect(result.hosts.map((a) => a.toLowerCase())).toEqual([
      "0xd66018102d639165ec15f7d0305f276835d955ce"
    ]);
  });
});
