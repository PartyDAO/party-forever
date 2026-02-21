import { describe, expect, it } from "vitest";

import { Party } from "../../../src/index.ts";

describe("Party order details", () => {
  const partyAddress = "0x8d38e1d4a879e3ef003da26d7b0be998cfccfb9e";
  const networkName = "mainnet" as const;

  it("returns order details for executed ListOnOpensea proposal", async () => {
    const party = await Party.create(networkName, partyAddress);
    const details = await party.fetchOrderDetails(34n);

    expect(details).not.toBeNull();
    expect(details!.type).toBe("standard");
    expect(details!.orderHash).toBe(
      "0x54be74e639675b4226ac491e1ccaac3cdfb89f2b05a8e754bb6e24a6e17bbb92"
    );
    expect(details!.token).toBe("0x5Af0D9827E0c53E4799BB226655A1de152A425a5");
    expect(details!.tokenId).toBe(9076n);
    expect(details!.expiry).toBe(1770831863n);
    if (details!.type === "standard") {
      expect(details!.listPriceWei).toBe(1034000000000000000n);
    }
  });
});
