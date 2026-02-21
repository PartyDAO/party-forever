import { describe, expect, it } from "vitest";

import { getClientForNetworkName, getContractVersion } from "../../src/index.ts";

describe("getContractVersion", () => {
  const client = getClientForNetworkName("mainnet");

  it("returns '1' for v1 contract without VERSION function", async () => {
    const version = await getContractVersion(client, "0x2912F57F93dD69FBbF477B616D6f8C34C49bb282");
    expect(version).toBe("1");
  });

  it("returns '3' for v3 contract", async () => {
    const version = await getContractVersion(client, "0xc5cd3658031e7a7a94fe9bc5a65b9a90c202177c");
    expect(version).toBe("3");
  });

  it("returns '2' for v2 contract", async () => {
    const version = await getContractVersion(client, "0x3e6348a0e9f230a15ef71edc50c4edf4c7783598");
    expect(version).toBe("2");
  });
});
