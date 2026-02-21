import type { ContractConfig } from '../contract_utils.ts';
import { initial_ethcrowdfund3371e3f3 } from '../abis/initial_ethcrowdfund_3371e3f3.ts';
import { initial_ethcrowdfundb6e83a9b } from '../abis/initial_ethcrowdfund_b6e83a9b.ts';
import { initial_ethcrowdfund62cf3845 } from '../abis/initial_ethcrowdfund_62cf3845.ts';
import { initial_ethcrowdfund3fef7c8f } from '../abis/initial_ethcrowdfund_3fef7c8f.ts';
import { initial_ethcrowdfund56d275ce } from '../abis/initial_ethcrowdfund_56d275ce.ts';

export type InitialETHCrowdfundABI =
  | typeof initial_ethcrowdfund3371e3f3
  | typeof initial_ethcrowdfundb6e83a9b
  | typeof initial_ethcrowdfund62cf3845
  | typeof initial_ethcrowdfund3fef7c8f
  | typeof initial_ethcrowdfund56d275ce;

export const INITIAL_ETHCROWDFUND_CONTRACTS: ContractConfig<InitialETHCrowdfundABI>[] = [
  {
    abi: initial_ethcrowdfund3371e3f3,
    implementationAddresses: {
      base: ["0x5a5ae30930953ab7f33fbded8ca4d67120d3ce19"],
      mainnet: ["0x49f3929d548b783752ab42ce9527cbd3b4f51d92"],
      zora: ["0xf5f98891132331089e3af87c2d7e377af783a8ab"],
    },
  },
  {
    abi: initial_ethcrowdfundb6e83a9b,
    implementationAddresses: {
      base: ["0x23c886396cfbadb0f3bac4b728150e8a59dc0e10"],
      mainnet: ["0xd2933a444d8771f265712962be24096cea041e0c"],
      zora: ["0xecd92c44590fc330db952e94ac7b28841d65fbcb"],
    },
  },
  {
    abi: initial_ethcrowdfund62cf3845,
    implementationAddresses: {
      base: ["0x0503fc9add756bc9ce033e6e466d4b4a65b2f649"],
      mainnet: ["0x5e86bd1664eec67a808a85e65faf16a99c83af8c"],
      zora: ["0xc534bb3640a66faf5eae8699fece511e1c331cad"],
    },
  },
  {
    abi: initial_ethcrowdfund3fef7c8f,
    implementationAddresses: {
      mainnet: ["0x9a1c1e8ebd7e50a1280a31d736388a50f3d96a4d"],
    },
  },
  {
    abi: initial_ethcrowdfund56d275ce,
    implementationAddresses: {
      mainnet: ["0x23c886396cfbadb0f3bac4b728150e8a59dc0e10"],
    },
  },
];
