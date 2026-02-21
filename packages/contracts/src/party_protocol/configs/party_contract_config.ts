import type { ContractConfig } from '../contract_utils.ts';
import { party907e5e04 } from '../abis/party_907e5e04.ts';
import { partyccf8d947 } from '../abis/party_ccf8d947.ts';
import { partybf4383cf } from '../abis/party_bf4383cf.ts';
import { partyad69abd3 } from '../abis/party_ad69abd3.ts';
import { party626b37ff } from '../abis/party_626b37ff.ts';

export type PartyABI =
  | typeof party907e5e04
  | typeof partyccf8d947
  | typeof partybf4383cf
  | typeof partyad69abd3
  | typeof party626b37ff;

export const PARTY_CONTRACTS: ContractConfig<PartyABI>[] = [
  {
    abi: party907e5e04,
    implementationAddresses: {
      base: ["0x5e86bd1664eec67a808a85e65faf16a99c83af8c"],
      mainnet: ["0x6c7d98079023f05c2b57dfc933fa0903a2c95411"],
      zora: ["0x11c594fe951b316fdeac491907643e8c81033a63"],
    },
  },
  {
    abi: partyccf8d947,
    implementationAddresses: {
      base: ["0x65ebb1f88aa377ee56e8114234d5721eb4c5bafd"],
      zora: ["0x2eb237b3c786646aa2b27b04dd22abf696644bc0"],
    },
  },
  {
    abi: partybf4383cf,
    implementationAddresses: {
      base: ["0xc8639e92bca4d7e02fe63c4567c0c03bbc019182"],
      mainnet: ["0x9a85ad6eb642bd1409df73484b331a1925b6c6cd"],
      zora: ["0x4a4d5126f99e58466ceb051d17661baf0be2cf93"],
    },
  },
  {
    abi: partyad69abd3,
    implementationAddresses: {
      mainnet: ["0xb676cfeeed5c7b739452a502f1eff9ab684a56da"],
    },
  },
  {
    abi: party626b37ff,
    implementationAddresses: {
      mainnet: ["0x52010e220e5c8ef2217d86cfa58da51da39e8ec4"],
    },
  },
];
