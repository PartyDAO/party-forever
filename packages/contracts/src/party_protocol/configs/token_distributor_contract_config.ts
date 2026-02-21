import type { ContractConfig } from '../contract_utils.ts';
import { token_distributor9041ed77 } from '../abis/token_distributor_9041ed77.ts';
import { token_distributor6f9cf624 } from '../abis/token_distributor_6f9cf624.ts';
import { token_distributor8eadda72 } from '../abis/token_distributor_8eadda72.ts';
import { token_distributoraa749d14 } from '../abis/token_distributor_aa749d14.ts';
import { token_distributoree07a035 } from '../abis/token_distributor_ee07a035.ts';

export type TokenDistributorABI =
  | typeof token_distributor9041ed77
  | typeof token_distributor6f9cf624
  | typeof token_distributor8eadda72
  | typeof token_distributoraa749d14
  | typeof token_distributoree07a035;

export const TOKEN_DISTRIBUTOR_CONTRACTS: ContractConfig<TokenDistributorABI>[] = [
  {
    abi: token_distributor9041ed77,
    implementationAddresses: {
      base: ["0x65778953d291dd1e3a97c6b4d8beea188b650077"],
      mainnet: ["0x0b7b86dceaa8015ced8f625d3b7a961b31fb05fe"],
      zora: ["0x5b19016a409a888326b05949391eb8797dd5f75b"],
    },
  },
  {
    abi: token_distributor6f9cf624,
    implementationAddresses: {
      base: ["0xf0560f963538017caa5081d96f839fe5d265accb"],
    },
  },
  {
    abi: token_distributor8eadda72,
    implementationAddresses: {
      base: ["0x6c7d98079023f05c2b57dfc933fa0903a2c95411"],
      mainnet: ["0x8723b021b008dd370fbec1c791c390a2bc957654"],
      zora: ["0x9a85ad6eb642bd1409df73484b331a1925b6c6cd"],
    },
  },
  {
    abi: token_distributoraa749d14,
    implementationAddresses: {
      mainnet: ["0x49a3caab781f711ad74c9d2f34c3cbd835d6a608"],
    },
  },
  {
    abi: token_distributoree07a035,
    implementationAddresses: {
      mainnet: ["0x1ca2007a81f8a7491bb6e11d8e357fd810896454"],
    },
  },
];
