import { countedHttp, getRpcUrl } from "@party-forever/ui";
import { createPublicClient } from "viem";
import { base } from "viem/chains";
import type { Chain } from "viem";

import type { TokenPageNetwork } from "./constants.ts";
import { CHAIN_ID } from "./constants.ts";

const chainByNetwork: Record<TokenPageNetwork, Chain> = {
  base
};

export const getClient = (network: TokenPageNetwork) => {
  const chain = chainByNetwork[network];
  const rpcUrl = getRpcUrl(network);
  return createPublicClient({
    chain,
    transport: countedHttp(rpcUrl)
  });
};

export const getChainId = (network: TokenPageNetwork): number => CHAIN_ID[network];
