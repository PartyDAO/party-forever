import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "./utils.ts";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const Select = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
  id
}: SelectProps) => {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange}>
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          "border-input h-9 w-full rounded-lg border bg-transparent px-3 py-1 text-sm",
          "flex items-center justify-between",
          "dark:bg-white/5 dark:border-party-card-border",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:focus-visible:border-party-accent/50 dark:focus-visible:ring-party-accent/20 outline-none",
          "disabled:opacity-50",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="bg-popover text-popover-foreground z-50 min-w-[8rem] rounded-lg border p-1 shadow-md dark:glass-card"
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport className="w-full min-w-[var(--radix-select-trigger-width)]">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
                  "focus:bg-accent focus:text-accent-foreground",
                  "data-[disabled]:opacity-50"
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
};
