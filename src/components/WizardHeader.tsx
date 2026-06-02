import { useTwin } from "../context/TwinContext";
import { TwinContextSummary } from "./TwinContextSummary";
import { WizardStepper } from "./WizardStepper";

export function WizardHeader() {
  const { screen, completedThroughStep, goTo } = useTwin();

  return (
    <header className="border-b border-border bg-surface/80">
      <div className="mx-auto max-w-[680px] px-4 py-4">
        <WizardStepper
          currentScreen={screen}
          completedThroughStep={completedThroughStep}
          onSelect={goTo}
        />
        <TwinContextSummary />
      </div>
    </header>
  );
}
