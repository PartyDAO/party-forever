import { formatEther, formatUnits } from "viem";

export function formatEth(wei: bigint): string {
  return Number(formatEther(wei)).toLocaleString(undefined, {
    maximumFractionDigits: 6
  });
}

export function formatTokenAmount(amount: bigint, decimals: number): string {
  return Number(formatUnits(amount, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 6
  });
}
