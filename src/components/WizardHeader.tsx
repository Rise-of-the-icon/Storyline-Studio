import { useTwin } from "../context/TwinContext";
import { ProgressBar } from "./ProgressBar";
import { TwinContextSummary } from "./TwinContextSummary";

export function WizardHeader() {
  const { wizardStep, completedThroughStep } = useTwin();

  return (
    <header className="border-b border-border bg-surface/80">
      <div className="mx-auto max-w-[680px] px-4 py-4">
        <ProgressBar
          currentStep={wizardStep}
          completedThrough={completedThroughStep}
        />
        <TwinContextSummary />
      </div>
    </header>
  );
}
