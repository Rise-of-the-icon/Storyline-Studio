import { useCallback, useEffect, useState } from "react";
import { useTwin } from "@/app/providers/TwinContext";
import { isDemoTwin } from "@/data/demoSubjects";
import { hasUnsavedProgress } from "@/app/navigation/unsavedChanges";
import { SCREEN_META } from "@/types/navigation";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";

/**
 * Persistent global header. Always visible.
 *
 * Layout:
 *  - Left: RICON wordmark — a button that returns to S1 with an unsaved-
 *    changes confirm when applicable.
 *  - Center (sm+): flow name + step indicator + subject name + Demo badge.
 *  - Right: Exit button (S2–S5, S7) or nothing (S1, S6).
 *
 * Wires browser `beforeunload` whenever `hasUnsavedProgress(...)` is true,
 * so the OS-level "Reload site?" prompt fires too — a belt-and-braces
 * complement to the in-app confirm dialog.
 */
export function AppHeader() {
  const { screen, draft, completedThroughStep, goHome } = useTwin();
  const meta = SCREEN_META[screen];
  const subjectName = draft?.coreIdentity.name ?? null;
  const isDemo = draft ? isDemoTwin(draft) : false;
  const dirty = hasUnsavedProgress(draft, screen);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestExit = useCallback(() => {
    if (dirty) {
      setConfirmOpen(true);
    } else {
      goHome();
    }
  }, [dirty, goHome]);

  const confirmAndExit = useCallback(() => {
    setConfirmOpen(false);
    goHome();
  }, [goHome]);

  // Belt-and-braces: nag the browser if the tab is about to be torn down with
  // in-flight wizard state. Most modern browsers will replace whatever string
  // you pass with their own generic copy — what matters is returning truthy.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // S1 has nothing else to show in the right slot; S6 is a clean handoff so
  // we suppress Exit there too.
  const showExitButton = screen !== "S1" && screen !== "S6";
  const exitLabel = screen === "S7" ? "Exit studio" : "Exit";

  // Step indicator copy — different for S7 because the studio has its own
  // sub-steps (SS1–SS4) shown below in the StudioBreadcrumb.
  const stepCount = 7;
  const title =
    screen === "S6" && completedThroughStep >= 7
      ? "Profile Built"
      : meta.title;
  const stepCopy = screen === "S7"
      ? `Step ${meta.step} of ${stepCount} · ${meta.stepLabel}`
      : `Step ${meta.step} of ${stepCount} · ${title}`;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 pt-safe backdrop-blur">
        <div className="relative mx-auto flex w-full max-w-screen-2xl items-center gap-3 px-4 py-3">
          <HomeButton onClick={requestExit} dirty={dirty} />

          <span
            className="absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap label-mono text-gold sm:block"
            aria-current="step"
          >
            {stepCopy}
          </span>

          <div className="ml-auto hidden min-w-0 items-center justify-end gap-3 sm:flex">
            {subjectName && (
              <>
                <span className="hidden max-w-[min(28vw,18rem)] truncate font-body text-sm text-text md:inline">
                  {subjectName}
                </span>
                {isDemo && (
                  <span className="hidden lg:inline">
                    <Badge variant="gold">Demo profile</Badge>
                  </span>
                )}
              </>
            )}

          </div>

          {/* Mobile-only compressed center: step copy under the logo */}
          <div className="ml-1 flex min-w-0 flex-1 items-center sm:hidden">
            <span className="truncate label-mono text-gold">
              {stepCopy}
            </span>
          </div>

          {showExitButton && (
            <Button
              variant="ghost"
              size="small"
              onClick={requestExit}
              aria-label={`${exitLabel} and return to search`}
              className="touch-target shrink-0"
            >
              {exitLabel}
            </Button>
          )}
        </div>
      </header>

      <ConfirmDialog
        open={confirmOpen}
        title="Leave this draft?"
        description={
          <>
            <p>
              You have an in-flight draft for{" "}
              <span className="text-text">
                {subjectName ?? "an unnamed subject"}
              </span>
              . Going home returns you to search and clears it from this view.
            </p>
            <p className="mt-2 text-textmuted">
              Saved drafts in browser storage are not deleted — you can resume
              by reopening this tab.
            </p>
          </>
        }
        confirmLabel="Leave draft"
        cancelLabel="Stay here"
        destructive
        onConfirm={confirmAndExit}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

function HomeButton({
  onClick,
  dirty,
}: {
  onClick: () => void;
  dirty: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="RICON — return to search"
      title={dirty ? "Return to search (you'll be asked to confirm)" : "Return to search"}
      className="group touch-target -mx-2 flex shrink-0 items-center gap-2 rounded-md px-2 py-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <div>
        <p className="font-display text-lg leading-none tracking-wide text-gold transition-colors group-hover:text-gold/90">
          RICON
        </p>
        <p className="label-mono leading-tight">
          Voice Research Studio
        </p>
      </div>
    </button>
  );
}
