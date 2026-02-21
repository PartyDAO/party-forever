import type { Client } from "@party-forever/contracts";

const REVERSE_RECORDS_ADDRESS = "0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C";
const CHUNK_SIZE = 50;

const reverseRecordsAbi = [
  {
    inputs: [{ name: "addresses", type: "address[]" }],
    name: "getNames",
    outputs: [{ name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

/**
 * Resolve ENS names for a batch of addresses using the ReverseRecords contract on mainnet.
 * Returns a Map from lowercase address to ENS name (or null if no reverse record).
 */
export async function resolveEnsNames(
  client: Client,
  addresses: string[]
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  const unique = [...new Set(addresses.map((a) => a.toLowerCase()))];
  if (unique.length === 0) return results;

  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += CHUNK_SIZE) {
    chunks.push(unique.slice(i, i + CHUNK_SIZE));
  }

  await Promise.all(
    chunks.map(async (chunk) => {
      const names = await client.readContract({
        address: REVERSE_RECORDS_ADDRESS,
        abi: reverseRecordsAbi,
        functionName: "getNames" as const,
        args: [chunk as `0x${string}`[]]
      });

      for (let i = 0; i < chunk.length; i++) {
        const name = names[i];
        results.set(chunk[i], name && name.length > 0 ? name : null);
      }
    })
  );

  return results;
}
