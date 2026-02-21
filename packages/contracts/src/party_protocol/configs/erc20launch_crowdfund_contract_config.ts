import type { ContractConfig } from '../contract_utils.ts';
import { erc20launch_crowdfund25470ee2 } from '../abis/erc20launch_crowdfund_25470ee2.ts';
import { erc20launch_crowdfundf1f69c4d } from '../abis/erc20launch_crowdfund_f1f69c4d.ts';

export type ERC20LaunchCrowdfundABI =
  | typeof erc20launch_crowdfund25470ee2
  | typeof erc20launch_crowdfundf1f69c4d;

export const ERC20LAUNCH_CROWDFUND_CONTRACTS: ContractConfig<ERC20LaunchCrowdfundABI>[] = [
  {
    abi: erc20launch_crowdfund25470ee2,
    implementationAddresses: {
      base: ["0xcc7d9f7942a6af72445d0068d79637e20e03d626","0x8723b021b008dd370fbec1c791c390a2bc957654"],
      zora: ["0x68e9fc0e4d7af69ba64dd6827bfce5cd230b8f3d"],
    },
  },
  {
    abi: erc20launch_crowdfundf1f69c4d,
    implementationAddresses: {
      base: ["0xf79b1af78b5768ac431a97cb8cc97a42af5d90c4"],
    },
  },
];
