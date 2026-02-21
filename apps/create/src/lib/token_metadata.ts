import { getClient } from "./client.ts";
import type { TokenPageNetwork } from "./constants.ts";

export interface TokenMetadataBasic {
  name: string;
  symbol: string;
  decimals: number;
  tokenAddress: string;
  totalSupplyWei?: bigint;
  tokenImage?: string;
}

const ERC20_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

export const fetchTokenMetadataFromChain = async (
  network: TokenPageNetwork,
  tokenAddress: `0x${string}`
): Promise<TokenMetadataBasic> => {
  const client = getClient(network);
  const [nameResult, symbolResult, decimalsResult, totalSupplyResult] = await client.multicall({
    contracts: [
      { address: tokenAddress, abi: ERC20_ABI, functionName: "name" as const },
      { address: tokenAddress, abi: ERC20_ABI, functionName: "symbol" as const },
      { address: tokenAddress, abi: ERC20_ABI, functionName: "decimals" as const },
      { address: tokenAddress, abi: ERC20_ABI, functionName: "totalSupply" as const }
    ],
    allowFailure: true
  });
  return {
    name: nameResult.status === "success" ? (nameResult.result as string) : "Unknown",
    symbol: symbolResult.status === "success" ? (symbolResult.result as string) : "???",
    decimals: decimalsResult.status === "success" ? Number(decimalsResult.result) : 18,
    tokenAddress,
    totalSupplyWei:
      totalSupplyResult.status === "success" ? (totalSupplyResult.result as bigint) : undefined
  };
};
