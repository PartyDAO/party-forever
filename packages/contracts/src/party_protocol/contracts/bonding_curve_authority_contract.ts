import { encodeFunctionData } from "viem";

import type { BondingCurveAuthorityABI } from "../configs/bonding_curve_authority_contract_config.ts";
import { BONDING_CURVE_AUTHORITY_CONTRACTS } from "../configs/bonding_curve_authority_contract_config.ts";
import { type Client, getClientForNetworkName } from "../contract_utils.ts";
import type { NetworkName, TxData } from "../types.ts";

export class BondingCurveAuthority {
  private client: Client;
  private authorityAddress: `0x${string}`;
  private bondingCurveAuthorityAbi: BondingCurveAuthorityABI;

  constructor(
    bondingCurveAuthorityAbi: BondingCurveAuthorityABI,
    authorityAddress: `0x${string}`,
    client: Client
  ) {
    this.bondingCurveAuthorityAbi = bondingCurveAuthorityAbi;
    this.authorityAddress = authorityAddress;
    this.client = client;
  }

  static getKnownAddresses(networkName: NetworkName): `0x${string}`[] {
    const addresses: `0x${string}`[] = [];
    for (const config of BONDING_CURVE_AUTHORITY_CONTRACTS) {
      const networkAddresses = config.implementationAddresses[networkName];
      if (networkAddresses) {
        addresses.push(...networkAddresses.map((a) => a as `0x${string}`));
      }
    }
    return addresses;
  }

  static async create(
    networkName: NetworkName,
    authorityAddress: `0x${string}`,
    client?: Client
  ): Promise<BondingCurveAuthority> {
    const resolvedClient = client ?? getClientForNetworkName(networkName);
    const abi = BONDING_CURVE_AUTHORITY_CONTRACTS[0].abi;
    return new BondingCurveAuthority(abi, authorityAddress, resolvedClient);
  }

  /** Price in wei to buy `quantity` memberships from the party. */
  async getPriceToBuy(partyAddress: `0x${string}`, quantity: bigint): Promise<bigint> {
    return this.client.readContract({
      address: this.authorityAddress,
      abi: this.bondingCurveAuthorityAbi.abi,
      functionName: "getPriceToBuy" as const,
      args: [partyAddress, quantity]
    });
  }

  /** Proceeds in wei from selling `quantity` memberships. */
  async getSaleProceeds(partyAddress: `0x${string}`, quantity: bigint): Promise<bigint> {
    return this.client.readContract({
      address: this.authorityAddress,
      abi: this.bondingCurveAuthorityAbi.abi,
      functionName: "getSaleProceeds" as const,
      args: [partyAddress, quantity]
    });
  }

  /** Transaction data to buy memberships. Caller must send `valueWei` as msg.value. */
  getBuyPartyCardsTxData(
    partyAddress: `0x${string}`,
    count: bigint,
    delegate: `0x${string}`,
    valueWei: bigint
  ): TxData {
    const data = encodeFunctionData({
      abi: this.bondingCurveAuthorityAbi.abi,
      functionName: "buyPartyCards" as const,
      args: [partyAddress, count, delegate]
    });
    return {
      to: this.authorityAddress,
      data,
      value: valueWei
    };
  }

  /** Transaction data to sell memberships. */
  getSellPartyCardsTxData(
    partyAddress: `0x${string}`,
    tokenIds: bigint[],
    minProceeds: bigint
  ): TxData {
    const data = encodeFunctionData({
      abi: this.bondingCurveAuthorityAbi.abi,
      functionName: "sellPartyCards" as const,
      args: [partyAddress, tokenIds, minProceeds]
    });
    return {
      to: this.authorityAddress,
      data
    };
  }
}
