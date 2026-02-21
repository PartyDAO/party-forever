import { encodeFunctionData } from "viem";

import { erc20Abi } from "../abis/erc20_abi.ts";
import type { TokenDistributorABI } from "../configs/token_distributor_contract_config.ts";
import { TOKEN_DISTRIBUTOR_CONTRACTS } from "../configs/token_distributor_contract_config.ts";
import { type Client, getClientForNetworkName } from "../contract_utils.ts";
import type { NetworkName, TxData } from "../types.ts";
import { type Distribution, DistributionTokenType, type RawDistributionEvent } from "../types.ts";

export class TokenDistributor {
  private client: Client;
  private tokenDistributorAbi: TokenDistributorABI;
  private tokenDistributorAddresses: `0x${string}`[];

  constructor(
    tokenDistributorAbi: TokenDistributorABI,
    tokenDistributorAddresses: `0x${string}`[],
    client: Client
  ) {
    this.client = client;
    this.tokenDistributorAbi = tokenDistributorAbi;
    this.tokenDistributorAddresses = tokenDistributorAddresses;
  }

  static create(networkName: NetworkName, client?: Client): TokenDistributor {
    const resolvedClient = client ?? getClientForNetworkName(networkName);
    // Get all TokenDistributor addresses for this network from all configs
    const addresses: `0x${string}`[] = [];
    for (const config of TOKEN_DISTRIBUTOR_CONTRACTS) {
      const networkAddresses = config.implementationAddresses[networkName];
      if (networkAddresses) {
        addresses.push(...networkAddresses.map((a) => a as `0x${string}`));
      }
    }
    // Use the first config's ABI (they're functionally compatible for events)
    const abi = TOKEN_DISTRIBUTOR_CONTRACTS[0].abi;
    return new TokenDistributor(abi, addresses, resolvedClient);
  }

  async fetchDistributions(partyAddress: `0x${string}`): Promise<Distribution[]> {
    // Fetch DistributionCreated events from all TokenDistributor addresses
    const allLogs = await Promise.all(
      this.tokenDistributorAddresses.map((address) =>
        this.client
          .getContractEvents({
            address,
            abi: this.tokenDistributorAbi.abi,
            eventName: "DistributionCreated" as const,
            args: { party: partyAddress },
            fromBlock: 0n,
            toBlock: "latest"
          })
          .then((logs) => logs.map((log) => ({ ...log, distributorAddress: address })))
      )
    );

    const logs = allLogs.flat();

    // Filter to Native (0) and ERC20 (1) and extract info
    const rawEvents: RawDistributionEvent[] = logs
      .filter((log) => log.args.info?.tokenType === 0 || log.args.info?.tokenType === 1)
      .map(({ args: { info }, distributorAddress, blockNumber, transactionHash }) => ({
        ...info!,
        distributorAddress,
        blockNumber: blockNumber!,
        transactionHash: transactionHash!
      }));

    return this.rawEventsToDistributions(rawEvents);
  }

  async fetchDistributionsForDistributor(
    distributorAddress: `0x${string}`,
    partyAddress: `0x${string}`
  ): Promise<Distribution[]> {
    const logs = await this.client.getContractEvents({
      address: distributorAddress,
      abi: this.tokenDistributorAbi.abi,
      eventName: "DistributionCreated" as const,
      args: { party: partyAddress },
      fromBlock: 0n,
      toBlock: "latest"
    });

    const rawEvents: RawDistributionEvent[] = logs
      .filter((log) => log.args.info?.tokenType === 0 || log.args.info?.tokenType === 1)
      .map(({ args: { info }, blockNumber, transactionHash }) => ({
        ...info!,
        distributorAddress,
        blockNumber: blockNumber!,
        transactionHash: transactionHash!
      }));

    return this.rawEventsToDistributions(rawEvents);
  }

  async hasPartyTokenIdClaimed(
    distributorAddress: `0x${string}`,
    partyAddress: `0x${string}`,
    partyTokenId: bigint,
    distributionId: bigint
  ): Promise<boolean> {
    const result = await this.client.readContract({
      address: distributorAddress,
      abi: this.tokenDistributorAbi.abi,
      functionName: "hasPartyTokenIdClaimed" as const,
      args: [partyAddress, partyTokenId, distributionId]
    });
    return result as boolean;
  }

  async havePartyTokenIdsClaimed(
    distributorAddress: `0x${string}`,
    partyAddress: `0x${string}`,
    partyTokenIds: bigint[],
    distributionId: bigint
  ): Promise<Map<bigint, boolean>> {
    const results = await this.client.multicall({
      contracts: partyTokenIds.map((tokenId) => ({
        address: distributorAddress,
        abi: this.tokenDistributorAbi.abi,
        functionName: "hasPartyTokenIdClaimed" as const,
        args: [partyAddress, tokenId, distributionId]
      }))
    });

    const claimedMap = new Map<bigint, boolean>();
    for (let i = 0; i < partyTokenIds.length; i++) {
      const result = results[i];
      claimedMap.set(
        partyTokenIds[i],
        result.status === "success" ? (result.result as boolean) : false
      );
    }
    return claimedMap;
  }

