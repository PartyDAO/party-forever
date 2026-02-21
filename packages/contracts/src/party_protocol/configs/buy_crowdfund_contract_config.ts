import type { ContractConfig } from '../contract_utils.ts';
import { buy_crowdfund44eec358 } from '../abis/buy_crowdfund_44eec358.ts';
import { buy_crowdfundca363509 } from '../abis/buy_crowdfund_ca363509.ts';
import { buy_crowdfund44bf1ba9 } from '../abis/buy_crowdfund_44bf1ba9.ts';
import { buy_crowdfundd57a93d1 } from '../abis/buy_crowdfund_d57a93d1.ts';
import { buy_crowdfunde7b916f2 } from '../abis/buy_crowdfund_e7b916f2.ts';

export type BuyCrowdfundABI =
  | typeof buy_crowdfund44eec358
  | typeof buy_crowdfundca363509
  | typeof buy_crowdfund44bf1ba9
  | typeof buy_crowdfundd57a93d1
  | typeof buy_crowdfunde7b916f2;

export const BUY_CROWDFUND_CONTRACTS: ContractConfig<BuyCrowdfundABI>[] = [
  {
    abi: buy_crowdfund44eec358,
    implementationAddresses: {
      base: ["0x104db1e49b87c80ec2e2e9716e83a304415c15ce"],
      zora: ["0x49763981e68adeed7c3a70180fc1c9d66f309054"],
    },
  },
  {
    abi: buy_crowdfundca363509,
    implementationAddresses: {
      base: ["0xf5f98891132331089e3af87c2d7e377af783a8ab"],
      mainnet: ["0x2d451d8317fef4f3fb8798815520202195fe8c7c"],
      zora: ["0xa9f550971fc0431d7dbaa667c92061ed9a1b8e90"],
    },
  },
  {
    abi: buy_crowdfund44bf1ba9,
    implementationAddresses: {
      mainnet: ["0x79ebabbf5afa3763b6259cb0a7d7f72ab59a2c47"],
    },
  },
  {
    abi: buy_crowdfundd57a93d1,
    implementationAddresses: {
      mainnet: ["0x104db1e49b87c80ec2e2e9716e83a304415c15ce"],
    },
  },
  {
    abi: buy_crowdfunde7b916f2,
    implementationAddresses: {
      mainnet: ["0x569d98c73d7203d6d587d0f355b66bfa258d736f","0x48ce324bd9ce34217b9c737dda0cec2f28a0626e"],
    },
  },
];
