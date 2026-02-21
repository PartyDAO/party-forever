import type { PartyFactoryABI } from "../configs/party_factory_contract_config.ts";
import { PARTY_FACTORY_CONTRACTS } from "../configs/party_factory_contract_config.ts";
import { type Client, getClientForNetworkName } from "../contract_utils.ts";
import type { NetworkName } from "../types.ts";

export interface PartyCreationData {
  preciousTokens: `0x${string}`[];
  preciousTokenIds: bigint[];
  hosts: `0x${string}`[];
}

interface FactoryEntry {
  address: `0x${string}`;
  abi: PartyFactoryABI;
}

export class PartyFactory {
  private client: Client;
  private factories: FactoryEntry[];

  constructor(networkName: NetworkName, client?: Client) {
    this.client = client ?? getClientForNetworkName(networkName);
    this.factories = PARTY_FACTORY_CONTRACTS.flatMap((config) => {
      const networkAddresses = config.implementationAddresses[networkName];
      return (
        networkAddresses?.map((address) => ({
          address: address as `0x${string}`,
          abi: config.abi
        })) ?? []
      );
    });
  }

  async fetchPartyCreationData(partyAddress: `0x${string}`): Promise<PartyCreationData> {
    const allLogs = await Promise.all(
      this.factories.map((factory) =>
        this.client.getContractEvents({
          address: factory.address,
          abi: factory.abi.abi,
          eventName: "PartyCreated" as const,
          args: { party: partyAddress },
          fromBlock: 0n,
          toBlock: "latest"
        })
      )
    );

    const logs = allLogs.flat();

    if (logs.length === 0) {
      throw new Error(`No PartyCreated event found for party ${partyAddress}`);
    }

    const log = logs[0];
    const opts = log.args.opts as { governance: { hosts: readonly `0x${string}`[] } };
    return {
      preciousTokens: (log.args.preciousTokens ?? []) as `0x${string}`[],
      preciousTokenIds: (log.args.preciousTokenIds ?? []) as bigint[],
      hosts: [...opts.governance.hosts]
    };
  }
}
