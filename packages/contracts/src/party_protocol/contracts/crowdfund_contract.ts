import { encodeFunctionData } from "viem";
import { AUCTION_CROWDFUND_CONTRACTS } from "../configs/auction_crowdfund_contract_config.ts";
import { BUY_CROWDFUND_CONTRACTS } from "../configs/buy_crowdfund_contract_config.ts";
import { COLLECTION_BATCH_BUY_CROWDFUND_CONTRACTS } from "../configs/collection_batch_buy_crowdfund_contract_config.ts";
import { COLLECTION_BUY_CROWDFUND_CONTRACTS } from "../configs/collection_buy_crowdfund_contract_config.ts";
import { ERC20LAUNCH_CROWDFUND_CONTRACTS } from "../configs/erc20launch_crowdfund_contract_config.ts";
import { INITIAL_ETHCROWDFUND_CONTRACTS } from "../configs/initial_ethcrowdfund_contract_config.ts";
import {
  type Client,
  type ContractConfig,
  findContractAbi,
  getClientForNetworkName
} from "../contract_utils.ts";
import { findImplementation, findImplementations } from "../find_implementation.ts";
import type { CrowdfundAbi, NetworkName, TxData } from "../types.ts";

const ALL_CROWDFUND_CONTRACTS: ContractConfig<CrowdfundAbi>[] = [
  ...AUCTION_CROWDFUND_CONTRACTS,
  ...BUY_CROWDFUND_CONTRACTS,
  ...COLLECTION_BATCH_BUY_CROWDFUND_CONTRACTS,
  ...COLLECTION_BUY_CROWDFUND_CONTRACTS,
  ...ERC20LAUNCH_CROWDFUND_CONTRACTS,
  ...INITIAL_ETHCROWDFUND_CONTRACTS
];

export enum CrowdfundLifecycle {
  Invalid = 0,
  Active = 1,
  Expired = 2,
  Busy = 3,
  Lost = 4,
  Won = 5,
  Finalized = 6
}

export function translateCrowdfundLifecycle(lifecycle: CrowdfundLifecycle): string {
  return CrowdfundLifecycle[lifecycle];
}

export interface ContributedEvent {
  contributor: `0x${string}`;
  amount: bigint;
  delegate: `0x${string}`;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

export class Crowdfund {
  private client: Client;
  private crowdfundAddress: `0x${string}`;
  private crowdfundAbi: CrowdfundAbi;

  constructor(abi: CrowdfundAbi, crowdfundAddress: `0x${string}`, client: Client) {
    this.client = client;
    this.crowdfundAddress = crowdfundAddress;
    this.crowdfundAbi = abi;
  }

  /**
   * Creates a Crowdfund instance by automatically discovering the implementation address.
   */
  static async create(
    networkName: NetworkName,
    crowdfundAddress: `0x${string}`,
    client?: Client
  ): Promise<Crowdfund> {
    const resolvedClient = client ?? getClientForNetworkName(networkName);
    const implementationAddress = await findImplementation(resolvedClient, crowdfundAddress);
    const abi = findContractAbi(implementationAddress, networkName, ALL_CROWDFUND_CONTRACTS);
    return new Crowdfund(abi, crowdfundAddress, resolvedClient);
  }

  /**
   * Batch-creates multiple Crowdfund instances on the same network using a single
   * multicall to resolve all implementation addresses.
   * Returns null for any address whose implementation can't be resolved.
   */
  static async createMulti(
    networkName: NetworkName,
    crowdfundAddresses: `0x${string}`[],
    client?: Client
  ): Promise<(Crowdfund | null)[]> {
    if (crowdfundAddresses.length === 0) return [];
    const resolvedClient = client ?? getClientForNetworkName(networkName);
    const implAddresses = await findImplementations(resolvedClient, crowdfundAddresses);
    return crowdfundAddresses.map((address, i) => {
      const impl = implAddresses[i];
      if (!impl) return null;
      try {
        const abi = findContractAbi(impl, networkName, ALL_CROWDFUND_CONTRACTS);
        return new Crowdfund(abi, address, resolvedClient);
      } catch {
        return null;
      }
    });
  }

  async getCrowdfundLifecycle(): Promise<string> {
    const result = await this.client.readContract({
      address: this.crowdfundAddress,
      abi: this.crowdfundAbi.abi,
      functionName: "getCrowdfundLifecycle" as const
    });
    return translateCrowdfundLifecycle(result as CrowdfundLifecycle);
  }

  async getName(): Promise<string> {
    const result = await this.client.readContract({
      address: this.crowdfundAddress,
      abi: this.crowdfundAbi.abi,
      functionName: "name" as const
    });
    return result as string;
  }

  async getParty(): Promise<`0x${string}`> {
    const result = await this.client.readContract({
      address: this.crowdfundAddress,
      abi: this.crowdfundAbi.abi,
      functionName: "party" as const
    });
    return result as `0x${string}`;
  }

  async getTotalContributions(): Promise<bigint> {
    const result = await this.client.readContract({
      address: this.crowdfundAddress,
      abi: this.crowdfundAbi.abi,
      functionName: "totalContributions" as const
    });
    return result as bigint;
  }

