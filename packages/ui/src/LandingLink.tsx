import { cn } from "./utils.ts";
import { LANDING_URL } from "./utils.ts";

interface LandingLinkProps {
  className?: string;
}

export const LandingLink = ({ className }: LandingLinkProps) => (
  <a href={LANDING_URL} className={cn("party-nav-link text-sm font-medium", className)}>
    PartyDAO Directory
  </a>
);
