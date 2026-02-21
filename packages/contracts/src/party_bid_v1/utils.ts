import type { Client } from "../party_protocol/contract_utils.ts";

const versionAbi = [
  {
    inputs: [],
    name: "VERSION",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

export async function getContractVersion(client: Client, address: `0x${string}`): Promise<string> {
  try {
    const result = await client.readContract({
      address,
      abi: versionAbi,
      functionName: "VERSION" as const
    });
    return String(result);
  } catch {
    return "1";
  }
}
