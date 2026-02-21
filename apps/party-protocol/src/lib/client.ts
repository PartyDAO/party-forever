import type { NetworkName } from "@party-forever/contracts";
import { countedHttp, getRpcUrl } from "@party-forever/ui";
import { createPublicClient } from "viem";
import { base, mainnet, zora } from "viem/chains";

const chains = { mainnet, base, zora } as const;

export function getClient(networkName: NetworkName) {
  const chain = chains[networkName];
  const rpcUrl = getRpcUrl(networkName);

  if (!rpcUrl) {
    throw new Error(`Missing RPC URL for ${networkName}`);
  }

  return createPublicClient({
    chain,
    transport: countedHttp(rpcUrl)
  });
}

export function getChainIdForNetwork(networkName: NetworkName): number {
  return chains[networkName].id;
}
