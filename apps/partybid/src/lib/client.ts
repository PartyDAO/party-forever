import { countedHttp, getRpcUrl } from "@party-forever/ui";
import { createPublicClient } from "viem";
import { mainnet } from "viem/chains";

export const getClient = () => {
  const rpcUrl = getRpcUrl("mainnet");
  return createPublicClient({
    chain: mainnet,
    transport: countedHttp(rpcUrl)
  });
};
