import { allGuardrailsResolved } from "../lib/guardrails";
import type { DigitalTwinProfile } from "../types/twin";
import type { ResolverOutput } from "../types/resolver";

export type ClearanceStatus = "pass" | "warn" | "block";

export interface ClearanceResult {
  status: ClearanceStatus;
  headline: string;
  details: string[];
}

export function evaluatePerformanceClearance(
  draft: DigitalTwinProfile,
  selectedEventId: string | null,
  resolverOutput: ResolverOutput | null,
): ClearanceResult {
  const details: string[] = [];
  const event = selectedEventId
    ? draft.timeline.find((e) => e.id === selectedEventId)
    : undefined;

  if (!selectedEventId || !event) {
    details.push(
      "Choose one approved timeline event. The resolver needs an event before it can create a performance context.",
    );
  } else if (!resolverOutput) {
    details.push(
      "The resolver could not create a performance context from the selected event. Return to Scene Context and review the settings.",
    );
  }

  const pendingGuardrails = draft.guardrailReviews.filter(
    (r) => r.status === "NeedsReview",
  );
  if (pendingGuardrails.length > 0) {
    details.push(
      `${pendingGuardrails.length} producer guardrail flag${pendingGuardrails.length === 1 ? "" : "s"} still ${pendingGuardrails.length === 1 ? "needs" : "need"} a decision. Review each flag in Step 5 before locking this context.`,
    );
  }

  if (
    pendingGuardrails.length === 0 &&
    draft.guardrailReviews.length > 0 &&
    !allGuardrailsResolved(draft.guardrailReviews)
  ) {
    details.push(
      "Some producer guardrail flags still need a decision in Step 5 before locking this context.",
    );
  }

  if (details.length > 0) {
    return {
      status: "block",
      headline: "Blocked — resolve before finalizing",
      details,
    };
  }

  const warnDetails: string[] = [];

  if (resolverOutput && resolverOutput.guardrailWarnings.length > 0) {
    warnDetails.push(
      ...resolverOutput.guardrailWarnings.map((w) => `Resolver: ${w}`),
    );
  }

  if (event?.confidence === "Low") {
    warnDetails.push("Anchoring event has low source confidence.");
  }

  if (event?.sensitivity === "High") {
    warnDetails.push("Anchoring event is high sensitivity — proceed with care.");
  }

  if (warnDetails.length > 0) {
    return {
      status: "warn",
      headline: "Warning — finalize with caution",
      details: warnDetails,
    };
  }

  return {
    status: "pass",
    headline: "Clear — ready to finalize",
    details: [
      "Anchoring event selected.",
      "Producer guardrails cleared.",
      "No resolver warnings for this performance context.",
    ],
  };
}

export function statusBadgeVariant(
  status: ClearanceStatus,
): "ok" | "gold" | "danger" {
  if (status === "pass") return "ok";
  if (status === "warn") return "gold";
  return "danger";
}
