import { useState } from "react";
import type { Path, UseFormRegister } from "react-hook-form";

import { Input, Label } from "@party-forever/ui";

export interface AdvancedProposalOptionsFields {
  maxExecutableTimeDays: string;
  cancelDelay: string;
}

interface AdvancedProposalOptionsProps<T extends AdvancedProposalOptionsFields> {
  register: UseFormRegister<T>;
  idPrefix?: string;
}

export const AdvancedProposalOptions = <T extends AdvancedProposalOptionsFields>({
  register,
  idPrefix = ""
}: AdvancedProposalOptionsProps<T>) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground cursor-pointer text-sm"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? "Hide" : "Show"} Advanced
      </button>
      {showAdvanced && (
        <div className="mt-2 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${idPrefix}max-executable-time`}>
              Max Executable Time (days from now)
            </Label>
            <Input
              id={`${idPrefix}max-executable-time`}
              type="text"
              placeholder="90"
              {...register("maxExecutableTimeDays" as Path<T>)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${idPrefix}cancel-delay`}>Cancel Delay (seconds)</Label>
            <Input
              id={`${idPrefix}cancel-delay`}
              type="text"
              placeholder="3628800"
              {...register("cancelDelay" as Path<T>)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
