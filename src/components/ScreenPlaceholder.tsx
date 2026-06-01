import type { ReactNode } from "react";
import { useTwin } from "../context/TwinContext";
import { getBackScreen, getForwardScreen } from "../lib/navigation";
import type { ScreenId } from "../types/navigation";
import { Button } from "./Button";

export interface ScreenPlaceholderProps {
  screenId: ScreenId;
  description: string;
  children?: ReactNode;
}

export function ScreenPlaceholder({
  screenId,
  description,
  children,
}: ScreenPlaceholderProps) {
  const {
    screen,
    goTo,
    goBack,
    goForward,
    rejectToCustomMoments,
  } = useTwin();

  const backTarget = getBackScreen(screenId);
  const forwardTarget = getForwardScreen(screenId);

  return (
    <div className="mx-auto max-w-[680px] px-4 py-10">
      <p className="font-mono text-xs uppercase tracking-widest text-gold">
        {screenId} · Placeholder
      </p>
      <h1 className="mt-2 font-display text-3xl text-text">{description}</h1>
      <p className="mt-3 font-body text-sm text-textsub">
        Screen shell for Prompt 2.1 — full UI ships in later prompts.
      </p>
      {children}
      <div className="mt-8 flex flex-wrap gap-2">
        <Button
          variant="ghost"
          disabled={!backTarget}
          onClick={goBack}
          aria-label="Go back"
        >
          ← Back
          {backTarget ? ` (${backTarget})` : ""}
        </Button>
        <Button
          variant="primary"
          disabled={!forwardTarget}
          onClick={goForward}
          aria-label="Go forward"
        >
          Continue →
          {forwardTarget ? ` (${forwardTarget})` : ""}
        </Button>
        {screenId === "S5" && (
          <Button variant="danger" size="small" onClick={rejectToCustomMoments}>
            Reject flag → S4
          </Button>
        )}
        {screenId === "S6" && (
          <>
            <Button variant="secondary" onClick={() => goTo("S3")}>
              Back to timeline (S3)
            </Button>
            <Button variant="primary" onClick={() => goTo("S7")}>
              Open Voice Studio (S7)
            </Button>
          </>
        )}
      </div>
      <p className="mt-4 font-mono text-[10px] text-textmuted">
        Active route: {screen}
      </p>
    </div>
  );
}