  async getRemainingMemberSupply(
    distributorAddress: `0x${string}`,
    partyAddress: `0x${string}`,
    distributionId: bigint
  ): Promise<bigint> {
    const result = await this.client.readContract({
      address: distributorAddress,
      abi: this.tokenDistributorAbi.abi,
      functionName: "getRemainingMemberSupply" as const,
      args: [partyAddress, distributionId]
    });
    return result as bigint;
  }

  async getDistributionByIdForParty(
    distributorAddress: `0x${string}`,
    partyAddress: `0x${string}`,
    distributionId: bigint
  ): Promise<Distribution | null> {
    const logs = await this.client.getContractEvents({
      address: distributorAddress,
      abi: this.tokenDistributorAbi.abi,
      eventName: "DistributionCreated" as const,
      args: { party: partyAddress },
      fromBlock: 0n,
      toBlock: "latest"
    });

    const matchingLog = logs.find((log) => log.args.info?.distributionId === distributionId);

    if (!matchingLog || !matchingLog.args.info) {
      return null;
    }

    const info = matchingLog.args.info;
    if (info.tokenType !== 0 && info.tokenType !== 1) {
      return null;
    }

    const rawEvent: RawDistributionEvent = {
      ...info,
      distributorAddress,
      blockNumber: matchingLog.blockNumber!,
      transactionHash: matchingLog.transactionHash!
    };

    const distributions = await this.rawEventsToDistributions([rawEvent]);
    return distributions[0] ?? null;
  }

  async claimTx(
    distributorAddress: `0x${string}`,
    partyAddress: `0x${string}`,
    distributionId: bigint,
    partyTokenId: bigint
  ): Promise<TxData> {
    const logs = await this.client.getContractEvents({
      address: distributorAddress,
      abi: this.tokenDistributorAbi.abi,
      eventName: "DistributionCreated" as const,
      args: { party: partyAddress },
      fromBlock: 0n,
      toBlock: "latest"
    });

    const matchingLog = logs.find((log) => log.args.info?.distributionId === distributionId);

    if (!matchingLog || !matchingLog.args.info) {
      throw new Error(
        `Distribution ${distributionId} not found for party ${partyAddress} on distributor ${distributorAddress}`
      );
    }

    const data = encodeFunctionData({
      abi: this.tokenDistributorAbi.abi,
      functionName: "claim" as const,
      args: [matchingLog.args.info, partyTokenId]
    });

    return { to: distributorAddress, data };
  }

  private async rawEventsToDistributions(
    rawEvents: RawDistributionEvent[]
  ): Promise<Distribution[]> {
    const tokenInfoMap = await this.fetchTokenInfo(rawEvents);

    return rawEvents.map((event): Distribution => {
      const { tokenType, token, ...base } = event;
      if (tokenType === 0) {
        return { tokenType: DistributionTokenType.Native, ...base };
      }
      const tokenInfo = tokenInfoMap.get(token);
      return {
        tokenType: DistributionTokenType.ERC20,
        ...base,
        tokenAddress: token,
        tokenName: tokenInfo?.name ?? "Unknown",
        tokenSymbol: tokenInfo?.symbol ?? "???",
        tokenDecimals: tokenInfo?.decimals ?? 18
      };
    });
  }

  private async fetchTokenInfo<T extends { tokenType: number; token: `0x${string}` }>(
    logs: T[]
  ): Promise<Map<`0x${string}`, { name: string; symbol: string; decimals: number }>> {
    const erc20TokenAddresses = [
      ...new Set(logs.filter((log) => log.tokenType === 1).map((log) => log.token))
    ];

    const tokenInfoMap = new Map<
      `0x${string}`,
      { name: string; symbol: string; decimals: number }
    >();
    if (erc20TokenAddresses.length === 0) {
      return tokenInfoMap;
    }

    const entries = await Promise.all(
      erc20TokenAddresses.map(async (address) => {
        const [nameResult, symbolResult, decimalsResult] = await this.client.multicall({
          contracts: [
            { address, abi: erc20Abi, functionName: "name" as const },
            { address, abi: erc20Abi, functionName: "symbol" as const },
            { address, abi: erc20Abi, functionName: "decimals" as const }
          ],
          allowFailure: true
        });
        return [
          address,
          {
            name: nameResult.status === "success" ? (nameResult.result as string) : "Unknown",
            symbol: symbolResult.status === "success" ? (symbolResult.result as string) : "???",
            decimals: decimalsResult.status === "success" ? (decimalsResult.result as number) : 18
          }
        ] as const;
      })
    );

    for (const [address, info] of entries) {
      tokenInfoMap.set(address, info);
    }
    return tokenInfoMap;
  }
}
