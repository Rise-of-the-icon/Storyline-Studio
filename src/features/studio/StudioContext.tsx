import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DigitalTwinProfile } from "@/types/twin";
import type { ResolverOutput } from "@/types/resolver";
import { getDemoSubjectForTwin } from "@/data/demoSubjects";
import {
  DEFAULT_SCENE,
  inferStudioDomain,
  runResolver,
  type StudioSceneSettings,
} from "@/features/studio/studioResolver";

export interface StudioContextValue {
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  scene: StudioSceneSettings;
  setScene: React.Dispatch<React.SetStateAction<StudioSceneSettings>>;
  resolverOutput: ResolverOutput | null;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({
  draft,
  children,
}: {
  draft: DigitalTwinProfile;
  children: ReactNode;
}) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [scene, setScene] = useState<StudioSceneSettings>(() => {
    const demo = getDemoSubjectForTwin(draft);
    if (demo) {
      return {
        domain: inferStudioDomain(draft),
        audience: demo.voiceProfile.defaultAudience,
        mode: demo.voiceProfile.defaultMode,
        narrativeGoalId: demo.voiceProfile.defaultNarrativeGoal,
      };
    }
    return { ...DEFAULT_SCENE, domain: inferStudioDomain(draft) };
  });

  const resolverOutput = useMemo(
    () => runResolver(draft, selectedEventId, scene),
    [draft, selectedEventId, scene],
  );

  const value = useMemo(
    () => ({
      selectedEventId,
      setSelectedEventId,
      scene,
      setScene,
      resolverOutput,
    }),
    [selectedEventId, scene, resolverOutput],
  );

  return (
    <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
  );
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error("useStudio must be used within StudioProvider");
  }
  return ctx;
}
