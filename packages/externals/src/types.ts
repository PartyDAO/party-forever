import type { NetworkName } from "@party-forever/contracts";

export type TokenBalance = {
  contractAddress: string;
  tokenBalance: string;
};

export type AlchemyTokenBalancesResponse = {
  jsonrpc: string;
  id: number;
  result: {
    address: string;
    tokenBalances: TokenBalance[];
    pageKey?: string;
  };
};

export type AlchemyTokenMetadata = {
  decimals?: number;
  decimal?: number;
  logo: string | null;
  name: string;
  symbol: string;
};

export type AlchemyTokenMetadataResponse = {
  jsonrpc: string;
  id: number;
  result: AlchemyTokenMetadata;
};

export interface AlchemyRequestOptions {
  jsonrpc: "2.0";
  method: string;
  params: unknown[];
  id: string;
}

export interface AlchemyApiConfig {
  apiKey: string;
  network: NetworkName;
}

export type AssetTransfer = {
  blockNum: string;
  uniqueId: string;
  hash: string;
  from: string;
  to: string;
  value: number;
  erc721TokenId: string | null;
  erc1155Metadata: unknown | null;
  tokenId: string | null;
  asset: string;
  category: string;
  rawContract: {
    value: string;
    address: string;
    decimal: string;
  };
};

export type UserOperationLog = {
  address: string;
  topics: string[];
  data: string;
  blockHash: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  transactionIndex: string;
  logIndex: string;
  removed: boolean;
};

export type UserOperationReceipt = {
  userOpHash: string;
  entryPoint: string;
  sender: string;
  nonce: string;
  paymaster: string;
  actualGasCost: string;
  actualGasUsed: string;
  success: boolean;
  reason: string;
  logs: UserOperationLog[];
  receipt: {
    status: string;
    cumulativeGasUsed: string;
    logs: UserOperationLog[];
  };
};

export type UserOperationReceiptResponse = {
  jsonrpc: string;
  id: number;
  result: UserOperationReceipt | null;
};

export type TransactionLog = {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  logIndex: string;
  removed: boolean;
};

export type TransactionReceipt = {
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  blockNumber: string;
  from: string;
  to: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  contractAddress: string | null;
  logs: TransactionLog[];
  status: string;
  logsBloom: string;
  type: string;
  effectiveGasPrice: string;
};

export type TransactionReceiptResponse = {
  jsonrpc: string;
  id: number;
  result: TransactionReceipt | null;
};

export type Alchemy_NftV3 = {
  contract: {
    address: string;
    name?: string;
    symbol?: string;
    totalSupply?: string;
    tokenType?: string;
    contractDeployer?: string;
    deployedBlockNumber?: number;
    openSeaMetadata?: {
      floorPrice?: number;
      collectionName?: string;
      collectionSlug?: string;
      safelistRequestStatus?: string;
      imageUrl?: string;
      description?: string;
      externalUrl?: string | null;
      twitterUsername?: string;
      discordUrl?: string;
      bannerImageUrl?: string;
      lastIngestedAt?: string;
    };
    isSpam?: boolean;
    spamClassifications?: string[];
  };
  tokenId: string;
  tokenType: "ERC721" | "ERC1155";
  name?: string;
  description?: string | null;
  tokenUri?: string | null;
  image?: {
    cachedUrl?: string | null;
    thumbnailUrl?: string | null;
    pngUrl?: string | null;
    contentType?: string | null;
    size?: number | null;
    originalUrl?: string | null;
  };
  animation?: {
    cachedUrl?: string | null;
    contentType?: string | null;
    size?: number | null;
    originalUrl?: string | null;
  };
  raw?: {
    tokenUri?: string;
    metadata?: {
      name?: string;
      description?: string;
      image?: string;
      external_url?: string;
      attributes?: Array<{ trait_type?: string; value?: string }>;
    };
    error?: string | null;
  };
  collection?: {
    name?: string;
    slug?: string;
    externalUrl?: string | null;
    bannerImageUrl?: string;
  };
  mint?: {
    mintAddress?: string | null;
    blockNumber?: number | null;
    timestamp?: string | null;
    transactionHash?: string | null;
  };
  owners?: unknown;
  timeLastUpdated: string;
  balance: string;
  acquiredAt?: {
    blockTimestamp?: string | null;
    blockNumber?: number | null;
  };
  [key: string]: unknown;
};

export type AlchemyNFTsByOwnerResponse = {
  ownedNfts: Alchemy_NftV3[];
  pageKey?: string | null;
  totalCount?: number;
};

export type TokenWithMetadata = {
  contractAddress: string;
  tokenBalance: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string | null;
};
