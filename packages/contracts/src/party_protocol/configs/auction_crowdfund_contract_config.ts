import type { ContractConfig } from '../contract_utils.ts';
import { auction_crowdfund284b3877 } from '../abis/auction_crowdfund_284b3877.ts';
import { auction_crowdfundb3aa6097 } from '../abis/auction_crowdfund_b3aa6097.ts';
import { auction_crowdfund6ec1e532 } from '../abis/auction_crowdfund_6ec1e532.ts';
import { auction_crowdfund770277ee } from '../abis/auction_crowdfund_770277ee.ts';
import { auction_crowdfundef9553aa } from '../abis/auction_crowdfund_ef9553aa.ts';

export type AuctionCrowdfundABI =
  | typeof auction_crowdfund284b3877
  | typeof auction_crowdfundb3aa6097
  | typeof auction_crowdfund6ec1e532
  | typeof auction_crowdfund770277ee
  | typeof auction_crowdfundef9553aa;

export const AUCTION_CROWDFUND_CONTRACTS: ContractConfig<AuctionCrowdfundABI>[] = [
  {
    abi: auction_crowdfund284b3877,
    implementationAddresses: {
      base: ["0xcf8ab207e1b055871dfa9be2a0cf3acaf2d1b3a7"],
      zora: ["0x091c6760dd3d1c2ac2dd26f04f58ccfdd60dc256"],
    },
  },
  {
    abi: auction_crowdfundb3aa6097,
    implementationAddresses: {
      base: ["0x75a25bfb95b884faa1df43b5fabb26ada11dbcf3"],
      mainnet: ["0xb64ad6eac4227bbf7c8194ad0b5e986b6aee2ffb"],
      zora: ["0x65778953d291dd1e3a97c6b4d8beea188b650077"],
    },
  },
  {
    abi: auction_crowdfund6ec1e532,
    implementationAddresses: {
      mainnet: ["0xc45e57873c1a2366f44cbe5851a376f0ab9093da"],
    },
  },
  {
    abi: auction_crowdfund770277ee,
    implementationAddresses: {
      mainnet: ["0xcf8ab207e1b055871dfa9be2a0cf3acaf2d1b3a7"],
    },
  },
  {
    abi: auction_crowdfundef9553aa,
    implementationAddresses: {
      mainnet: ["0x2140731a4fdc2531f5138635e457d468c8f4210b","0xa23399a573aaf562eec1645096218fecfdc22759"],
    },
  },
];
