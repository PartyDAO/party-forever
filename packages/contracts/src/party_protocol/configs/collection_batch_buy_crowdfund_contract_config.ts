import type { ContractConfig } from '../contract_utils.ts';
import { collection_batch_buy_crowdfundcd6c76a1 } from '../abis/collection_batch_buy_crowdfund_cd6c76a1.ts';
import { collection_batch_buy_crowdfunde6feedca } from '../abis/collection_batch_buy_crowdfund_e6feedca.ts';
import { collection_batch_buy_crowdfund59b3cb95 } from '../abis/collection_batch_buy_crowdfund_59b3cb95.ts';
import { collection_batch_buy_crowdfundde1777fd } from '../abis/collection_batch_buy_crowdfund_de1777fd.ts';

export type CollectionBatchBuyCrowdfundABI =
  | typeof collection_batch_buy_crowdfundcd6c76a1
  | typeof collection_batch_buy_crowdfunde6feedca
  | typeof collection_batch_buy_crowdfund59b3cb95
  | typeof collection_batch_buy_crowdfundde1777fd;

export const COLLECTION_BATCH_BUY_CROWDFUND_CONTRACTS: ContractConfig<CollectionBatchBuyCrowdfundABI>[] = [
  {
    abi: collection_batch_buy_crowdfundcd6c76a1,
    implementationAddresses: {
      base: ["0x05daeace2257de1633cb809e2a23387a2742535c"],
      zora: ["0xc4c89020d247853d36cfa2775c5da8235420ddd5"],
    },
  },
  {
    abi: collection_batch_buy_crowdfunde6feedca,
    implementationAddresses: {
      base: ["0x7c77566e032fc17024e85e0ae9e4d5e9b20a4144"],
      mainnet: ["0x902e858f21a736409015b252e854ffbe8a2c6b06"],
      zora: ["0xd665c633920c79cd1cd184d08aac2cdb2711073c"],
    },
  },
  {
    abi: collection_batch_buy_crowdfund59b3cb95,
    implementationAddresses: {
      mainnet: ["0x8e357490dc8e94e9594ae910ba261163631a6a3a"],
    },
  },
  {
    abi: collection_batch_buy_crowdfundde1777fd,
    implementationAddresses: {
      mainnet: ["0x05daeace2257de1633cb809e2a23387a2742535c"],
    },
  },
];
