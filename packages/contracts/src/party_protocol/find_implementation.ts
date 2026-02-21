import type { Client } from "./contract_utils.ts";

const IMPL_ABI = [
  {
    type: "function",
    name: "IMPL",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view"
  }
] as const;

// EIP-1167 bytecode prefix (bytes 0-9)
const EIP1167_PREFIX = "363d3d373d3d3d363d73";
// EIP-1167 bytecode suffix (bytes 30-44)
const EIP1167_SUFFIX = "5af43d82803e903d91602b57fd5bf3";

export class ImplementationNotFoundError extends Error {
  constructor(address: string) {
    super(`Could not find implementation address for ${address}`);
    this.name = "ImplementationNotFoundError";
  }
}

export async function findImplementation(
  client: Client,
  address: `0x${string}`
): Promise<`0x${string}`> {
  // Try calling IMPL() first
  try {
    const impl = await client.readContract({
      address,
      abi: IMPL_ABI,
      functionName: "IMPL"
    });
    return impl as `0x${string}`;
  } catch {
    // IMPL() call failed, try EIP-1167 pattern
  }

  return findImplementationFromBytecode(client, address);
}

/**
 * Batch-resolves implementation addresses for multiple proxies in a single multicall.
 * Falls back to EIP-1167 bytecode check for any that don't support IMPL().
 */
export async function findImplementations(
  client: Client,
  addresses: `0x${string}`[]
): Promise<(`0x${string}` | null)[]> {
  if (addresses.length === 0) return [];

  const implResults = await client.multicall({
    contracts: addresses.map((address) => ({
      address,
      abi: IMPL_ABI,
      functionName: "IMPL" as const
    })),
    allowFailure: true
  });

  const results: (`0x${string}` | null)[] = new Array(addresses.length);
  const fallbackIndices: number[] = [];

  for (let i = 0; i < addresses.length; i++) {
    const r = implResults[i];
    if (r.status === "success") {
      results[i] = r.result as `0x${string}`;
    } else {
      fallbackIndices.push(i);
    }
  }

  if (fallbackIndices.length > 0) {
    await Promise.all(
      fallbackIndices.map(async (i) => {
        try {
          results[i] = await findImplementationFromBytecode(client, addresses[i]);
        } catch {
          results[i] = null;
        }
      })
    );
  }

  return results;
}

async function findImplementationFromBytecode(
  client: Client,
  address: `0x${string}`
): Promise<`0x${string}`> {
  // Check for EIP-1167 Minimal Proxy pattern
  const bytecode = await client.getCode({ address });
  if (bytecode) {
    const code = bytecode.slice(2).toLowerCase(); // Remove '0x' prefix

    // EIP-1167 pattern: prefix (10 bytes) + address (20 bytes) + suffix (15 bytes) = 45 bytes
    if (code.startsWith(EIP1167_PREFIX) && code.slice(50).startsWith(EIP1167_SUFFIX)) {
      // Extract address from bytes 10-29 (characters 20-59 in hex string)
      const implAddress = `0x${code.slice(20, 60)}`;
      return implAddress as `0x${string}`;
    }
  }
  throw new ImplementationNotFoundError(address);
}
