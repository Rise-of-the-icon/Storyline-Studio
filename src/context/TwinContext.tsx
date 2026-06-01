import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createMockTwin } from "../dev/mockTwin";
import {
  getBackScreen,
  getForwardScreen,
  getBackStudioStep,
  getForwardStudioStep,
  GUARDRAIL_REJECTION_SCREEN,
} from "../lib/navigation";
import { getDraft, saveTwin, setDraft as persistDraftId } from "../lib/storage";
import type { DigitalTwinProfile } from "../types/twin";
import {
  SCREEN_META,
  type ScreenId,
  type StudioStepId,
} from "../types/navigation";

export interface TwinContextValue {
  screen: ScreenId;
  studioStep: StudioStepId;
  draft: DigitalTwinProfile | null;
  wizardStep: number;
  completedThroughStep: number;
  goTo: (screen: ScreenId) => void;
  goBack: () => void;
  goForward: () => void;
  rejectToCustomMoments: () => void;
  setDraft: (draft: DigitalTwinProfile | null) => void;
  updateDraft: (updater: (prev: DigitalTwinProfile) => DigitalTwinProfile) => void;
  persistDraft: () => void;
  setStudioStep: (step: StudioStepId) => void;
  advanceStudioStep: () => void;
  backStudioStep: () => void;
}

const TwinContext = createContext<TwinContextValue | null>(null);

function stepForScreen(screen: ScreenId): number {
  return SCREEN_META[screen].step;
}

function needsDraft(screen: ScreenId): boolean {
  return screen !== "S1";
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
    saveTwin(draft);
    persistDraftId(draft.twinId);
  }, [draft]);

  const setDraft = useCallback((next: DigitalTwinProfile | null) => {
    setDraftState(next);
    if (next) {
      saveTwin(next);
      persistDraftId(next.twinId);
    }
  }, []);

  const ensureDraft = useCallback((): DigitalTwinProfile => {
    if (draft) return draft;
    const created = createMockTwin("Demo Subject");
    setDraftState(created);
    saveTwin(created);
    persistDraftId(created.twinId);
    return created;
  }, [draft]);

  const goTo = useCallback(
    (next: ScreenId) => {
      if (needsDraft(next)) ensureDraft();
      setScreen(next);
      const step = stepForScreen(next);
      setCompletedThroughStep((prev) => Math.max(prev, step));
      if (next === "S7") setStudioStep("SS1");
    },
    [ensureDraft],
  );

  const goBack = useCallback(() => {
    const target = getBackScreen(screen);
    if (target) goTo(target);
  }, [screen, goTo]);

  const goForward = useCallback(() => {
    const target = getForwardScreen(screen);
    if (target) goTo(target);
  }, [screen, goTo]);

  const rejectToCustomMoments = useCallback(() => {
    goTo(GUARDRAIL_REJECTION_SCREEN);
  }, [goTo]);

  const updateDraft = useCallback(
    (updater: (prev: DigitalTwinProfile) => DigitalTwinProfile) => {
      setDraftState((prev) => {
        const base = prev ?? ensureDraft();
        const next = updater(base);
        saveTwin(next);
        persistDraftId(next.twinId);
        return next;
      });
    },
    [ensureDraft],
  );

  const advanceStudioStep = useCallback(() => {
    const next = getForwardStudioStep(studioStep);
    if (next) setStudioStep(next);
  }, [studioStep]);

  const backStudioStep = useCallback(() => {
    const prev = getBackStudioStep(studioStep);
    if (prev) setStudioStep(prev);
  }, [studioStep]);

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
      rejectToCustomMoments,
      setDraft,
      updateDraft,
      persistDraft,
      setStudioStep,
      advanceStudioStep,
      backStudioStep,
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
      rejectToCustomMoments,
      setDraft,
      updateDraft,
      persistDraft,
      advanceStudioStep,
      backStudioStep,
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
