import type { AuctionCrowdfundABI } from "./configs/auction_crowdfund_contract_config.ts";
import type { BuyCrowdfundABI } from "./configs/buy_crowdfund_contract_config.ts";
import type { CollectionBatchBuyCrowdfundABI } from "./configs/collection_batch_buy_crowdfund_contract_config.ts";
import type { CollectionBuyCrowdfundABI } from "./configs/collection_buy_crowdfund_contract_config.ts";
import type { ERC20LaunchCrowdfundABI } from "./configs/erc20launch_crowdfund_contract_config.ts";
import type { InitialETHCrowdfundABI } from "./configs/initial_ethcrowdfund_contract_config.ts";

export type NetworkName = "base" | "mainnet" | "zora";

export interface TxData {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
}

export type CrowdfundAbi =
  | AuctionCrowdfundABI
  | BuyCrowdfundABI
  | CollectionBatchBuyCrowdfundABI
  | CollectionBuyCrowdfundABI
  | ERC20LaunchCrowdfundABI
  | InitialETHCrowdfundABI;

export enum DistributionTokenType {
  Native = "Native",
  ERC20 = "ERC20"
}

interface BaseDistribution {
  distributionId: bigint;
  distributorAddress: `0x${string}`;
  party: `0x${string}`;
  feeRecipient: `0x${string}`;
  memberSupply: bigint;
  fee: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

export interface NativeDistribution extends BaseDistribution {
  tokenType: DistributionTokenType.Native;
}

export interface ERC20Distribution extends BaseDistribution {
  tokenType: DistributionTokenType.ERC20;
  tokenAddress: `0x${string}`;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
}

export type Distribution = NativeDistribution | ERC20Distribution;

export interface SeaportOrderStatus {
  isValidated: boolean;
  isCancelled: boolean;
  totalFilled: bigint;
  totalSize: bigint;
}

interface SeaportBaseFields {
  orderHash: `0x${string}`;
  token: `0x${string}`;
  tokenId: bigint;
  expiry: bigint;
}

export interface SeaportStandardOrderEvent extends SeaportBaseFields {
  type: "standard";
  listPriceWei: bigint;
}

export interface SeaportAdvancedOrderEvent extends SeaportBaseFields {
  type: "advanced";
  startPriceWei: bigint;
  endPriceWei: bigint;
}

export type SeaportOrderEvent = SeaportStandardOrderEvent | SeaportAdvancedOrderEvent;

export type SeaportStandardOrderDetails = SeaportStandardOrderEvent & {
  orderStatus: SeaportOrderStatus;
};
export type SeaportAdvancedOrderDetails = SeaportAdvancedOrderEvent & {
  orderStatus: SeaportOrderStatus;
};
export type SeaportOrderDetails = SeaportStandardOrderDetails | SeaportAdvancedOrderDetails;

export interface RawDistributionEvent {
  tokenType: number;
  distributionId: bigint;
  party: `0x${string}`;
  feeRecipient: `0x${string}`;
  token: `0x${string}`;
  memberSupply: bigint;
  fee: bigint;
  distributorAddress: `0x${string}`;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}
