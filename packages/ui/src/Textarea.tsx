import * as React from "react";

import { cn } from "./utils.ts";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        data-slot="textarea"
        className={cn(
          "placeholder:text-muted-foreground border-input w-full min-w-0 rounded-lg border bg-transparent px-3 py-2 text-base shadow-xs transition-all duration-200 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "dark:bg-white/5 dark:border-party-card-border dark:placeholder:text-white/30",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:focus-visible:border-party-accent/50 dark:focus-visible:ring-party-accent/20",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