  async getExpiry(): Promise<number> {
    const result = await this.client.readContract({
      address: this.crowdfundAddress,
      abi: this.crowdfundAbi.abi,
      functionName: "expiry" as const
    });
    return result as number;
  }

  async getContributions(): Promise<ContributedEvent[]> {
    const logs = await this.client.getContractEvents({
      address: this.crowdfundAddress,
      abi: this.crowdfundAbi.abi,
      eventName: "Contributed" as const,
      fromBlock: 0n,
      toBlock: "latest"
    });

    const contributions = logs.map((log) => ({
      contributor: log.args.contributor!,
      amount: log.args.amount!,
      delegate: log.args.delegate!,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash
    }));

    return contributions.sort((a, b) => Number(b.blockNumber - a.blockNumber));
  }

  async getSummary(): Promise<{
    name: string;
    lifecycle: string;
    partyAddress: `0x${string}`;
    totalContributions: bigint;
    expiry: number;
  }> {
    const [
      nameResult,
      rawLifecycleResult,
      partyAddressResult,
      totalContributionsResult,
      expiryResult
    ] = await this.client.multicall({
      contracts: [
        {
          address: this.crowdfundAddress,
          abi: this.crowdfundAbi.abi,
          functionName: "name" as const
        },
        {
          address: this.crowdfundAddress,
          abi: this.crowdfundAbi.abi,
          functionName: "getCrowdfundLifecycle" as const
        },
        {
          address: this.crowdfundAddress,
          abi: this.crowdfundAbi.abi,
          functionName: "party" as const
        },
        {
          address: this.crowdfundAddress,
          abi: this.crowdfundAbi.abi,
          functionName: "totalContributions" as const
        },
        {
          address: this.crowdfundAddress,
          abi: this.crowdfundAbi.abi,
          functionName: "expiry" as const
        }
      ],
      // Some historical crowdfund implementations do not expose `name()`.
      // We tolerate that and fall back to "Unnamed", but keep the rest required.
      allowFailure: true
    });

    if (
      rawLifecycleResult.status !== "success" ||
      partyAddressResult.status !== "success" ||
      totalContributionsResult.status !== "success" ||
      expiryResult.status !== "success"
    ) {
      throw new Error("Failed to load required crowdfund summary fields");
    }

    return {
      name: nameResult.status === "success" ? (nameResult.result as string) : "Unnamed",
      lifecycle: translateCrowdfundLifecycle(rawLifecycleResult.result as CrowdfundLifecycle),
      partyAddress: partyAddressResult.result as `0x${string}`,
      totalContributions: totalContributionsResult.result as bigint,
      expiry: expiryResult.result as number
    };
  }

  async getContributorSummary(contributor: `0x${string}`): Promise<{
    ethContributed: bigint;
    ethUsed: bigint;
    ethOwed: bigint;
    votingPower: bigint;
    contributionCardBalance: bigint;
  }> {
    const [contributorInfo, contributionCardBalance] = await this.client.multicall({
      contracts: [
        {
          address: this.crowdfundAddress,
          abi: this.crowdfundAbi.abi,
          functionName: "getContributorInfo" as const,
          args: [contributor]
        },
        {
          address: this.crowdfundAddress,
          abi: this.crowdfundAbi.abi,
          functionName: "balanceOf" as const,
          args: [contributor]
        }
      ],
      allowFailure: false
    });

    const [ethContributed, ethUsed, ethOwed, votingPower] = contributorInfo as [
      bigint,
      bigint,
      bigint,
      bigint
    ];

    return {
      ethContributed,
      ethUsed,
      ethOwed,
      votingPower,
      contributionCardBalance: contributionCardBalance as bigint
    };
  }

  async getContributorInfo(contributor: `0x${string}`): Promise<{
    ethContributed: bigint;
    ethUsed: bigint;
    ethOwed: bigint;
    votingPower: bigint;
  }> {
    const result = await this.client.readContract({
      address: this.crowdfundAddress,
      abi: this.crowdfundAbi.abi,
      functionName: "getContributorInfo" as const,
      args: [contributor]
    });
    const [ethContributed, ethUsed, ethOwed, votingPower] = result as [
      bigint,
      bigint,
      bigint,
      bigint
    ];
    return { ethContributed, ethUsed, ethOwed, votingPower };
  }

  async getContributionCardBalance(owner: `0x${string}`): Promise<bigint> {
    return await this.client.readContract({
      address: this.crowdfundAddress,
      abi: this.crowdfundAbi.abi,
      functionName: "balanceOf" as const,
      args: [owner]
    });
  }

  /**
   * Returns transaction data to call activateOrRefund for a contributor.
   * When the crowdfund has Won, contributors can activate to receive party cards or refund.
   */
  getActivateOrRefundTxData(contributor: `0x${string}`): TxData {
    const data = encodeFunctionData({
      abi: this.crowdfundAbi.abi,
      functionName: "activateOrRefund" as const,
      args: [contributor]
    });
    return { to: this.crowdfundAddress, data };
  }
}
