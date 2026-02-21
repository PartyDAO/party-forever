import { seaportAbi } from "../abis/seaport_abi.ts";
import type { Client } from "../contract_utils.ts";
import type { SeaportOrderStatus } from "../types.ts";

// Seaport 1.6 uses a deterministic address that is the same across all networks
export const SEAPORT_ADDRESS: `0x${string}` = "0x0000000000000068f116a894984e2db1123eb395";

export class Seaport {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async getDomainHashPrefix(): Promise<`0x${string}`> {
    const [, domainSeparator] = await this.client.readContract({
      address: SEAPORT_ADDRESS,
      abi: seaportAbi,
      functionName: "information" as const
    });
    // Return first 4 bytes (0x + 8 hex chars) of the domain separator
    return `0x${(domainSeparator as `0x${string}`).slice(2, 10)}` as `0x${string}`;
  }

  async getOrderStatus(orderHash: `0x${string}`): Promise<SeaportOrderStatus> {
    const [isValidated, isCancelled, totalFilled, totalSize] = await this.client.readContract({
      address: SEAPORT_ADDRESS,
      abi: seaportAbi,
      functionName: "getOrderStatus" as const,
      args: [orderHash]
    });
    return { isValidated, isCancelled, totalFilled, totalSize };
  }
}
