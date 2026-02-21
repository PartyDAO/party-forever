import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Landing / marketing site. */
export const LANDING_URL = "/";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
