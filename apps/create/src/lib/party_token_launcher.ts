import type { Address } from "viem";
import { encodeFunctionData, getAddress, parseEther } from "viem";
import type { PublicClient } from "viem";

import type { TokenPageNetwork } from "./constants.ts";
import { getClient } from "./client.ts";

/** Party Token Launcher contract addresses (party_token_launcher_1_0) for Base. Only these emit LaunchCreated(launchId, creator, token, ...). */
const PARTY_TOKEN_LAUNCHER_ADDRESSES_BASE: readonly Address[] = [
  "0x418FBe3309cc2f7b9218C9f4A675A431FB0FaB60"
] as const;

const NULL_MERKLE_ROOT =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

const PARTY_TOKEN_LAUNCHER_ABI = [
  {
    type: "event",
    name: "LaunchCreated",
    inputs: [
      { name: "launchId", type: "uint32", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "tokenLiquidityPool", type: "address", indexed: false },
      { name: "erc20Args", type: "tuple", indexed: false, components: [] },
      { name: "launchArgs", type: "tuple", indexed: false, components: [] }
    ]
  },
  {
    type: "function",
    name: "launches",
    inputs: [{ name: "launchId", type: "uint32" }],
    outputs: [
      { name: "token", type: "address" },
      { name: "merkleRoot", type: "bytes32" },
      { name: "totalContributions", type: "uint96" },
      { name: "targetContribution", type: "uint96" },
      { name: "maxContributionPerAddress", type: "uint96" },
      { name: "numTokensForLP", type: "uint96" },
      { name: "numTokensForDistribution", type: "uint96" },
      { name: "numTokensForRecipient", type: "uint96" },
      { name: "recipient", type: "address" },
      { name: "finalizationFeeBps", type: "uint16" },
      { name: "withdrawalFeeBps", type: "uint16" },
      { name: "lpInfo", type: "tuple", components: [] }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getLaunchLifecycle",
    inputs: [{ name: "launchId", type: "uint32" }],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "convertETHContributedToTokensReceived",
    inputs: [
      { name: "launchId", type: "uint32" },
      { name: "ethContributed", type: "uint96" }
    ],
    outputs: [{ name: "tokensReceived", type: "uint96" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "convertTokensReceivedToETHContributed",
    inputs: [
      { name: "launchId", type: "uint32" },
      { name: "tokensReceived", type: "uint96" }
    ],
    outputs: [{ name: "ethContributed", type: "uint96" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "contribute",
    inputs: [
      { name: "launchId", type: "uint32" },
      { name: "tokenAddress", type: "address" },
      { name: "comment", type: "string" },
      { name: "merkleProof", type: "bytes32[]" }
    ],
    outputs: [{ name: "tokensReceived", type: "uint96" }],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      { name: "launchId", type: "uint32" },
      { name: "receiver", type: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "tokenToLaunchId",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint32" }],
    stateMutability: "view"
  }
] as const;

export interface CrowdfundStatus {
  targetContribution: string;
  totalContributions: string;
  lifecycle: "active" | "finalized";
  amountTokensBought: string;
}

export interface CrowdfundStaticDetails {
  token: string;
  recipient: string;
  numTokensForSale: string;
  numTokensForRecipient: string;
  merkleRoot: string;
  totalSupply: string;
  targetContribution: string;
  tokensReceivedFor1WeiContribution: string;
  weiCostOf1Token: string;
  creatorAddress: string;
  createdAtTimestamp: number;
}

export interface ForTokenResult {
  hasCrowdfund: true;
  createdViaParty: true;
  crowdfundId: string;
  crowdfundAddress: Address;
}

export const crowdfundAddressAndIdForTokenAddress = async (
  client: PublicClient,
  tokenAddress: Address
): Promise<{ crowdfundId: bigint; crowdfundAddress: Address } | null> => {
  const normalizedToken = getAddress(tokenAddress);
  const launcherAddresses = PARTY_TOKEN_LAUNCHER_ADDRESSES_BASE;

  const results = await client.multicall({
    contracts: launcherAddresses.map((launcherAddress) => ({
      address: launcherAddress,
      abi: PARTY_TOKEN_LAUNCHER_ABI,
      functionName: "tokenToLaunchId" as const,
      args: [normalizedToken]
    })),
    allowFailure: true
  });

  for (let i = 0; i < launcherAddresses.length; i++) {
    const r = results[i];
    if (r.status === "success") {
      const launchId = BigInt(r.result as number);
      if (launchId > 0n) {
        return { crowdfundId: launchId, crowdfundAddress: launcherAddresses[i] };
      }
    }
  }
  return null;
};

export const fetchStatus = async (
  client: PublicClient,
  launcherAddress: Address,
  launchId: bigint
): Promise<CrowdfundStatus> => {
  const [launchData, lifecycleRaw] = await client.multicall({
    contracts: [
      {
        address: launcherAddress,
        abi: PARTY_TOKEN_LAUNCHER_ABI,
        functionName: "launches" as const,
        args: [Number(launchId)]
      },
      {
        address: launcherAddress,
        abi: PARTY_TOKEN_LAUNCHER_ABI,
        functionName: "getLaunchLifecycle" as const,
        args: [Number(launchId)]
      }
    ],
    allowFailure: false
  });

  const raw = launchData as readonly [
    unknown,
    unknown,
    bigint,
    bigint,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    number,
    number,
    unknown
  ];

  const amountTokensBought = await client.readContract({
    address: launcherAddress,
    abi: PARTY_TOKEN_LAUNCHER_ABI,
    functionName: "convertETHContributedToTokensReceived" as const,
    args: [Number(launchId), raw[2]]
  });

  const lifecycleActive = (lifecycleRaw as number) === 0;

  return {
    targetContribution: raw[3].toString(),
    totalContributions: raw[2].toString(),
    lifecycle: lifecycleActive ? "active" : "finalized",
    amountTokensBought: String(amountTokensBought)
  };
};

export const fetchStaticDetails = async (
  client: PublicClient,
  launcherAddress: Address,
  launchId: bigint
): Promise<CrowdfundStaticDetails> => {
  const [[launch, tokensFor1Wei, weiFor1Token], createdLogs] = await Promise.all([
    client.multicall({
      contracts: [
        {
          address: launcherAddress,
          abi: PARTY_TOKEN_LAUNCHER_ABI,
          functionName: "launches" as const,
          args: [Number(launchId)]
        },
        {
          address: launcherAddress,
          abi: PARTY_TOKEN_LAUNCHER_ABI,
          functionName: "convertETHContributedToTokensReceived" as const,
          args: [Number(launchId), 1n]
        },
        {
          address: launcherAddress,
          abi: PARTY_TOKEN_LAUNCHER_ABI,
          functionName: "convertTokensReceivedToETHContributed" as const,
          args: [Number(launchId), parseEther("1")]
        }
      ],
      allowFailure: false
    }),
    client.getContractEvents({
      address: launcherAddress,
      abi: PARTY_TOKEN_LAUNCHER_ABI,
      eventName: "LaunchCreated" as const,
      args: { launchId: Number(launchId) }
    })
  ]);

  const raw = launch as readonly [
    Address,
    `0x${string}`,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    Address,
    number,
    number,
    unknown
  ];
  const token = raw[0];
  const merkleRoot = raw[1];
  const numTokensForLP = raw[5];
  const numTokensForDistribution = raw[6];
  const numTokensForRecipient = raw[7];
  const recipient = raw[8];
  const targetContribution = raw[3];

  const creatorAddress =
    createdLogs[0] && (createdLogs[0].args as { creator: Address }).creator
      ? (createdLogs[0].args as { creator: Address }).creator
      : recipient;

  const block = createdLogs[0]?.blockNumber
    ? await client.getBlock({ blockNumber: createdLogs[0].blockNumber })
    : null;
  const createdAtTimestamp = block?.timestamp ?? 0;

  const totalSupply = numTokensForLP + numTokensForDistribution + numTokensForRecipient;

  return {
    token,
    recipient,
    numTokensForSale: numTokensForLP.toString(),
    numTokensForRecipient: numTokensForRecipient.toString(),
    merkleRoot,
    totalSupply: totalSupply.toString(),
    targetContribution: targetContribution.toString(),
    tokensReceivedFor1WeiContribution: String(tokensFor1Wei),
    weiCostOf1Token: String(weiFor1Token),
    creatorAddress,
    createdAtTimestamp: Number(createdAtTimestamp)
  };
};

export const fetchRagequitAmount = async (
  client: PublicClient,
  launcherAddress: Address,
  launchId: bigint,
  tokenBalance: bigint
): Promise<{ ethRefund: bigint; withdrawalFeeBps: number }> => {
  const [ethContributed, launchResult] = await client.multicall({
    contracts: [
      {
        address: launcherAddress,
        abi: PARTY_TOKEN_LAUNCHER_ABI,
        functionName: "convertTokensReceivedToETHContributed" as const,
        args: [Number(launchId), tokenBalance]
      },
      {
        address: launcherAddress,
        abi: PARTY_TOKEN_LAUNCHER_ABI,
        functionName: "launches" as const,
        args: [Number(launchId)]
      }
    ],
    allowFailure: false
  });

  const launchTuple = launchResult as readonly [
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    number,
    number,
    unknown
  ];
  const withdrawalFeeBps = Number(launchTuple[10]);
  const eth = ethContributed as bigint;
  const fee = (eth * BigInt(withdrawalFeeBps)) / 10000n;
  const ethRefund = eth - fee;

  return { ethRefund, withdrawalFeeBps };
};

export const isOpenCrowdfund = (merkleRoot: string): boolean =>
  merkleRoot === NULL_MERKLE_ROOT || merkleRoot === "0x" + "0".repeat(64);

export const buildContributeTx = (params: {
  launcherAddress: Address;
  launchId: number;
  tokenAddress: Address;
  comment: string;
  merkleProof: `0x${string}`[];
  valueWei: bigint;
}): { to: Address; data: `0x${string}`; value: bigint } => {
  const data = encodeFunctionData({
    abi: PARTY_TOKEN_LAUNCHER_ABI,
    functionName: "contribute" as const,
    args: [params.launchId, params.tokenAddress, params.comment, params.merkleProof]
  });
  return {
    to: params.launcherAddress,
    data,
    value: params.valueWei
  };
};

export const buildWithdrawTx = (params: {
  launcherAddress: Address;
  launchId: number;
  receiver: Address;
}): { to: Address; data: `0x${string}`; value: 0n } => {
  const data = encodeFunctionData({
    abi: PARTY_TOKEN_LAUNCHER_ABI,
    functionName: "withdraw" as const,
    args: [params.launchId, params.receiver]
  });
  return {
    to: params.launcherAddress,
    data,
    value: 0n
  };
};

export const loadLaunchForToken = async (
  network: TokenPageNetwork,
  tokenAddress: Address
): Promise<ForTokenResult | null> => {
  const client = getClient(network);
  const result = await crowdfundAddressAndIdForTokenAddress(client, tokenAddress);
  if (!result) return null;
  return {
    hasCrowdfund: true,
    createdViaParty: true,
    crowdfundId: result.crowdfundId.toString(),
    crowdfundAddress: result.crowdfundAddress
  };
};

/** Returns lifecycle for a Party token launch, or null if token has no launch. */
export const getTokenLifecycle = async (
  network: TokenPageNetwork,
  tokenAddress: Address
): Promise<"active" | "finalized" | null> => {
  const launch = await loadLaunchForToken(network, tokenAddress);
  if (!launch) return null;
  const client = getClient(network);
  const status = await fetchStatus(client, launch.crowdfundAddress, BigInt(launch.crowdfundId));
  return status.lifecycle;
};
