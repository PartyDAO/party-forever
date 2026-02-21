import { zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

import { Crowdfund, findImplementation, getClientForNetworkName, Party } from "../../src/index.ts";

describe("findImplementation", () => {
  const client = getClientForNetworkName("mainnet");

  it("finds implementation for 0x11f2c86d4e86a527c66b70403daba8d21b10feec", async () => {
    const impl = await findImplementation(client, "0x11f2c86d4e86a527c66b70403daba8d21b10feec");
    expect(impl).toMatch(/^0x/);
    expect(impl).not.toBe(zeroAddress);
    expect(impl.toLowerCase()).toBe("0x6c7d98079023f05c2b57dfc933fa0903a2c95411");
  });

  it("finds implementation for 0x8c2f23a3ecdaaf25438302925c7f2e9591c25e16", async () => {
    const impl = await findImplementation(client, "0x8c2f23a3ecdaaf25438302925c7f2e9591c25e16");
    expect(impl).toMatch(/^0x/);
    expect(impl).not.toBe(zeroAddress);
    expect(impl.toLowerCase()).toBe("0x57dc04a0270e9f9e6a1289c1559c84098ba0fa9c");
  });
});

describe("Party.create", () => {
  it("creates Party for 0x11f2c86d4e86a527c66b70403daba8d21b10feec", async () => {
    const party = await Party.create("mainnet", "0x11f2c86d4e86a527c66b70403daba8d21b10feec");
    expect(party).toBeInstanceOf(Party);
  });

  it("creates Party for 0x45ad3fd6be04adcaf3a6477a0342b6988e799dbd", async () => {
    const party = await Party.create("mainnet", "0x45ad3fd6be04adcaf3a6477a0342b6988e799dbd");
    expect(party).toBeInstanceOf(Party);
  });
});

describe("Crowdfund.create", () => {
  it("creates Crowdfund for 0x8c2f23a3ecdaaf25438302925c7f2e9591c25e16", async () => {
    const crowdfund = await Crowdfund.create(
      "mainnet",
      "0x8c2f23a3ecdaaf25438302925c7f2e9591c25e16"
    );
    expect(crowdfund).toBeInstanceOf(Crowdfund);
  });
});
