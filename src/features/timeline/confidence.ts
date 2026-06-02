import type { TimelineEvent } from "@/types/twin";

export interface ConfidenceBreakdown {
  high: number;
  medium: number;
  low: number;
  label: string;
}

export function breakdownSourceConfidence(
  timeline: TimelineEvent[],
): ConfidenceBreakdown {
  const high = timeline.filter((e) => e.confidence === "High").length;
  const medium = timeline.filter((e) => e.confidence === "Medium").length;
  const low = timeline.filter((e) => e.confidence === "Low").length;

  let label: string;
  if (timeline.length === 0) label = "No events";
  else if (low > 0) label = "Mixed";
  else if (high === timeline.length) label = "High";
  else if (medium >= high) label = "Medium";
  else label = "High";

  return { high, medium, low, label };
}
