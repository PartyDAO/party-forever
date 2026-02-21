import type { ContractConfig } from '../contract_utils.ts';
import { party_factory1aafddba } from '../abis/party_factory_1aafddba.ts';
import { party_factory579c5e2a } from '../abis/party_factory_579c5e2a.ts';
import { party_factory699096c6 } from '../abis/party_factory_699096c6.ts';
import { party_factoryc5cdb475 } from '../abis/party_factory_c5cdb475.ts';
import { party_factory3988da05 } from '../abis/party_factory_3988da05.ts';

export type PartyFactoryABI =
  | typeof party_factory1aafddba
  | typeof party_factory579c5e2a
  | typeof party_factory699096c6
  | typeof party_factoryc5cdb475
  | typeof party_factory3988da05;

export const PARTY_FACTORY_CONTRACTS: ContractConfig<PartyFactoryABI>[] = [
  {
    abi: party_factory1aafddba,
    implementationAddresses: {
      base: ["0x68e9fc0e4d7af69ba64dd6827bfce5cd230b8f3d"],
      mainnet: ["0xf050ae6b61c897877b51302f0c8e293807022a3e"],
      zora: ["0x75a25bfb95b884faa1df43b5fabb26ada11dbcf3"],
    },
  },
  {
    abi: party_factory579c5e2a,
    implementationAddresses: {
      base: ["0xf8c8fc091c0cc94a9029d6443050bdff9097e38a"],
      mainnet: ["0x2dfa21a5ebf5ccbe62566458a1baec6b1f33f292"],
      zora: ["0x4ecee97bf3707ba05c24449edbddd2a40c19c6ee"],
    },
  },
  {
    abi: party_factory699096c6,
    implementationAddresses: {
      base: ["0x11c594fe951b316fdeac491907643e8c81033a63"],
      mainnet: ["0x62e68e79d50a9645bdc3da7f9c287ac95f7933f9"],
      zora: ["0x2a93e97e84a532009dcacc897295c6387fd5c7e9"],
    },
  },
  {
    abi: party_factoryc5cdb475,
    implementationAddresses: {
      mainnet: ["0xc0e0ec5541e26e93d5a9f5e999ab2a0a7f8260ae"],
    },
  },
  {
    abi: party_factory3988da05,
    implementationAddresses: {
      mainnet: ["0x1ca2007d4f2bc0ec2a56ecb890e56e05f36182df"],
    },
  },
];
