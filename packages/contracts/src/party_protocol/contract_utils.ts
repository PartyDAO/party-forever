import { createPublicClient, http } from "viem";
import { base, mainnet, zora } from "viem/chains";

import { ContractABINotFoundError } from "./exceptions.ts";
import type { NetworkName } from "./types.ts";

export interface ContractConfig<T> {
  abi: T;
  implementationAddresses: Partial<Record<NetworkName, string[]>>;
}

export function findContractAbi<T>(
  implementationAddress: string,
  networkName: NetworkName,
  configs: ContractConfig<T>[]
): T {
  const normalizedAddress = implementationAddress.toLowerCase();
  for (const config of configs) {
    const addresses = config.implementationAddresses[networkName];
    if (addresses?.includes(normalizedAddress)) {
      return config.abi;
    }
  }
  throw new ContractABINotFoundError(implementationAddress);
}

function getNetworkConfig(networkName: NetworkName) {
  const configs = {
    mainnet: { chain: mainnet, rpcEnvVar: "VITE_RPC_URL_MAINNET" },
    base: { chain: base, rpcEnvVar: "VITE_RPC_URL_BASE" },
    zora: { chain: zora, rpcEnvVar: "VITE_RPC_URL_ZORA" }
  } as const;

  return configs[networkName];
}

export type Client = ReturnType<typeof getClientForNetworkName>;

export function getClientForNetworkName(networkName: NetworkName) {
  const { chain, rpcEnvVar } = getNetworkConfig(networkName);
  const rpcUrl = process.env[rpcEnvVar];

  if (!rpcUrl) {
    throw new Error(`Missing environment variable: ${rpcEnvVar}`);
  }

  return createPublicClient({
    chain,
    transport: http(rpcUrl)
  });
}
