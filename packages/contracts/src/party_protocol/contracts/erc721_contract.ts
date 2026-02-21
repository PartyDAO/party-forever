import { encodeFunctionData } from "viem";

import { erc721Abi } from "../abis/erc721_abi.ts";
import { type Client, getClientForNetworkName } from "../contract_utils.ts";
import type { NetworkName } from "../types.ts";

export class ERC721 {
  private client: Client;
  private address: `0x${string}`;

  constructor(networkName: NetworkName, address: `0x${string}`, client?: Client) {
    this.client = client ?? getClientForNetworkName(networkName);
    this.address = address;
  }

  encodeTransferFrom(from: `0x${string}`, to: `0x${string}`, tokenId: bigint): `0x${string}` {
    return encodeFunctionData({
      abi: erc721Abi,
      functionName: "transferFrom" as const,
      args: [from, to, tokenId]
    });
  }

  async fetchOwnerOf(tokenId: bigint): Promise<`0x${string}`> {
    const result = await this.client.readContract({
      address: this.address,
      abi: erc721Abi,
      functionName: "ownerOf" as const,
      args: [tokenId]
    });
    return result as `0x${string}`;
  }

  async fetchBalanceOf(owner: `0x${string}`): Promise<bigint> {
    const result = await this.client.readContract({
      address: this.address,
      abi: erc721Abi,
      functionName: "balanceOf" as const,
      args: [owner]
    });
    return result as bigint;
  }

  async fetchName(): Promise<string> {
    const result = await this.client.readContract({
      address: this.address,
      abi: erc721Abi,
      functionName: "name" as const
    });
    return result as string;
  }

  async fetchSymbol(): Promise<string> {
    const result = await this.client.readContract({
      address: this.address,
      abi: erc721Abi,
      functionName: "symbol" as const
    });
    return result as string;
  }

  async fetchTokenURI(tokenId: bigint): Promise<string> {
    const result = await this.client.readContract({
      address: this.address,
      abi: erc721Abi,
      functionName: "tokenURI" as const,
      args: [tokenId]
    });
    return result as string;
  }
}
