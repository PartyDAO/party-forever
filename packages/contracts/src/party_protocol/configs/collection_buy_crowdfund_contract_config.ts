import type { ContractConfig } from '../contract_utils.ts';
import { collection_buy_crowdfundf6037b99 } from '../abis/collection_buy_crowdfund_f6037b99.ts';
import { collection_buy_crowdfunddf7f231d } from '../abis/collection_buy_crowdfund_df7f231d.ts';
import { collection_buy_crowdfundbed5bf10 } from '../abis/collection_buy_crowdfund_bed5bf10.ts';
import { collection_buy_crowdfundaf4a5da3 } from '../abis/collection_buy_crowdfund_af4a5da3.ts';
import { collection_buy_crowdfund0708e2db } from '../abis/collection_buy_crowdfund_0708e2db.ts';

export type CollectionBuyCrowdfundABI =
  | typeof collection_buy_crowdfundf6037b99
  | typeof collection_buy_crowdfunddf7f231d
  | typeof collection_buy_crowdfundbed5bf10
  | typeof collection_buy_crowdfundaf4a5da3
  | typeof collection_buy_crowdfund0708e2db;

export const COLLECTION_BUY_CROWDFUND_CONTRACTS: ContractConfig<CollectionBuyCrowdfundABI>[] = [
  {
    abi: collection_buy_crowdfundf6037b99,
    implementationAddresses: {
      base: ["0x8ba53d174c540833d7f87e6ef97fc85d3d9291b4"],
      zora: ["0xc0b8ac3d9c929562e16557e36dce9bbfb36ca5d3"],
    },
  },
  {
    abi: collection_buy_crowdfunddf7f231d,
    implementationAddresses: {
      base: ["0x7e9991da653fa5bcca97ffea18fbd46b2c5e98a1"],
      mainnet: ["0x92cab452cdd7f26b8e9dd9b26570c008c3699f47"],
      zora: ["0x70f80ae910081409df29c6d779cd83208b751636"],
    },
  },
  {
    abi: collection_buy_crowdfundbed5bf10,
    implementationAddresses: {
      mainnet: ["0xe944ecd23dd7839077e1fe04872ef93bfde58bb3"],
    },
  },
  {
    abi: collection_buy_crowdfundaf4a5da3,
    implementationAddresses: {
      mainnet: ["0x8ba53d174c540833d7f87e6ef97fc85d3d9291b4"],
    },
  },
  {
    abi: collection_buy_crowdfund0708e2db,
    implementationAddresses: {
      mainnet: ["0x43844369a7a6e83b6da64b9b3121b4b66d71cad0","0x57dc04a0270e9f9e6a1289c1559c84098ba0fa9c"],
    },
  },
];
