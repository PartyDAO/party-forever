import { encodeFunctionData } from "viem";

import type { Client } from "../party_protocol/contract_utils.ts";
import type { PartyBidAbi } from "./index.ts";
import { partyBidV1Abi } from "./abis/party_bid_v1.ts";
import { partyBidV2Abi } from "./abis/party_bid_v2.ts";
import { partyBidV3Abi } from "./abis/party_bid_v3.ts";
import { getContractVersion } from "./utils.ts";

export enum PartyBidStatus {
  Active = 0,
  Won = 1,
  Lost = 2
}

export interface PartyBidContributedEvent {
  contributor: `0x${string}`;
  amount: bigint;
  previousTotalContributedToParty: bigint;
  totalFromContributor: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

export interface PartyBidClaimedEvent {
  contributor: `0x${string}`;
  totalContributed: bigint;
  excessContribution: bigint;
  tokenAmount: bigint;
  transactionHash: `0x${string}`;
}

export class PartyBid {
  private client: Client;
  private partyBidAddress: `0x${string}`;
  private partyBidAbi: PartyBidAbi;
  private version: string;

  constructor(abi: PartyBidAbi, partyBidAddress: `0x${string}`, client: Client, version: string) {
    this.client = client;
    this.partyBidAddress = partyBidAddress;
    this.partyBidAbi = abi;
    this.version = version;
  }

  static async getClaimedStatuses(
    partyAddresses: `0x${string}`[],
    contributor: `0x${string}`,
    client: Client
  ): Promise<Map<`0x${string}`, boolean>> {
    if (partyAddresses.length === 0) return new Map();

    const BATCH_SIZE = 25;
    const map = new Map<`0x${string}`, boolean>();

    for (let offset = 0; offset < partyAddresses.length; offset += BATCH_SIZE) {
      const batch = partyAddresses.slice(offset, offset + BATCH_SIZE);
      const results = await client.multicall({
        contracts: batch.map((address) => ({
          address,
          abi: partyBidV1Abi,
          functionName: "claimed" as const,
          args: [contributor]
        }))
      });

      for (let i = 0; i < batch.length; i++) {
        const result = results[i];
        map.set(batch[i], result.status === "success" ? (result.result as boolean) : false);
      }
    }

    return map;
  }

  static async create(partyBidAddress: `0x${string}`, client: Client): Promise<PartyBid> {
    const version = await getContractVersion(client, partyBidAddress);
    const abi = PartyBid.abiForVersion(version);
    return new PartyBid(abi, partyBidAddress, client, version);
  }

  async getName(): Promise<string> {
    const result = await this.client.readContract({
      address: this.partyBidAddress,
      abi: this.partyBidAbi,
      functionName: "name" as const
    });
    return result as string;
  }

  async getContributions(): Promise<PartyBidContributedEvent[]> {
    const logs = await this.client.getContractEvents({
      address: this.partyBidAddress,
      abi: this.partyBidAbi,
      eventName: "Contributed" as const,
      fromBlock: 0n,
      toBlock: "latest"
    });

    const contributions = logs.map((log) => ({
      contributor: log.args.contributor!,
      amount: log.args.amount!,
      previousTotalContributedToParty: log.args.previousTotalContributedToParty!,
      totalFromContributor: log.args.totalFromContributor!,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash
    }));

    return contributions.sort((a, b) => Number(b.blockNumber - a.blockNumber));
  }

  async getStatus(): Promise<PartyBidStatus> {
    const result = await this.client.readContract({
      address: this.partyBidAddress,
      abi: this.partyBidAbi,
      functionName: "partyStatus" as const
    });
    return result as PartyBidStatus;
  }

  async getNftInfo(): Promise<{ nftContract: `0x${string}`; tokenId: bigint }> {
    const [nftContract, tokenId] = await this.client.multicall({
      contracts: [
        {
          address: this.partyBidAddress,
          abi: this.partyBidAbi,
          functionName: "nftContract" as const
        },
        {
          address: this.partyBidAddress,
          abi: this.partyBidAbi,
          functionName: "tokenId" as const
        }
      ],
      allowFailure: false
    });
    return {
      nftContract: nftContract as `0x${string}`,
      tokenId: tokenId as bigint
    };
  }

  async getClaimed(contributor: `0x${string}`): Promise<boolean> {
    const result = await this.client.readContract({
      address: this.partyBidAddress,
      abi: this.partyBidAbi,
      functionName: "claimed" as const,
      args: [contributor]
    });
    return result as boolean;
  }

  async getClaimEvent(contributor: `0x${string}`): Promise<PartyBidClaimedEvent | null> {
    const logs = await this.client.getContractEvents({
      address: this.partyBidAddress,
      abi: this.partyBidAbi,
      eventName: "Claimed" as const,
      args: { contributor },
      fromBlock: 0n,
      toBlock: "latest"
    });
    if (logs.length === 0) return null;
    const log = logs[0];
    return {
      contributor: log.args.contributor!,
      totalContributed: log.args.totalContributed!,
      excessContribution: log.args.excessContribution!,
      tokenAmount: log.args.tokenAmount!,
      transactionHash: log.transactionHash
    };
  }

  async getTotalContributed(contributor: `0x${string}`): Promise<bigint> {
    const result = await this.client.readContract({
      address: this.partyBidAddress,
      abi: this.partyBidAbi,
      functionName: "totalContributed" as const,
      args: [contributor]
    });
    return result as bigint;
  }

  async getTokenVault(): Promise<`0x${string}`> {
    const result = await this.client.readContract({
      address: this.partyBidAddress,
      abi: this.partyBidAbi,
      functionName: "tokenVault" as const
    });
    return result as `0x${string}`;
  }

  generateClaimTx(contributor: `0x${string}`): { to: `0x${string}`; data: `0x${string}` } {
    const data = encodeFunctionData({
      abi: this.partyBidAbi,
      functionName: "claim" as const,
      args: [contributor]
    });
    return { to: this.partyBidAddress, data };
  }

  generateExpireTx(): { to: `0x${string}`; data: `0x${string}` } {
    const data =
      this.version === "1"
        ? encodeFunctionData({
            abi: partyBidV1Abi,
            functionName: "expire" as const
          })
        : encodeFunctionData({
            abi: this.partyBidAbi,
            functionName: "finalize" as const
          });
    return { to: this.partyBidAddress, data };
  }

  private static abiForVersion(version: string): PartyBidAbi {
    switch (version) {
      case "1":
        return partyBidV1Abi;
      case "2":
        return partyBidV2Abi;
      case "3":
        return partyBidV3Abi;
      default:
        throw new Error(`Unsupported PartyBid version: ${version}`);
    }
  }
}
