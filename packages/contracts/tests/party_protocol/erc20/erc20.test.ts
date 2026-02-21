import { describe, expect, it } from "vitest";

import { ERC20 } from "../../../src/index.ts";

describe("ERC20", () => {
  it("fetches decimals for USDC on mainnet", async () => {
    const usdc = new ERC20("mainnet", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
    const decimals = await usdc.fetchDecimals();
    expect(decimals).toBe(6);
  });
});
