import { useEffect, useState } from "react";

import { formatCountdown, formatDateWithTimezone } from "@/lib/format.ts";

interface CountdownProps {
  /** Target time as Unix timestamp in seconds. */
  targetTimestamp: number;
  /** Show the target date in parentheses after the countdown (e.g. "at Jan 15, 2026, 3:00 PM EST"). Default true. */
  showTargetDate?: boolean;
  /** Optional class name for the root span. */
  className?: string;
}

/** Live countdown until a Unix timestamp (seconds). Updates every second. */
export const Countdown = ({
  targetTimestamp,
  showTargetDate = true,
  className = ""
}: CountdownProps) => {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, targetTimestamp - Math.floor(Date.now() / 1000))
  );

  useEffect(() => {
    const tick = () => {
      setRemaining(Math.max(0, targetTimestamp - Math.floor(Date.now() / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTimestamp]);

  return (
    <span className={`tabular-nums ${className}`.trim()}>
      {formatCountdown(remaining)}
      {showTargetDate && remaining > 0 && (
        <span className="ml-1.5 text-muted-foreground font-normal">
          (at {formatDateWithTimezone(targetTimestamp)})
        </span>
      )}
    </span>
  );
};
