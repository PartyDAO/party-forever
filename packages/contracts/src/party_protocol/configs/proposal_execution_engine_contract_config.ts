import type { ContractConfig } from '../contract_utils.ts';
import { proposal_execution_engineafe1bfba } from '../abis/proposal_execution_engine_afe1bfba.ts';
import { proposal_execution_engine2cd6aed7 } from '../abis/proposal_execution_engine_2cd6aed7.ts';
import { proposal_execution_enginecea8fc3e } from '../abis/proposal_execution_engine_cea8fc3e.ts';
import { proposal_execution_enginec9dfdf63 } from '../abis/proposal_execution_engine_c9dfdf63.ts';
import { proposal_execution_engine4001e34a } from '../abis/proposal_execution_engine_4001e34a.ts';

export type ProposalExecutionEngineABI =
  | typeof proposal_execution_engineafe1bfba
  | typeof proposal_execution_engine2cd6aed7
  | typeof proposal_execution_enginecea8fc3e
  | typeof proposal_execution_enginec9dfdf63
  | typeof proposal_execution_engine4001e34a;

export const PROPOSAL_EXECUTION_ENGINE_CONTRACTS: ContractConfig<ProposalExecutionEngineABI>[] = [
  {
    abi: proposal_execution_engineafe1bfba,
    implementationAddresses: {
      base: ["0xaec4d40045daf91bc3049ea9136c7df04bd8a6af"],
      mainnet: ["0xdf6a4d97dd2aa32a54b8a2b2711f210b711f28f0"],
      zora: ["0x081f4bb7bd92168b633f8b1292673cf4520626e4"],
    },
  },
  {
    abi: proposal_execution_engine2cd6aed7,
    implementationAddresses: {
      base: ["0x92cab452cdd7f26b8e9dd9b26570c008c3699f47"],
      mainnet: ["0x51fd9005f3b9606d1aa8bd6f7455020b051e1d91","0x13e0e3125c7a3566adf4c8067adf739699115fa3"],
      zora: ["0xc8639e92bca4d7e02fe63c4567c0c03bbc019182"],
    },
  },
  {
    abi: proposal_execution_enginecea8fc3e,
    implementationAddresses: {
      mainnet: ["0xaec4d40045daf91bc3049ea9136c7df04bd8a6af"],
    },
  },
  {
    abi: proposal_execution_enginec9dfdf63,
    implementationAddresses: {
      mainnet: ["0xa51ef92ee7f24eff05f5e5cc2119c22c4f8843f6","0x88d1f63e80a48711d2a458e1924224435c10beed"],
    },
  },
  {
    abi: proposal_execution_engine4001e34a,
    implementationAddresses: {
      mainnet: ["0x731db043762729ea2dae790a1c4a6ad78b86d67c"],
    },
  },
];
