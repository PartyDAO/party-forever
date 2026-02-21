import { cn } from "./utils.ts";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export const Switch = ({ checked, onCheckedChange, className }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      checked ? "bg-primary" : "bg-muted",
      className
    )}
  >
    <span
      className={cn(
        "pointer-events-none inline-block size-5 translate-y-0.5 rounded-full bg-white shadow ring-0 transition",
        checked ? "translate-x-6" : "translate-x-1"
      )}
    />
  </button>
);
