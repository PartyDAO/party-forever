import { cn } from "@party-forever/ui";

interface OpenseaProposalStepperProps {
  status: string;
  skipSafetyAuction: boolean;
  showExecuteStep2Section: boolean;
  showFinalizeSection: boolean;
}

const stepCircleClass = (active: boolean) =>
  active ? "bg-purple-900 text-white" : "bg-purple-300/60 text-white";

const stepLabelClass = (active: boolean) =>
  active ? "font-semibold text-white" : "text-purple-200";

export const OpenseaProposalStepper = ({
  status,
  skipSafetyAuction,
  showExecuteStep2Section,
  showFinalizeSection
}: OpenseaProposalStepperProps) => {
  const readyOrInProgress = status === "Ready" || status === "In Progress";
  const step1On = readyOrInProgress || showExecuteStep2Section || showFinalizeSection;
  const step2On =
    (readyOrInProgress && skipSafetyAuction) || showExecuteStep2Section || showFinalizeSection;
  const step3On = showFinalizeSection;

  const step2Num = skipSafetyAuction ? 1 : 2;
  const step3Num = skipSafetyAuction ? 2 : 3;

  return (
    <div className={cn("grid gap-4 p-4", skipSafetyAuction ? "grid-cols-2" : "grid-cols-3")}>
      {!skipSafetyAuction && (
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "size-10 rounded-full flex items-center justify-center text-sm font-bold",
              stepCircleClass(step1On)
            )}
          >
            1
          </div>
          <span className={cn("text-xs text-center", stepLabelClass(step1On))}>
            List for safety auction
          </span>
        </div>
      )}

      <div className="flex flex-col items-center gap-1">
        <div
          className={cn(
            "size-10 rounded-full flex items-center justify-center text-sm font-bold",
            stepCircleClass(step2On)
          )}
        >
          {step2Num}
        </div>
        <span className={cn("text-xs text-center", stepLabelClass(step2On))}>List on OpenSea</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <div
          className={cn(
            "size-10 rounded-full flex items-center justify-center text-sm font-bold",
            stepCircleClass(step3On)
          )}
        >
          {step3Num}
        </div>
        <span className={cn("text-xs text-center", stepLabelClass(step3On))}>Finalize</span>
      </div>
    </div>
  );
};
