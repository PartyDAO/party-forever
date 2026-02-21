import { GLOBAL_PROPOSAL_ENGINE_IMPL_NUM, GLOBALS_ADDRESSES } from "./constants.ts";
import { type Client, getClientForNetworkName } from "./contract_utils.ts";
import type { NetworkName } from "./types.ts";

const GLOBALS_GET_ADDRESS_ABI = [
  {
    type: "function" as const,
    name: "getAddress",
    inputs: [{ name: "variableId", type: "uint256", internalType: "uint256" }],
    outputs: [{ type: "address", internalType: "address" }],
    stateMutability: "view" as const
  }
] as const;

/**
 * Party Protocol Globals contract wrapper.
 * Provides access to protocol-wide constants and configuration.
 */
export class Globals {
  private client: Client;
  private networkName: NetworkName;

  constructor(networkName: NetworkName, client?: Client) {
    this.networkName = networkName;
    this.client = client ?? getClientForNetworkName(networkName);
  }

  /**
   * Returns the latest proposal engine implementation address from the Party Protocol Globals contract.
   * This is the canonical "recommended" upgrade target for parties on the given network.
   */
  async getLatestProposalEngineImpl(): Promise<`0x${string}`> {
    const globalsAddress = GLOBALS_ADDRESSES[this.networkName];
    const result = await this.client.readContract({
      address: globalsAddress,
      abi: GLOBALS_GET_ADDRESS_ABI,
      functionName: "getAddress",
      args: [BigInt(GLOBAL_PROPOSAL_ENGINE_IMPL_NUM)]
    });
    return result as `0x${string}`;
  }
}
