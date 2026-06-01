import { useState } from "react";
import type { CustomMoment } from "../types/twin";
import { evaluateGuardrails } from "../lib/guardrails";

const DEMO_MOMENT: CustomMoment = {
  id: "cm-demo-private",
  title: "Private relationships",
  description: "A relationship the subject asked to keep out of public record.",
  emotionalSignificance: "Deeply personal",
  visibility: "Private",
  sensitivity: "Medium",
  sourceNotes: "Internal producer notes",
};

export function GuardrailsTest() {
  const [result, setResult] = useState<string>("");

  const run = () => {
    const reviews = evaluateGuardrails([], [DEMO_MOMENT]);
    const flag = reviews.find((r) => r.trigger === "Private relationships");
    if (!flag) {
      setResult("✗ No Private relationships flag");
      return;
    }
    setResult(
      `✓ ${flag.trigger} · ${flag.severity} · ${flag.status} (id: ${flag.eventId})`,
    );
  };

  return (
    <section
      className="mx-auto max-w-[680px] border-t border-border p-6 font-mono text-sm text-textsub"
      aria-label="Guardrails test harness (dev only)"
    >
      <h2 className="mb-2 font-display text-xl tracking-wide text-gold">
        Guardrails harness
      </h2>
      <p className="mb-4 font-body text-textmuted">Prompt 1.3 — Private relationships flag.</p>
      <button
        type="button"
        className="rounded-md border border-bordermid bg-panel px-3 py-2 text-text hover:bg-hover focus:outline-none focus:ring-2 focus:ring-gold"
        onClick={run}
      >
        Evaluate demo moment
      </button>
      {result && <p className="mt-4 text-xs text-text">{result}</p>}
    </section>
  );
}
