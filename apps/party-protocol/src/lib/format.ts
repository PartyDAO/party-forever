import { formatEther, formatUnits } from "viem";

export function formatEth(wei: bigint): string {
  return Number(formatEther(wei)).toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatDateWithTimezone(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  });
}

/** Format for proposal cards: "02/11/2026 at 11:15 AM" */
export function formatProposalDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function formatTokenType(tokenType: number): string {
  const types: Record<number, string> = {
    0: "Native (ETH)",
    1: "ERC20",
    2: "ERC721",
    3: "ERC1155"
  };
  return types[tokenType] ?? `Unknown (${tokenType})`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
}

/** Format seconds remaining as a short countdown string (e.g. "2d 5h 12m" or "45m 30s"). */
export function formatCountdown(secondsRemaining: number): string {
  if (secondsRemaining <= 0) return "0s";
  const s = Math.floor(secondsRemaining % 60);
  const m = Math.floor((secondsRemaining / 60) % 60);
  const h = Math.floor((secondsRemaining / 3600) % 24);
  const d = Math.floor(secondsRemaining / 86400);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function calculateOwnershipBps(votingPower: bigint, totalVotingPower: bigint): number {
  if (totalVotingPower === 0n) return 0;
  return Number((votingPower * 10000n) / totalVotingPower);
}

export function formatTokenAmount(amount: bigint, decimals: number): string {
  return Number(formatUnits(amount, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 6
  });
}
