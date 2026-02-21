import { encodeFunctionData } from "viem";

import { erc20Abi } from "../abis/erc20_abi.ts";
import { type Client, getClientForNetworkName } from "../contract_utils.ts";
import type { NetworkName } from "../types.ts";

export class ERC20 {
  private client: Client;
  private address: `0x${string}`;

  constructor(networkName: NetworkName, address: `0x${string}`, client?: Client) {
    this.client = client ?? getClientForNetworkName(networkName);
    this.address = address;
  }

  encodeTransfer(to: `0x${string}`, amount: bigint): `0x${string}` {
    return encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer" as const,
      args: [to, amount]
    });
  }

  async fetchDecimals(): Promise<number> {
    const result = await this.client.readContract({
      address: this.address,
      abi: erc20Abi,
      functionName: "decimals" as const
    });
    return result as number;
  }

  async fetchNameAndSymbol(): Promise<{ name: string; symbol: string }> {
    const [name, symbol] = await this.client.multicall({
      contracts: [
        {
          address: this.address,
          abi: erc20Abi,
          functionName: "name" as const
        },
        {
          address: this.address,
          abi: erc20Abi,
          functionName: "symbol" as const
        }
      ],
      allowFailure: false
    });
    return { name: name as string, symbol: symbol as string };
  }

  async fetchBalance(owner: `0x${string}`): Promise<bigint> {
    const result = await this.client.readContract({
      address: this.address,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [owner]
    });
    return result as bigint;
  }
}
