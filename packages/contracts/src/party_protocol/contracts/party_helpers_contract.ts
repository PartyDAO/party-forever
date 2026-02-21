import type { PartyHelpersABI } from "../configs/party_helpers_contract_config.ts";
import { PARTY_HELPERS_CONTRACTS } from "../configs/party_helpers_contract_config.ts";
import { type Client, findContractAbi, getClientForNetworkName } from "../contract_utils.ts";
import type { NetworkName } from "../types.ts";

/**
 * Returns the latest PartyHelpers address for the given network
 * by taking the last config entry that has an address for that network.
 */
function getLatestAddress(networkName: NetworkName): `0x${string}` {
  for (let i = PARTY_HELPERS_CONTRACTS.length - 1; i >= 0; i--) {
    const addrs = PARTY_HELPERS_CONTRACTS[i].implementationAddresses[networkName];
    if (addrs && addrs.length > 0) {
      return addrs[addrs.length - 1] as `0x${string}`;
    }
  }
  throw new Error(`PartyHelpers not deployed on network: ${networkName}`);
}

/**
 * PartyHelpers is a Party Protocol helper contract that exposes view functions
 * such as getRageQuitWithdrawAmounts. Addresses are from Party Protocol deployments.
 */
export class PartyHelpers {
  private readonly client: Client;
  private readonly address: `0x${string}`;
  private readonly partyHelpersAbi: PartyHelpersABI;

  constructor(networkName: NetworkName, client?: Client) {
    this.client = client ?? getClientForNetworkName(networkName);
    this.address = getLatestAddress(networkName);
    this.partyHelpersAbi = findContractAbi(this.address, networkName, PARTY_HELPERS_CONTRACTS);
  }

  /**
   * Returns the withdraw amounts for rage quit for the given party, token IDs, and token addresses.
   * Call this on-chain to get exact amounts (avoids client-side rounding).
   * withdrawTokens order determines the order of the returned amounts.
   */
  async getRageQuitWithdrawAmounts(
    partyAddress: `0x${string}`,
    tokenIds: bigint[],
    withdrawTokens: `0x${string}`[]
  ): Promise<bigint[]> {
    if (withdrawTokens.length === 0) return [];
    const result = await this.client.readContract({
      address: this.address,
      abi: this.partyHelpersAbi.abi,
      functionName: "getRageQuitWithdrawAmounts" as const,
      args: [partyAddress, tokenIds, withdrawTokens]
    });
    return result as bigint[];
  }
}
