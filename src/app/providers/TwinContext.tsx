import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getBackScreen,
  getForwardScreen,
  getBackStudioStep,
  getForwardStudioStep,
  GUARDRAIL_REJECTION_SCREEN,
} from "@/app/navigation/navigation";
import { getDemoSubjectById } from "@/data/demoSubjects";
import {
  deleteActiveDraft,
  getDraft,
  saveTwin,
  setDraft as persistDraftId,
} from "@/lib/storage";
import { createDraftFromDemoSubject } from "@/features/search/wikipedia";
import type { DigitalTwinProfile } from "@/types/twin";
import {
  SCREEN_META,
  type ScreenId,
  type StudioStepId,
} from "@/types/navigation";

export interface TwinContextValue {
  screen: ScreenId;
  studioStep: StudioStepId;
  draft: DigitalTwinProfile | null;
  wizardStep: number;
  completedThroughStep: number;
  goTo: (screen: ScreenId) => void;
  goBack: () => void;
  goForward: () => void;
  /**
   * Reset navigation to the landing screen (S1). Does **not** delete the
   * persisted draft — it just clears the in-memory draft so the next visit
   * to S1 starts clean. The persisted draft remains in `localStorage` and
   * will rehydrate on a fresh boot.
   *
   * Caller is responsible for confirmation when
   * `hasUnsavedProgress(draft, screen)` is true — see `AppHeader`.
   */
  goHome: () => void;
  rejectToCustomMoments: () => void;
  setDraft: (draft: DigitalTwinProfile | null) => void;
  updateDraft: (updater: (prev: DigitalTwinProfile) => DigitalTwinProfile) => void;
  persistDraft: () => void;
  /**
   * Hard-delete the persisted draft + the in-memory draft + the index
   * entry. Used by the S1 "Clear draft" action (with confirmation). Does
   * not navigate — caller stays on S1 after the clear.
   */
  clearDraft: () => void;
  setStudioStep: (step: StudioStepId) => void;
  advanceStudioStep: () => void;
  backStudioStep: () => void;
  /**
   * Opt-in demo path. Builds a real demo twin from `DEMO_SUBJECTS`
   * (e.g. David West, Tom Hoover, Walt Taylor) and advances to S2. This is the
   * **only** sanctioned way to load a demo subject — there is no silent
   * fallback that mints a fake "Demo Subject" placeholder anywhere else.
   */
  useDemoSubject: (demoSubjectId: string) => boolean;
}

const TwinContext = createContext<TwinContextValue | null>(null);

function stepForScreen(screen: ScreenId): number {
  return SCREEN_META[screen].step;
}

