import type { ContractConfig } from '../contract_utils.ts';
import { party_helpersc5645e90 } from '../abis/party_helpers_c5645e90.ts';
import { party_helpers87db046b } from '../abis/party_helpers_87db046b.ts';
import { party_helpersc155f7fa } from '../abis/party_helpers_c155f7fa.ts';

export type PartyHelpersABI =
  | typeof party_helpersc5645e90
  | typeof party_helpers87db046b
  | typeof party_helpersc155f7fa;

export const PARTY_HELPERS_CONTRACTS: ContractConfig<PartyHelpersABI>[] = [
  {
    abi: party_helpersc5645e90,
    implementationAddresses: {
      base: ["0x119c7ee43ebf1dedc45a3730735583bd39e32579"],
      zora: ["0x6f702bd281bce2180f2d9fd3a1b4982a15f01c42"],
    },
  },
  {
    abi: party_helpers87db046b,
    implementationAddresses: {
      mainnet: ["0xf6390e0162d9e15090c4a7e1b879118daa31cfa4"],
    },
  },
  {
    abi: party_helpersc155f7fa,
    implementationAddresses: {
      mainnet: ["0x0ae994aee8346ea37fb297fe07b9c59b3eeea2af"],
    },
  },
];
