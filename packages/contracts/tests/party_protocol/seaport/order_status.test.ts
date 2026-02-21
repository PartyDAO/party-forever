import { describe, expect, it } from "vitest";

import { getClientForNetworkName } from "../../../src/index.ts";
import { Seaport } from "../../../src/index.ts";

describe("Seaport order status", () => {
  it("returns order status for a filled order on mainnet", async () => {
    const client = getClientForNetworkName("mainnet");
    const seaport = new Seaport(client);

    const status = await seaport.getOrderStatus(
      "0x54be74e639675b4226ac491e1ccaac3cdfb89f2b05a8e754bb6e24a6e17bbb92"
    );

    expect(status.isValidated).toBe(true);
    expect(status.isCancelled).toBe(false);
    expect(status.totalFilled).toBe(1n);
    expect(status.totalSize).toBe(1n);
  });
});
