import { useTwin } from "../context/TwinContext";
import { SCREEN_META } from "../types/navigation";

export function TwinContextSummary() {
  const { draft, screen } = useTwin();
  const name = draft?.coreIdentity.name ?? "No twin selected";
  const eventCount = draft?.timeline.length ?? 0;
  const customCount = draft?.customMoments.length ?? 0;
  const flagCount =
    draft?.guardrailReviews.filter((r) => r.status === "NeedsReview").length ??
    0;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-textsub">
      <span className="text-text">{name}</span>
      <span>{eventCount} events</span>
      <span>{customCount} custom</span>
      {screen === "S5" && flagCount > 0 && (
        <span className="text-gold">{flagCount} flags pending</span>
      )}
      <span className="text-textmuted">{SCREEN_META[screen].title}</span>
    </div>
  );
}
