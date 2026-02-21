import type { NetworkName } from "@party-forever/contracts";

export const DATA_URI_JSON_BASE64_PREFIX = "data:application/json;base64,";
export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export const LARGE_PARTY_THRESHOLD = 500n;

export const VALID_NETWORKS = ["base", "mainnet", "zora"] as const;

export const NETWORK_OPTIONS: { value: NetworkName; label: string }[] = [
  { value: "base", label: "Base" },
  { value: "zora", label: "Zora" },
  { value: "mainnet", label: "Mainnet" }
];

export const NETWORK_ID_TO_NAME: Record<number, NetworkName> = {
  1: "mainnet",
  8453: "base",
  7777777: "zora"
};

export const NETWORK_NAME_TO_ID: Record<NetworkName, number> = {
  mainnet: 1,
  base: 8453,
  zora: 7777777
};