export function TwinProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<ScreenId>("S1");
  const [studioStep, setStudioStep] = useState<StudioStepId>("SS1");
  const [draft, setDraftState] = useState<DigitalTwinProfile | null>(null);
  const [completedThroughStep, setCompletedThroughStep] = useState(1);

  const wizardStep = stepForScreen(screen);

  useEffect(() => {
    const stored = getDraft();
    if (stored) {
      setDraftState(stored);
      setCompletedThroughStep((prev) => Math.max(prev, 2));
    }
  }, []);

  const persistDraft = useCallback(() => {
    if (!draft) return;
    const saved = saveTwin(draft);
    if (saved) {
      persistDraftId(saved.twinId);
      // Keep the in-memory copy in sync with the lastSavedAtISO stamp the
      // storage layer just minted, so AppHeader / S6 see the freshest time.
      setDraftState(saved);
    }
  }, [draft]);

  const setDraft = useCallback((next: DigitalTwinProfile | null) => {
    if (!next) {
      setDraftState(null);
      return;
    }
    const saved = saveTwin(next);
    if (saved) {
      setDraftState(saved);
      persistDraftId(saved.twinId);
    } else {
      // Persistence failed (quota, private-mode iOS, etc.). Surface the
      // unpersisted twin so the user doesn't lose in-memory work; the next
      // updateDraft attempt will retry.
      setDraftState(next);
    }
  }, []);

  /**
   * Pure navigation. Does NOT fabricate a draft — the previous implementation
   * silently created a `createMockTwin("Demo Subject")` placeholder here,
   * which clobbered any real Wikipedia draft that S1 had just set in the same
   * synchronous handler. Each screen that requires a draft (S2–S7) guards
   * itself via `if (!draft) goTo("S1")`.
   */
  const goTo = useCallback((next: ScreenId) => {
    setScreen(next);
    setCompletedThroughStep((prev) => Math.max(prev, stepForScreen(next)));
    if (next === "S7") setStudioStep("SS1");
  }, []);

  const goBack = useCallback(() => {
    const target = getBackScreen(screen);
    if (target) goTo(target);
  }, [screen, goTo]);

  const goForward = useCallback(() => {
    const target = getForwardScreen(screen);
    if (target) goTo(target);
  }, [screen, goTo]);

  const goHome = useCallback(() => {
    setDraftState(null);
    setStudioStep("SS1");
    setScreen("S1");
    setCompletedThroughStep(1);
  }, []);

  const rejectToCustomMoments = useCallback(() => {
    goTo(GUARDRAIL_REJECTION_SCREEN);
  }, [goTo]);

  const clearDraft = useCallback(() => {
    deleteActiveDraft();
    setDraftState(null);
    setStudioStep("SS1");
    setScreen("S1");
    setCompletedThroughStep(1);
  }, []);

  const updateDraft = useCallback(
    (updater: (prev: DigitalTwinProfile) => DigitalTwinProfile) => {
      setDraftState((prev) => {
        if (!prev) {
          // Caller bug: every screen that mutates the draft must guard with
          // `if (!draft) return`. Warn instead of fabricating a fake twin.
          console.warn(
            "[TwinContext] updateDraft called with no draft; ignoring.",
          );
          return prev;
        }
        const next = updater(prev);
        const saved = saveTwin(next);
        if (saved) {
          persistDraftId(saved.twinId);
          // Use the saved copy (carries `lastSavedAtISO`) for in-memory.
          return saved;
        }
        // Save failed — keep the in-memory edit so the producer's keystrokes
        // aren't lost. The next edit will retry; the AppHeader still shows
        // the previous lastSavedAtISO until persistence succeeds again.
        return next;
      });
    },
    [],
  );

  const advanceStudioStep = useCallback(() => {
    const next = getForwardStudioStep(studioStep);
    if (next) setStudioStep(next);
  }, [studioStep]);

  const backStudioStep = useCallback(() => {
    const prev = getBackStudioStep(studioStep);
    if (prev) setStudioStep(prev);
  }, [studioStep]);

  const useDemoSubject = useCallback((demoSubjectId: string): boolean => {
    const subject = getDemoSubjectById(demoSubjectId);
    if (!subject) {
      console.warn(
        `[TwinContext] useDemoSubject: unknown id "${demoSubjectId}"`,
      );
      return false;
    }
    const next = createDraftFromDemoSubject(subject);
    const saved = saveTwin(next);
    setDraftState(saved ?? next);
    if (saved) persistDraftId(saved.twinId);
    setScreen("S2");
    setCompletedThroughStep((prev) => Math.max(prev, stepForScreen("S2")));
    return true;
  }, []);

  const value = useMemo<TwinContextValue>(
    () => ({
      screen,
      studioStep,
      draft,
      wizardStep,
      completedThroughStep,
      goTo,
      goBack,
      goForward,
      goHome,
      rejectToCustomMoments,
      setDraft,
      updateDraft,
      persistDraft,
      clearDraft,
      setStudioStep,
      advanceStudioStep,
      backStudioStep,
      useDemoSubject,
    }),
    [
      screen,
      studioStep,
      draft,
      wizardStep,
      completedThroughStep,
      goTo,
      goBack,
      goForward,
      goHome,
      rejectToCustomMoments,
      setDraft,
      updateDraft,
      persistDraft,
      clearDraft,
      advanceStudioStep,
      backStudioStep,
      useDemoSubject,
    ],
  );

  return (
    <TwinContext.Provider value={value}>{children}</TwinContext.Provider>
  );
}

export function useTwin(): TwinContextValue {
  const ctx = useContext(TwinContext);
  if (!ctx) {
    throw new Error("useTwin must be used within TwinProvider");
  }
  return ctx;
}
