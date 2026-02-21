import { decodeAbiParameters, encodeAbiParameters, encodeFunctionData } from "viem";

import type { PartyABI } from "../configs/party_contract_config.ts";
import { PARTY_CONTRACTS } from "../configs/party_contract_config.ts";
import { ETH_SENTINEL_ADDRESS } from "../constants.ts";
import { type Client, findContractAbi, getClientForNetworkName } from "../contract_utils.ts";
import { findImplementation } from "../find_implementation.ts";
import type { ArbitraryBytecodeAnnotatedDetails } from "../helpers/proposals.ts";
import { inferArbitraryBytecodeAnnotatedDetails } from "../helpers/proposals.ts";
import type { NetworkName, SeaportOrderDetails, TxData } from "../types.ts";
import { BondingCurveAuthority } from "./bonding_curve_authority_contract.ts";
import { ERC20 } from "./erc20_contract.ts";
import { ProposalExecutionEngine } from "./proposal_execution_engine_contract.ts";
import { Seaport } from "./seaport_contract.ts";

const ProposalDataAbis = {
  Bytecode: [
    {
      type: "tuple[]",
      components: [
        { type: "address", name: "target" },
        { type: "uint256", name: "value" },
        { type: "bytes", name: "data" },
        { type: "bool", name: "optional" },
        { type: "bytes32", name: "expectedResultHash" }
      ]
    }
  ],
  Opensea: [
    {
      type: "tuple",
      name: "props",
      components: [
        { type: "uint256", name: "listPrice" },
        { type: "uint40", name: "duration" },
        { type: "address", name: "token" },
        { type: "uint256", name: "tokenId" },
        { type: "uint256[]", name: "fees" },
        { type: "address[]", name: "feeRecipients" },
        { type: "bytes4", name: "domainHashPrefix" }
      ]
    }
  ],
  AdvancedOpensea: [
    {
      type: "tuple",
      name: "props",
      components: [
        { type: "uint256", name: "startPrice" },
        { type: "uint256", name: "endPrice" },
        { type: "uint40", name: "duration" },
        { type: "uint8", name: "tokenType" },
        { type: "address", name: "token" },
        { type: "uint256", name: "tokenId" },
        { type: "uint256[]", name: "fees" },
        { type: "address[]", name: "feeRecipients" },
        { type: "bytes4", name: "domainHashPrefix" }
      ]
    }
  ],
  Zora: [
    {
      type: "tuple",
      name: "props",
      components: [
        { type: "uint256", name: "listPrice" },
        { type: "uint40", name: "timeout" },
        { type: "uint40", name: "duration" },
        { type: "address", name: "token" },
        { type: "uint256", name: "tokenId" }
      ]
    }
  ],
  Fractionalize: [
    {
      type: "tuple",
      name: "props",
      components: [
        { type: "address", name: "token" },
        { type: "uint256", name: "tokenId" },
        { type: "uint256", name: "listPrice" }
      ]
    }
  ],
  Upgrade: [{ type: "address" }, { type: "bytes" }],
  Distribute: [
    {
      type: "tuple",
      name: "props",
      components: [
        { type: "uint256", name: "amount" },
        { type: "uint8", name: "tokenType" },
        { type: "address", name: "token" },
        { type: "uint256", name: "tokenId" }
      ]
    }
  ],
  AddAuthority: [
    {
      components: [
        { internalType: "address", name: "target", type: "address" },
        { internalType: "bytes", name: "callData", type: "bytes" }
      ],
      internalType: "struct Thing.AddAuthorityProposalData",
      name: "proposalData",
      type: "tuple"
    }
  ],
  Operator: [
    {
      components: [
        {
          internalType: "address[]",
          name: "allowedExecutors",
          type: "address[]"
        },
        {
          components: [
            {
              internalType: "enum Thing.OperatorTokenType",
              name: "tokenType",
              type: "uint8"
            },
            { internalType: "address", name: "token", type: "address" },
            { internalType: "uint256", name: "tokenId", type: "uint256" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          internalType: "struct Thing.AssetData[]",
          name: "assets",
          type: "tuple[]"
        },
        { internalType: "address", name: "operator", type: "address" },
        { internalType: "bytes", name: "operatorData", type: "bytes" }
      ],
      internalType: "struct Thing.OperatorProposalData",
      name: "operatorProposalData",
      type: "tuple"
    }
  ]
} as const;

export enum ProposalType {
  Invalid = "Invalid",
  ListOnOpensea = "ListOnOpensea",
  ListOnZora = "ListOnZora",
  Fractionalize = "Fractionalize",
  ArbitraryCalls = "ArbitraryCalls",
  UpgradeProposalEngineImpl = "UpgradeProposalEngineImpl",
  ListOnOpenseaAdvanced = "ListOnOpenseaAdvanced",
  Distribute = "Distribute",
  AddAuthority = "AddAuthority",
  Operator = "Operator"
}

export enum TokenType {
  ETH = "ETH",
  ERC20 = "ERC20"
}

export type DistributionProposalParams =
  | { tokenType: TokenType.ETH; amountWei: bigint }
  | { tokenType: TokenType.ERC20; tokenAddress: `0x${string}`; amountWei: bigint };

export type DistributeParams =
  | { tokenType: TokenType.ETH }
  | { tokenType: TokenType.ERC20; tokenAddress: `0x${string}` };

export type ProposalStatus =
  | "Invalid"
  | "Voting"
  | "Defeated"
  | "Passed"
  | "Ready"
  | "In Progress"
  | "Complete"
  | "Cancelled";

const PROPOSAL_STATUS_MAP: Record<number, ProposalStatus> = {
  0: "Invalid",
  1: "Voting",
  2: "Defeated",
  3: "Passed",
  4: "Ready",
  5: "In Progress",
  6: "Complete",
  7: "Cancelled"
};

export interface ProposalStateValues {
  proposedTime: number;
  passedTime: number;
  executedTime: number;
  completedTime: number;
  votes: bigint;
  totalVotingPower: bigint;
  passThresholdBps: number;
}

export interface ProposalStateInfo {
  status: ProposalStatus;
  values: ProposalStateValues;
}

const PROPOSAL_TYPE_VALUES = [
  ProposalType.Invalid,
  ProposalType.ListOnOpensea,
  ProposalType.ListOnZora,
  ProposalType.Fractionalize,
  ProposalType.ArbitraryCalls,
  ProposalType.UpgradeProposalEngineImpl,
  ProposalType.ListOnOpenseaAdvanced,
  ProposalType.Distribute,
  ProposalType.AddAuthority,
  ProposalType.Operator
];

function extractProposalType(rawProposalData: `0x${string}`): {
  proposalType: ProposalType;
  proposalData: `0x${string}`;
} {
  // First 4 bytes (8 hex chars after 0x) is the proposal type as uint32
  const typeValue = Number.parseInt(rawProposalData.slice(2, 10), 16);
  const proposalType = PROPOSAL_TYPE_VALUES[typeValue] ?? ProposalType.Invalid;
  // Return remaining bytes (skip first 4 bytes = 8 hex chars)
  const proposalData = `0x${rawProposalData.slice(10)}` as `0x${string}`;
  return { proposalType, proposalData };
}

type BytecodeProposalData = ReturnType<
  typeof decodeAbiParameters<typeof ProposalDataAbis.Bytecode>
>[0];
export type ArbitraryCall = BytecodeProposalData[number];
type OpenseaProposalData = ReturnType<
  typeof decodeAbiParameters<typeof ProposalDataAbis.Opensea>
>[0];
type AdvancedOpenseaProposalData = ReturnType<
  typeof decodeAbiParameters<typeof ProposalDataAbis.AdvancedOpensea>
>[0];
type ZoraProposalData = ReturnType<typeof decodeAbiParameters<typeof ProposalDataAbis.Zora>>[0];
type FractionalizeProposalData = ReturnType<
  typeof decodeAbiParameters<typeof ProposalDataAbis.Fractionalize>
>[0];
type UpgradeProposalData = {
  newImplementation: `0x${string}`;
  initData: `0x${string}`;
};
type DistributeProposalData = ReturnType<
  typeof decodeAbiParameters<typeof ProposalDataAbis.Distribute>
>[0];
type AddAuthorityProposalData = ReturnType<
  typeof decodeAbiParameters<typeof ProposalDataAbis.AddAuthority>
>[0];
type OperatorProposalData = ReturnType<
  typeof decodeAbiParameters<typeof ProposalDataAbis.Operator>
>[0];

type ProposalData =
  | ({ proposalType: ProposalType.ArbitraryCalls } & {
      calls: BytecodeProposalData;
      annotatedDetails?: ArbitraryBytecodeAnnotatedDetails;
    })
  | ({ proposalType: ProposalType.ListOnOpensea } & OpenseaProposalData & {
        seaportOrderData?: SeaportOrderDetails;
      })
  | ({
      proposalType: ProposalType.ListOnOpenseaAdvanced;
    } & AdvancedOpenseaProposalData & {
        seaportOrderData?: SeaportOrderDetails;
      })
  | ({ proposalType: ProposalType.ListOnZora } & ZoraProposalData)
  | ({ proposalType: ProposalType.Fractionalize } & FractionalizeProposalData)
  | ({
      proposalType: ProposalType.UpgradeProposalEngineImpl;
    } & UpgradeProposalData)
  | ({ proposalType: ProposalType.Distribute } & DistributeProposalData)
  | ({ proposalType: ProposalType.AddAuthority } & AddAuthorityProposalData)
  | ({ proposalType: ProposalType.Operator } & OperatorProposalData)
  | { proposalType: ProposalType.Invalid };

function decodeProposalData(proposalType: ProposalType, proposalData: `0x${string}`): ProposalData {
  switch (proposalType) {
    case ProposalType.ArbitraryCalls: {
      const calls = decodeAbiParameters(ProposalDataAbis.Bytecode, proposalData)[0];
      const annotatedDetails = inferArbitraryBytecodeAnnotatedDetails(calls) ?? undefined;
      return {
        proposalType,
        calls,
        annotatedDetails
      };
    }
    case ProposalType.ListOnOpensea:
      return {
        proposalType,
        ...decodeAbiParameters(ProposalDataAbis.Opensea, proposalData)[0]
      };
    case ProposalType.ListOnOpenseaAdvanced:
      return {
        proposalType,
        ...decodeAbiParameters(ProposalDataAbis.AdvancedOpensea, proposalData)[0]
      };
    case ProposalType.ListOnZora:
      return {
        proposalType,
        ...decodeAbiParameters(ProposalDataAbis.Zora, proposalData)[0]
      };
    case ProposalType.Fractionalize:
      return {
        proposalType,
        ...decodeAbiParameters(ProposalDataAbis.Fractionalize, proposalData)[0]
      };
    case ProposalType.UpgradeProposalEngineImpl: {
      const [newImplementation, initData] = decodeAbiParameters(
        ProposalDataAbis.Upgrade,
        proposalData
      );
      return { proposalType, newImplementation, initData };
    }
    case ProposalType.Distribute:
      return {
        proposalType,
        ...decodeAbiParameters(ProposalDataAbis.Distribute, proposalData)[0]
      };
    case ProposalType.AddAuthority:
      return {
        proposalType,
        ...decodeAbiParameters(ProposalDataAbis.AddAuthority, proposalData)[0]
      };
    case ProposalType.Operator:
      return {
        proposalType,
        ...decodeAbiParameters(ProposalDataAbis.Operator, proposalData)[0]
      };
    case ProposalType.Invalid:
    default:
      return { proposalType: ProposalType.Invalid };
  }
}

export type { ProposalData };

export interface ProposedEvent {
  proposalId: bigint;
  proposer: `0x${string}`;
  proposal: {
    maxExecutableTime: number;
    cancelDelay: number;
    proposalData: ProposalData;
    /** Raw proposalData bytes, for building execute() tx */
    rawProposalData: `0x${string}`;
  };
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  stateInfo: ProposalStateInfo;
  /**
   * Timestamp (seconds) when the proposal becomes executable.
   * Only present when status is "Passed" and passedTime is set.
   * Calculated as passedTime + executionDelay.
   */
  executableAt?: number;
}

export interface GovernanceValues {
  voteDuration: number;
  executionDelay: number;
  passThresholdBps: number;
  totalVotingPower: bigint;
}

export interface PartyMember {
  partyMemberAddress: `0x${string}`;
  tokenIds: bigint[];
  totalIntrinsicVotingPower: bigint;
  delegatedTo: `0x${string}`;
  currentVotingPower: bigint;
}

export const NULL_ADDRESS: `0x${string}` = "0x0000000000000000000000000000000000000000";

/** uint40 max: use as newRageQuitTimestamp to enable rage quit with no deadline. */
export const RAGE_QUIT_FOREVER = 2 ** 40 - 1;

/** preciousListHash value for parties with no precious NFTs (ETH-only party). */
export const PRECIOUS_LIST_HASH_ETH_PARTY =
  "0x9c6b2c1b0d0b25a008e6c882cc7b415f309965c72ad2b944ac0931048ca31cd5" as const;

export class Party {
  private client: Client;
  private partyAddress: `0x${string}`;
  private partyAbi: PartyABI;
  private networkName: NetworkName;

  constructor(
    partyAbi: PartyABI,
    partyAddress: `0x${string}`,
    client: Client,
    networkName: NetworkName
  ) {
    this.client = client;
    this.partyAddress = partyAddress;
    this.partyAbi = partyAbi;
    this.networkName = networkName;
  }

  private hasAbiFunction(name: string): boolean {
    return this.partyAbi.abi.some(
      (item) => item.type === "function" && "name" in item && item.name === name
    );
  }

  /**
   * Creates a Party instance by automatically discovering the implementation address.
   */
  static async create(
    networkName: NetworkName,
    partyAddress: `0x${string}`,
    client?: Client
  ): Promise<Party> {
    const resolvedClient = client ?? getClientForNetworkName(networkName);
    const implementationAddress = await findImplementation(resolvedClient, partyAddress);
    const partyAbi = findContractAbi(implementationAddress, networkName, PARTY_CONTRACTS);
    return new Party(partyAbi, partyAddress, resolvedClient, networkName);
  }

  async fetchProposals(): Promise<ProposedEvent[]> {
    const logs = await this.client.getContractEvents({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      eventName: "Proposed" as const,
      fromBlock: 0n,
      toBlock: "latest"
    });

    const proposalIds = logs.map((log) => log.args.proposalId!);

    const stateInfoResults = await this.client.multicall({
      contracts: proposalIds.map((proposalId) => ({
        address: this.partyAddress,
        abi: this.partyAbi.abi,
        functionName: "getProposalStateInfo" as const,
        args: [proposalId]
      })),
      allowFailure: false
    });

    return Promise.all(
      logs.map(async (log, index) => {
        const { proposalType, proposalData: rawProposalData } = extractProposalType(
          log.args.proposal!.proposalData
        );
        const proposalData = decodeProposalData(proposalType, rawProposalData);

        const [statusNum, values] = stateInfoResults[index];
        const status = PROPOSAL_STATUS_MAP[statusNum];
        if (!status) {
          throw new Error(`Unknown proposal status: ${statusNum}`);
        }

        const needsGovValues =
          !("totalVotingPower" in values) ||
          !("passThresholdBps" in values) ||
          (status === "Passed" && values.passedTime !== 0);
        const governanceValues = needsGovValues
          ? await this.getGovernanceValues(log.blockNumber!)
          : undefined;

        const totalVotingPower =
          "totalVotingPower" in values
            ? values.totalVotingPower
            : governanceValues!.totalVotingPower;
        const passThresholdBps =
          "passThresholdBps" in values
            ? (values.passThresholdBps as number)
            : governanceValues!.passThresholdBps;

        const stateInfo: ProposalStateInfo = {
          status,
          values: {
            proposedTime: values.proposedTime,
            passedTime: values.passedTime,
            executedTime: values.executedTime,
            completedTime: values.completedTime,
            votes: values.votes,
            totalVotingPower,
            passThresholdBps
          }
        };

        let executableAt: number | undefined;
        if (status === "Passed" && values.passedTime !== 0) {
          executableAt = values.passedTime + governanceValues!.executionDelay;
        }

        // Check if this is a Seaport-related proposal and fetch order details if executed
        let proposalDataWithOrderDetails: ProposalData = proposalData;

        if (
          proposalType === ProposalType.ListOnOpensea ||
          proposalType === ProposalType.ListOnOpenseaAdvanced
        ) {
          const details = await this.fetchOrderDetails(log.args.proposalId!);
          if (details) {
            proposalDataWithOrderDetails = Object.assign({}, proposalData, {
              seaportOrderData: details
            });
          }
        }

        return {
          proposalId: log.args.proposalId!,
          proposer: log.args.proposer!,
          proposal: {
            maxExecutableTime: log.args.proposal!.maxExecutableTime,
            cancelDelay: log.args.proposal!.cancelDelay,
            proposalData: proposalDataWithOrderDetails,
            rawProposalData: log.args.proposal!.proposalData
          },
          blockNumber: log.blockNumber!,
          transactionHash: log.transactionHash!,
          stateInfo,
          executableAt
        };
      })
    );
  }

  async fetchProposalAcceptedEvents(): Promise<
    Array<{ proposalId: bigint; voter: `0x${string}`; weight?: bigint }>
  > {
    const logs = await this.client.getContractEvents({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      eventName: "ProposalAccepted" as const,
      fromBlock: 0n,
      toBlock: "latest"
    });
    return logs.map((log) => ({
      proposalId: log.args.proposalId!,
      voter: log.args.voter!,
      weight: (log.args as { weight?: bigint }).weight
    }));
  }

  async fetchOrderDetails(proposalId: bigint): Promise<SeaportOrderDetails | null> {
    const executedLogs = await this.client.getContractEvents({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      eventName: "ProposalExecuted" as const,
      args: { proposalId },
      fromBlock: 0n,
      toBlock: "latest"
    });
    if (executedLogs.length === 0) return null;

    // Iterate most-recent-first so that for multi-step proposals (e.g. non-unanimous
    // OpenSea listings where step 1 is Zora and step 2 is OpenSea) we find the
    // Seaport order from the correct execution event.
    for (let i = executedLogs.length - 1; i >= 0; i--) {
      const log = executedLogs[i];
      const [receipt, engineAddress] = await Promise.all([
        this.client.getTransactionReceipt({ hash: log.transactionHash! }),
        this.client.readContract({
          address: this.partyAddress,
          abi: this.partyAbi.abi,
          functionName: "getProposalExecutionEngine" as const,
          blockNumber: log.blockNumber!
        })
      ]);

      const engine = new ProposalExecutionEngine(
        this.networkName,
        engineAddress as `0x${string}`,
        this.client
      );
      const details = engine.findOrderDetails(receipt.logs);
      if (details) {
        const seaport = new Seaport(this.client);
        const orderStatus = await seaport.getOrderStatus(details.orderHash);
        return { ...details, orderStatus };
      }
    }

    return null;
  }

  /**
   * Batches name, contractURI, governanceValues, rageQuitTimestamp, and isNftParty
   * into a single multicall (1 RPC call instead of 5).
   */
  async getPartyInfo(): Promise<{
    name: string;
    contractURI: string;
    governanceValues: GovernanceValues;
    rageQuitTimestamp: number | null;
    isNftParty: boolean;
  }> {
    const [coreResults, rageQuitTimestamp, isNftParty] = await Promise.all([
      this.client.multicall({
        contracts: [
          {
            address: this.partyAddress,
            abi: this.partyAbi.abi,
            functionName: "name" as const
          },
          {
            address: this.partyAddress,
            abi: this.partyAbi.abi,
            functionName: "contractURI" as const
          },
          {
            address: this.partyAddress,
            abi: this.partyAbi.abi,
            functionName: "getGovernanceValues" as const
          }
        ],
        allowFailure: true
      }),
      this.getRageQuitTimestamp(),
      this.isNftParty()
    ]);

    const [nameResult, contractURIResult, govResult] = coreResults;

    const name = nameResult.status === "success" ? (nameResult.result as string) : "Unnamed Party";
    const contractURI =
      contractURIResult.status === "success" ? (contractURIResult.result as string) : "";

    if (govResult.status !== "success") {
      throw new Error("Failed to fetch governance values");
    }
    const govRaw = govResult.result as {
      voteDuration: number;
      executionDelay: number;
      passThresholdBps: number;
      totalVotingPower: bigint;
    };
    const governanceValues: GovernanceValues = {
      voteDuration: govRaw.voteDuration,
      executionDelay: govRaw.executionDelay,
      passThresholdBps: govRaw.passThresholdBps,
      totalVotingPower: govRaw.totalVotingPower
    };

    return { name, contractURI, governanceValues, rageQuitTimestamp, isNftParty };
  }

  /**
   * Batches isAuthority checks for all known bonding curve addresses into a single multicall.
   */
  async getBondingCurveAuthorityAddressBatched(): Promise<`0x${string}` | null> {
    if (!this.hasAbiFunction("isAuthority")) return null;
    const knownAddresses = BondingCurveAuthority.getKnownAddresses(this.networkName);
    if (knownAddresses.length === 0) return null;

    const results = await this.client.multicall({
      contracts: knownAddresses.map((addr) => ({
        address: this.partyAddress,
        abi: this.partyAbi.abi,
        functionName: "isAuthority" as const,
        args: [addr]
      })),
      allowFailure: true
    });

    for (let i = 0; i < knownAddresses.length; i++) {
      if (results[i].status === "success" && results[i].result === true) {
        return knownAddresses[i];
      }
    }
    return null;
  }

  async getName(): Promise<string> {
    const result = await this.client.readContract({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      functionName: "name" as const
    });
    return result as string;
  }

  async getContractURI(): Promise<string> {
    const result = await this.client.readContract({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      functionName: "contractURI" as const
    });
    return result as string;
  }

  async getGovernanceValues(blockNumber?: bigint): Promise<GovernanceValues> {
    const result = await this.client.readContract({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      functionName: "getGovernanceValues" as const,
      ...(blockNumber !== undefined && { blockNumber })
    });
    return {
      voteDuration: result.voteDuration,
      executionDelay: result.executionDelay,
      passThresholdBps: result.passThresholdBps,
      totalVotingPower: result.totalVotingPower
    };
  }

  /** Returns true if the given address is an authority of this party. */
  async isAuthority(authorityAddress: `0x${string}`): Promise<boolean> {
    if (!this.hasAbiFunction("isAuthority")) {
      return false;
    }
    return this.client.readContract({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      functionName: "isAuthority" as const,
      args: [authorityAddress]
    });
  }

  /**
   * Returns true if this party supports buying/selling memberships via a bonding curve (dynamic room).
   */
  async isDynamicParty(): Promise<boolean> {
    return (await this.getBondingCurveAuthorityAddress()) != null;
  }

  /**
   * Returns the bonding curve authority address for this party, or null if not a dynamic party.
   */
  async getBondingCurveAuthorityAddress(): Promise<`0x${string}` | null> {
    for (const addr of BondingCurveAuthority.getKnownAddresses(this.networkName)) {
      if (await this.isAuthority(addr)) return addr;
    }
    return null;
  }

  /** Returns this party's current proposal execution engine implementation address. */
  async getProposalExecutionEngine(): Promise<`0x${string}`> {
    const result = await this.client.readContract({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      functionName: "getProposalExecutionEngine" as const
    });
    return result as `0x${string}`;
  }

  /**
   * Returns true if the party has at least one precious NFT (NFT party).
   * Returns false when preciousListHash is zero or equals PRECIOUS_LIST_HASH_ETH_PARTY (ETH party).
   */
  async isNftParty(): Promise<boolean> {
    if (!this.hasAbiFunction("preciousListHash")) {
      return false;
    }
    const hash = await this.client.readContract({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      functionName: "preciousListHash" as const
    });
    return hash !== PRECIOUS_LIST_HASH_ETH_PARTY;
  }

  async getTokenCount(): Promise<bigint> {
    return (await this.client.readContract({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      functionName: "tokenCount" as const
    })) as bigint;
  }

  async getMembers(): Promise<PartyMember[]> {
    const tokenCount = await this.getTokenCount();

    if (tokenCount === 0n) {
      return [];
    }

    const tokenIds = Array.from({ length: Number(tokenCount) }, (_, i) => BigInt(i + 1));

    const [ownerResults, votingPowerResults] = await Promise.all([
      this.client.multicall({
        contracts: tokenIds.map((tokenId) => ({
          address: this.partyAddress,
          abi: this.partyAbi.abi,
          functionName: "ownerOf" as const,
          args: [tokenId]
        })),
        allowFailure: true
      }),
      this.client.multicall({
        contracts: tokenIds.map((tokenId) => ({
          address: this.partyAddress,
          abi: this.partyAbi.abi,
          functionName: "votingPowerByTokenId" as const,
          args: [tokenId]
        })),
        allowFailure: true
      })
    ]);

    const memberMap = new Map<`0x${string}`, { tokenIds: bigint[]; totalVotingPower: bigint }>();

    for (let i = 0; i < tokenIds.length; i++) {
      const ownerResult = ownerResults[i];
      const votingPowerResult = votingPowerResults[i];

      if (ownerResult.status !== "success" || votingPowerResult.status !== "success") {
        continue;
      }

      const owner = ownerResult.result as `0x${string}`;
      const votingPower = votingPowerResult.result as bigint;
      const tokenId = tokenIds[i];

      const existing = memberMap.get(owner);
      if (existing) {
        existing.tokenIds.push(tokenId);
        existing.totalVotingPower += votingPower;
      } else {
        memberMap.set(owner, {
          tokenIds: [tokenId],
          totalVotingPower: votingPower
        });
      }
    }

    const memberAddresses = Array.from(memberMap.keys());

    const delegationResults = await this.client.multicall({
      contracts: memberAddresses.map((address) => ({
        address: this.partyAddress,
        abi: this.partyAbi.abi,
        functionName: "delegationsByVoter" as const,
        args: [address]
      })),
      allowFailure: false
    });

    const membersWithDelegations = memberAddresses.map((address, i) => {
      const data = memberMap.get(address)!;
      return {
        partyMemberAddress: address,
        tokenIds: data.tokenIds,
        totalIntrinsicVotingPower: data.totalVotingPower,
        delegatedTo: delegationResults[i] as `0x${string}`
      };
    });

    const currentVotingPowerMap = new Map<`0x${string}`, bigint>();
    for (const member of membersWithDelegations) {
      const delegateAddress =
        member.delegatedTo.toLowerCase() === NULL_ADDRESS
          ? member.partyMemberAddress
          : member.delegatedTo;

      const normalizedDelegate = delegateAddress.toLowerCase() as `0x${string}`;
      const existing = currentVotingPowerMap.get(normalizedDelegate) ?? 0n;
      currentVotingPowerMap.set(normalizedDelegate, existing + member.totalIntrinsicVotingPower);
    }

    const members = membersWithDelegations.map((member) => ({
      ...member,
      currentVotingPower:
        currentVotingPowerMap.get(member.partyMemberAddress.toLowerCase() as `0x${string}`) ?? 0n
    }));

    return members.sort((a, b) =>
      a.totalIntrinsicVotingPower > b.totalIntrinsicVotingPower
        ? -1
        : a.totalIntrinsicVotingPower < b.totalIntrinsicVotingPower
          ? 1
          : 0
    );
  }

  async tokensHaveOwners(tokenIds: bigint[]): Promise<Map<bigint, boolean>> {
    const results = await this.client.multicall({
      contracts: tokenIds.map((tokenId) => ({
        address: this.partyAddress,
        abi: this.partyAbi.abi,
        functionName: "ownerOf" as const,
        args: [tokenId]
      }))
    });

    const ownerMap = new Map<bigint, boolean>();
    for (let i = 0; i < tokenIds.length; i++) {
      ownerMap.set(tokenIds[i], results[i].status === "success");
    }
    return ownerMap;
  }

  async ownerOf(tokenId: bigint): Promise<`0x${string}`> {
    const result = await this.client.readContract({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      functionName: "ownerOf" as const,
      args: [tokenId]
    });
    return result as `0x${string}`;
  }

  async balanceOf(owner: `0x${string}`): Promise<bigint> {
    const result = await this.client.readContract({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      functionName: "balanceOf" as const,
      args: [owner]
    });
    return result as bigint;
  }

  /**
   * Returns the sum of voting power for the given token IDs.
   * Used e.g. to compute a member's share for rage quit.
   */
  async getTotalVotingPowerForTokenIds(tokenIds: bigint[]): Promise<bigint> {
    if (tokenIds.length === 0) return 0n;
    const results = await this.client.multicall({
      contracts: tokenIds.map((tokenId) => ({
        address: this.partyAddress,
        abi: this.partyAbi.abi,
        functionName: "votingPowerByTokenId" as const,
        args: [tokenId]
      })),
      allowFailure: false
    });
    let total = 0n;
    for (const vp of results) {
      total += vp as bigint;
    }
    return total;
  }

  async findVotingPowerSnapshotIndex(voter: `0x${string}`, timestamp: number): Promise<bigint> {
    const result = await this.client.readContract({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      functionName: "findVotingPowerSnapshotIndex" as const,
      args: [voter, timestamp]
    });
    return result as bigint;
  }

  generateArbitraryBytecodeProposalTx(options: {
    maxExecutableTime: string;
    cancelDelay: string;
    latestSnapIndex: string;
    target: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
  }): TxData {
    const encodedCalls = encodeAbiParameters(ProposalDataAbis.Bytecode, [
      [
        {
          target: options.target,
          value: options.value ?? 0n,
          data: options.data,
          optional: false,
          expectedResultHash: "0x0000000000000000000000000000000000000000000000000000000000000000"
        }
      ]
    ]);

    const proposalData = `0x00000004${encodedCalls.slice(2)}` as `0x${string}`;

    return this._generateProposalTx({
      maxExecutableTime: options.maxExecutableTime,
      cancelDelay: options.cancelDelay,
      latestSnapIndex: options.latestSnapIndex,
      proposalData
    });
  }

  generateOpenseaSaleProposalTx(options: {
    listPrice: bigint;
    duration: number;
    token: `0x${string}`;
    tokenId: bigint;
    fees: bigint[];
    feeRecipients: `0x${string}`[];
    domainHashPrefix: `0x${string}`;
    maxExecutableTime: string;
    cancelDelay: string;
    latestSnapIndex: string;
  }): TxData {
    const encodedOpenseaData = encodeAbiParameters(ProposalDataAbis.Opensea, [
      {
        listPrice: options.listPrice,
        duration: options.duration,
        token: options.token,
        tokenId: options.tokenId,
        fees: options.fees,
        feeRecipients: options.feeRecipients,
        domainHashPrefix: options.domainHashPrefix
      }
    ]);

    // 0x00000001 = ProposalType.ListOnOpensea (index 1)
    const proposalData = `0x00000001${encodedOpenseaData.slice(2)}` as `0x${string}`;

    return this._generateProposalTx({
      maxExecutableTime: options.maxExecutableTime,
      cancelDelay: options.cancelDelay,
      latestSnapIndex: options.latestSnapIndex,
      proposalData
    });
  }

  generateDistributionProposalTx(
    params: DistributionProposalParams,
    maxExecutableTime: string,
    cancelDelay: string,
    latestSnapIndex: string
  ): TxData {
    const tokenTypeUint8 = params.tokenType === TokenType.ETH ? 0 : 1;
    const tokenAddress =
      params.tokenType === TokenType.ETH ? ETH_SENTINEL_ADDRESS : params.tokenAddress;

    const encodedDistribution = encodeAbiParameters(ProposalDataAbis.Distribute, [
      {
        amount: params.amountWei,
        tokenType: tokenTypeUint8,
        token: tokenAddress,
        tokenId: 0n
      }
    ]);

    // 0x00000007 = ProposalType.Distribute (index 7)
    const proposalData = `0x00000007${encodedDistribution.slice(2)}` as `0x${string}`;

    return this._generateProposalTx({
      maxExecutableTime,
      cancelDelay,
      latestSnapIndex,
      proposalData
    });
  }

  /**
   * Returns transaction data to call distribute directly on the Party.
   * Fetches the party's full balance of the given token and distributes it.
   * Handles both 4-param (newer) and 3-param (older) ABI signatures automatically.
   */
  async generateDistributeTx(params: DistributeParams): Promise<TxData> {
    if (!this.hasAbiFunction("distribute")) {
      throw new Error("Party implementation does not support direct distribute");
    }

    const tokenTypeUint8 = params.tokenType === TokenType.ETH ? 0 : 1;
    const tokenAddress =
      params.tokenType === TokenType.ETH ? ETH_SENTINEL_ADDRESS : params.tokenAddress;

    let amount: bigint;
    if (params.tokenType === TokenType.ETH) {
      amount = await this.client.getBalance({ address: this.partyAddress });
    } else {
      const erc20 = new ERC20(this.networkName, params.tokenAddress, this.client);
      amount = await erc20.fetchBalance(this.partyAddress);
    }

    const distributeItem = this.partyAbi.abi.find(
      (item) => item.type === "function" && "name" in item && item.name === "distribute"
    );
    const inputCount =
      distributeItem && "inputs" in distributeItem ? distributeItem.inputs.length : 0;

    const calldata =
      inputCount === 4
        ? encodeFunctionData({
            abi: this.partyAbi.abi,
            functionName: "distribute" as const,
            args: [amount, tokenTypeUint8, tokenAddress, 0n]
          })
        : encodeFunctionData({
            abi: this.partyAbi.abi,
            functionName: "distribute" as const,
            args: [tokenTypeUint8, tokenAddress, 0n]
          });

    return { to: this.partyAddress, data: calldata };
  }

  /**
   * Returns transaction data to propose upgrading the party's proposal execution engine.
   * @param newImplementation - Address of the new proposal engine implementation
   * @param initData - Calldata for the new implementation's initializer (often 0x)
   */
  generateUpgradeProposalEngineTx(
    newImplementation: `0x${string}`,
    initData: `0x${string}`,
    maxExecutableTime: string,
    cancelDelay: string,
    latestSnapIndex: string
  ): TxData {
    const encodedUpgrade = encodeAbiParameters(ProposalDataAbis.Upgrade, [
      newImplementation,
      initData
    ]);
    // 0x00000005 = ProposalType.UpgradeProposalEngineImpl (index 5)
    const proposalData = `0x00000005${encodedUpgrade.slice(2)}` as `0x${string}`;
    return this._generateProposalTx({
      maxExecutableTime,
      cancelDelay,
      latestSnapIndex,
      proposalData
    });
  }

  private _generateProposalTx(options: {
    maxExecutableTime: string;
    cancelDelay: string;
    latestSnapIndex: string;
    proposalData: `0x${string}`;
  }): TxData {
    const calldata = encodeFunctionData({
      abi: this.partyAbi.abi,
      functionName: "propose" as const,
      args: [
        {
          maxExecutableTime: Number(options.maxExecutableTime),
          cancelDelay: Number(options.cancelDelay),
          proposalData: options.proposalData
        },
        BigInt(options.latestSnapIndex)
      ]
    });

    return { to: this.partyAddress, data: calldata };
  }

  async getAcceptProposalTxData(
    proposalId: bigint,
    voterAddress: `0x${string}`,
    proposedTime: number
  ): Promise<TxData> {
    const snapIndex = await this.client.readContract({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      functionName: "findVotingPowerSnapshotIndex" as const,
      args: [voterAddress, proposedTime]
    });

    const calldata = encodeFunctionData({
      abi: this.partyAbi.abi,
      functionName: "accept" as const,
      args: [proposalId, snapIndex]
    });

    return { to: this.partyAddress, data: calldata };
  }

  async isHost(address: `0x${string}`): Promise<boolean> {
    const result = await this.client.readContract({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      functionName: "isHost" as const,
      args: [address]
    });
    return result as boolean;
  }

  /**
   * Returns the current rage quit timestamp. 0 = disabled; non-zero = rage quit allowed (until that timestamp).
   * Returns null if the party implementation does not support rage quit (e.g. party_626b37ff).
   */
  async getRageQuitTimestamp(): Promise<number | null> {
    if (!this.hasAbiFunction("rageQuitTimestamp")) {
      return null;
    }
    try {
      const result = await this.client.readContract({
        address: this.partyAddress,
        abi: this.partyAbi.abi,
        functionName: "rageQuitTimestamp" as const
      });
      return Number(result);
    } catch {
      return null;
    }
  }

  /** True if this party implementation has setRageQuit (host can toggle rage quit on/off). */
  supportsSetRageQuit(): boolean {
    return this.hasAbiFunction("setRageQuit");
  }

  /**
   * Builds tx data for setRageQuit(newRageQuitTimestamp). Use 0 to disable, RAGE_QUIT_FOREVER to enable with no deadline.
   * Returns null if the party does not support setRageQuit.
   */
  getSetRageQuitTxData(newRageQuitTimestamp: number): TxData | null {
    if (!this.supportsSetRageQuit()) {
      return null;
    }
    const calldata = encodeFunctionData({
      abi: this.partyAbi.abi,
      functionName: "setRageQuit" as const,
      args: [newRageQuitTimestamp]
    });
    return { to: this.partyAddress, data: calldata };
  }

  /**
   * True if this party's rageQuit function accepts tokenIds, withdrawTokens, minWithdrawAmounts, and receiver
   * (allows selecting which assets to withdraw). Older implementations have a no-arg rageQuit.
   */
  supportsRageQuitWithdrawSelection(): boolean {
    const rageQuitItem = this.partyAbi.abi.find(
      (item) => item.type === "function" && "name" in item && item.name === "rageQuit"
    );
    if (!rageQuitItem || !("inputs" in rageQuitItem)) return false;
    return rageQuitItem.inputs.length === 4;
  }

  /**
   * Builds tx data for rageQuit(tokenIds, withdrawTokens, minWithdrawAmounts, receiver).
   * Returns null if the party does not support the 4-arg rageQuit (use supportsRageQuitWithdrawSelection).
   */
  getRageQuitTxData(
    tokenIds: bigint[],
    withdrawTokens: `0x${string}`[],
    minWithdrawAmounts: bigint[],
    receiver: `0x${string}`
  ): TxData | null {
    if (!this.supportsRageQuitWithdrawSelection()) return null;
    const calldata = encodeFunctionData({
      abi: this.partyAbi.abi,
      functionName: "rageQuit" as const,
      args: [tokenIds, withdrawTokens, minWithdrawAmounts, receiver]
    });
    return { to: this.partyAddress, data: calldata };
  }

  getVetoProposalTxData(proposalId: bigint): TxData {
    const calldata = encodeFunctionData({
      abi: this.partyAbi.abi,
      functionName: "veto" as const,
      args: [proposalId]
    });
    return { to: this.partyAddress, data: calldata };
  }

  /**
   * Builds tx data for delegateVotingPower(delegate). Your voting power will count toward the
   * selected delegate when voting. Returns null if the party does not support delegation.
   */
  getDelegateVotingPowerTxData(delegate: `0x${string}`): TxData | null {
    if (!this.hasAbiFunction("delegateVotingPower")) {
      return null;
    }
    const calldata = encodeFunctionData({
      abi: this.partyAbi.abi,
      functionName: "delegateVotingPower" as const,
      args: [delegate]
    });
    return { to: this.partyAddress, data: calldata };
  }

  // progressData defaults to '0x' (first execution step) and extraData defaults to '0x'.
  getExecuteProposalTxData(
    proposalId: bigint,
    proposal: {
      maxExecutableTime: number;
      cancelDelay: number;
      proposalData: `0x${string}`;
    },
    options?: {
      preciousTokens?: `0x${string}`[];
      preciousTokenIds?: bigint[];
      progressData?: `0x${string}`;
      extraData?: `0x${string}`;
    }
  ): TxData {
    const preciousTokens = options?.preciousTokens ?? [];
    const preciousTokenIds = options?.preciousTokenIds ?? [];
    const progressData = options?.progressData ?? ("0x" as const);
    const extraData = options?.extraData ?? ("0x" as const);
    const calldata = encodeFunctionData({
      abi: this.partyAbi.abi,
      functionName: "execute" as const,
      args: [
        proposalId,
        {
          maxExecutableTime: proposal.maxExecutableTime,
          cancelDelay: proposal.cancelDelay,
          proposalData: proposal.proposalData
        },
        preciousTokens,
        preciousTokenIds,
        progressData,
        extraData
      ]
    });
    return { to: this.partyAddress, data: calldata };
  }

  async generateOpenseaFinalizationTxData(
    proposalId: bigint,
    preciousTokens: `0x${string}`[],
    preciousTokenIds: bigint[],
    options?: { toBlock?: bigint }
  ): Promise<TxData> {
    const toBlock = options?.toBlock ?? ("latest" as const);

    const proposedLogs = await this.client.getContractEvents({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      eventName: "Proposed" as const,
      fromBlock: 0n,
      toBlock
    });
    const proposedLog = proposedLogs.find((log) => log.args.proposalId === proposalId);
    if (!proposedLog) {
      throw new Error(`Proposed event not found for proposal ${proposalId}`);
    }

    const { proposalType } = extractProposalType(proposedLog.args.proposal!.proposalData);
    if (
      proposalType !== ProposalType.ListOnOpensea &&
      proposalType !== ProposalType.ListOnOpenseaAdvanced
    ) {
      throw new Error(`Proposal ${proposalId} is not an OpenSea listing (type: ${proposalType})`);
    }

    const executedLogs = await this.client.getContractEvents({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      eventName: "ProposalExecuted" as const,
      args: { proposalId },
      fromBlock: 0n,
      toBlock
    });

    const progressData =
      executedLogs.length > 0
        ? (executedLogs[executedLogs.length - 1].args.nextProgressData as `0x${string}`)
        : ("0x" as const);

    return this.getExecuteProposalTxData(
      proposalId,
      {
        maxExecutableTime: proposedLog.args.proposal!.maxExecutableTime,
        cancelDelay: proposedLog.args.proposal!.cancelDelay,
        proposalData: proposedLog.args.proposal!.proposalData
      },
      { preciousTokens, preciousTokenIds, progressData }
    );
  }

  async getTokenIdsOwnedByAddress(ownerAddress: `0x${string}`): Promise<bigint[]> {
    const logs = await this.client.getContractEvents({
      address: this.partyAddress,
      abi: this.partyAbi.abi,
      eventName: "Transfer" as const,
      args: { to: ownerAddress },
      fromBlock: 0n,
      toBlock: "latest"
    });

    const tokenIds = [...new Set(logs.map((log) => log.args.tokenId!))];

    if (tokenIds.length === 0) {
      return [];
    }

    const ownerResults = await this.client.multicall({
      contracts: tokenIds.map((tokenId) => ({
        address: this.partyAddress,
        abi: this.partyAbi.abi,
        functionName: "ownerOf" as const,
        args: [tokenId]
      }))
    });

    const ownedTokenIds: bigint[] = [];
    for (let i = 0; i < tokenIds.length; i++) {
      const result = ownerResults[i];
      if (
        result.status === "success" &&
        (result.result as `0x${string}`).toLowerCase() === ownerAddress.toLowerCase()
      ) {
        ownedTokenIds.push(tokenIds[i]);
      }
    }
    return ownedTokenIds;
  }
}
