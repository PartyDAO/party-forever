import type { ContractConfig } from '../contract_utils.ts';
import { bonding_curve_authorityd177b091 } from '../abis/bonding_curve_authority_d177b091.ts';

export type BondingCurveAuthorityABI =
  | typeof bonding_curve_authorityd177b091;

export const BONDING_CURVE_AUTHORITY_CONTRACTS: ContractConfig<BondingCurveAuthorityABI>[] = [
  {
    abi: bonding_curve_authorityd177b091,
    implementationAddresses: {
      base: ["0x2ba6cc80f34eff2f55c6cac2c1b76239dd9d41e4"],
      zora: ["0xd3fe5df9276d9c6db5c29f3cb022c9e26e2aa1a6"],
    },
  },
];
