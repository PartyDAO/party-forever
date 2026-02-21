import type { NetworkName } from "./types.ts";

/**
 * Party Protocol Globals contract addresses (canonical per network).
 * Used to read the latest proposal engine implementation (GLOBAL_PROPOSAL_ENGINE_IMPL_NUM).
 */
export const GLOBALS_ADDRESSES: Record<NetworkName, `0x${string}`> = {
  base: "0xcEDe25DF327bD1619Fe25CDa2292e14edAC30717" as `0x${string}`,
  mainnet: "0x1ca20040ce6ad406bc2a6c89976388829e7fbade" as `0x${string}`,
  zora: "0x7d592f8A5C09baD7bb7dC060d2c0f515253972BE" as `0x${string}`
};

/** LibGlobals.GLOBAL_PROPOSAL_ENGINE_IMPL */
export const GLOBAL_PROPOSAL_ENGINE_IMPL_NUM = 2;

/** ERC-20 sentinel address representing native ETH in Party Protocol. */
export const ETH_SENTINEL_ADDRESS: `0x${string}` = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
