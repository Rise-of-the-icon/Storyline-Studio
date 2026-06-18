import { useEffect, useMemo, useRef, useState } from "react";
import { AudioPreview } from "@/shared/ui/AudioPreview";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { ParamBar } from "@/shared/ui/ParamBar";
import { useStudio } from "@/features/studio/StudioContext";
import { useTwin } from "@/app/providers/TwinContext";
import type { DigitalTwinProfile, TimelineEvent } from "@/types/twin";
import type { ResolverOutput } from "@/types/resolver";
import { NARRATIVE_GOAL_OPTIONS } from "./studioResolver";
import { InfoTip } from "./InfoTip";
import {
  ANCHORING_EVENT_DESCRIPTION,
  ANCHORING_EVENT_LABEL,
  AUDIENCE_DESCRIPTION,
  AUDIENCE_LABEL,
  CONFIDENCE_DESCRIPTION,
  CONFIDENCE_LABEL,
  CONVERSATION_MODE_DESCRIPTION,
  CONVERSATION_MODE_LABEL,
  EMOTIONAL_STATE_DESCRIPTION,
  EMOTIONAL_STATE_LABEL,
  INTENSITY_DESCRIPTION,
  INTENSITY_LABEL,
  NARRATIVE_GOAL_DESCRIPTION,
  NARRATIVE_GOAL_LABEL,
  PACING_DESCRIPTION,
  PACING_LABEL,
  STEERING_TAG_DESCRIPTION,
  STEERING_TAG_LABEL,
  VOICE_CONTEXT_PREVIEW_DESCRIPTION,
  VOICE_CONTEXT_PREVIEW_LABEL,
  WARMTH_DESCRIPTION,
  WARMTH_LABEL,
} from "./studioCopy";
import {
  appendSavedVoiceContext,
  badgeVariantForVoiceStatus,
  buildExportSummary,
  buildSampleScript,
  captureVoiceContext,
  exportSummaryFilename,
} from "./voiceContext";

type ResearchEmotionFamily =
  | "Intensity"
  | "Depth"
  | "Energy"
  | "Quiet"
  | "Character"
  | "Non-Verbal";

interface GeneratedClipInfo {
  family: ResearchEmotionFamily;
  model: string;
  generatedAtISO: string;
  cached: boolean;
}

interface CachedVoiceClip {
  audioBase64: string;
  meta: Record<string, unknown>;
  generatedAtISO: string;
  expiresAtISO?: string;
}

export interface VoiceScriptOption {
  id: string;
  question: string;
  answerScript: string;
  sourceNote: string;
}

interface VoiceContextPreviewProps {
  draft: DigitalTwinProfile;
  event: TimelineEvent;
  resolver: ResolverOutput;
  defaultVoiceId?: string;
  scriptOptions?: VoiceScriptOption[];
  /** Jump back to SS3 for further iteration. */
  onEditEmotionalContext: () => void;
}

const API_BASE =
  import.meta.env.VITE_TWIN_API_URL ||
  "https://ricon-storyline-production.up.railway.app";
const DEFAULT_WALT_VOICE_ID =
  import.meta.env.VITE_WALT_VOICE_ID || "default--z5zasdfwci5ofrt-gmsjw__walt";
const RESEARCH_EMOTION_OPTIONS: ResearchEmotionFamily[] = [
  "Intensity",
  "Depth",
  "Energy",
  "Quiet",
  "Character",
  "Non-Verbal",
];
const EMPTY_SCRIPT_OPTIONS: VoiceScriptOption[] = [];
const VOICE_CLIP_CACHE_STORAGE_KEY = "ricon:voice-preview:clips:v1";
const VOICE_CLIP_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const VOICE_CLIP_CACHE_LIMIT = 180;

const EMOTION_BUTTON_COPY: Record<
  ResearchEmotionFamily,
  { avatar: string; timing: string }
> = {
  Intensity: { avatar: "Amber glow ring", timing: "Normal" },
  Depth: { avatar: "Slow breath pulse", timing: "20% slower" },
  Energy: { avatar: "Rapid pulse", timing: "15% faster" },
  Quiet: { avatar: "Dim to 70%", timing: "30% slower" },
  Character: { avatar: "Static, centered", timing: "Normal" },
  "Non-Verbal": { avatar: "Single flare", timing: "Brief pause" },
};

function downloadTextFile(filename: string, body: string) {
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function audioUrlFromBase64(audioBase64: string): string {
  const bytes = Uint8Array.from(atob(audioBase64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: "audio/mp3" });
  return URL.createObjectURL(blob);
}

function voiceClipCacheKey(args: {
  text: string;
  emotionFamily: ResearchEmotionFamily;
  voiceId: string;
  modelId: string;
}): string {
  return JSON.stringify({
    text: args.text.trim(),
    emotionFamily: args.emotionFamily,
    voiceId: args.voiceId.trim(),
    modelId: args.modelId.trim(),
  });
}

function readPersistentVoiceClipCache(): Map<string, CachedVoiceClip> {
  try {
    const raw = window.localStorage.getItem(VOICE_CLIP_CACHE_STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, CachedVoiceClip>;
    const now = Date.now();
    const entries = Object.entries(parsed).filter(([, clip]) => {
      if (!clip || typeof clip.audioBase64 !== "string") return false;
      if (!clip.expiresAtISO) return true;
      const expiresAt = Date.parse(clip.expiresAtISO);
      return Number.isFinite(expiresAt) && expiresAt > now;
    });
    entries.sort(
      (a, b) => Date.parse(b[1].generatedAtISO) - Date.parse(a[1].generatedAtISO),
    );
    return new Map(entries.slice(0, VOICE_CLIP_CACHE_LIMIT));
  } catch {
    return new Map();
  }
}

function persistVoiceClipCache(cache: Map<string, CachedVoiceClip>): void {
  try {
    const now = Date.now();
    const entries = [...cache.entries()]
      .filter(([, clip]) => {
        if (!clip.expiresAtISO) return true;
        const expiresAt = Date.parse(clip.expiresAtISO);
        return Number.isFinite(expiresAt) && expiresAt > now;
      })
      .sort(
        (a, b) => Date.parse(b[1].generatedAtISO) - Date.parse(a[1].generatedAtISO),
      )
      .slice(0, VOICE_CLIP_CACHE_LIMIT);

    const serializable: Record<string, CachedVoiceClip> = {};
    entries.forEach(([key, clip]) => {
      serializable[key] = clip;
    });

    window.localStorage.setItem(
      VOICE_CLIP_CACHE_STORAGE_KEY,
      JSON.stringify(serializable),
    );
  } catch {
    // localStorage is best-effort only; synthesis still works without persistence.
  }
}

function inferResearchEmotionFamily(
  resolver: ResolverOutput,
): ResearchEmotionFamily {
  const text =
    `${resolver.winningFamily} ${resolver.signatureState} ${resolver.direction} ${resolver.beats.map((beat) => `${beat.state} ${beat.steeringTag}`).join(" ")}`.toLowerCase();

  if (text.includes("[breathe]") || text.includes("pause")) return "Non-Verbal";
  if (
    /quiet|hush|minor|empty|fade|ethereal|dream|halo|somber|melancholic/.test(
      text,
    )
  ) {
    return resolver.intensity < 45 || resolver.pacing < 42 ? "Quiet" : "Depth";
  }
  if (/soulful|reflective|legacy|confession|groove|gravitas/.test(text)) {
    return "Depth";
  }
  if (
    resolver.pacing >= 72 ||
    /energy|anthem|celebrat|party|chart|surge/.test(text)
  ) {
    return "Energy";
  }
  if (resolver.intensity >= 70 || /raw|competitive|pressure|edge/.test(text)) {
    return "Intensity";
  }
  return "Character";
}

function buildSynthesisScript(args: {
  event: TimelineEvent;
  resolver: ResolverOutput;
  mode: string;
}): string {
  const { event, resolver, mode } = args;
  const memory =
    event.id === "walt-liquor-fake-it-till-you-make-it-2020"
      ? "In December 2020, I got my first chance to music supervise a major television production. I had not done it before, but I told the producers I knew what I was doing. One producer believed in the unconventional sound enough to give me room to fix mistakes before they became visible. The work fit the show, and All The Queen's Men became proof that my instincts could open a real door."
      : event.id === "evt-tom-hoover-pro"
        ? "I earned professional minutes by staying prepared, communicating, and making efficient plays inside the rotation. I learned that trust does not arrive all at once. It is built through the details, through the next possession, and through the way I help steady the people around me."
      : (event.summary || event.description).trim();
  const feeling = resolver.signatureState.toLowerCase();

  if (mode === "Narrator") {
    return `I remember "${event.title}" as a moment where the path started to make sense. ${memory} I want the voice to carry ${feeling}: honest, grounded, and close to the truth of the moment.`;
  }

  if (mode === "Documentary") {
    return `When I look back on "${event.title}", I hear the lesson before I hear the applause. ${memory} That moment taught me to trust the process, even when I was still learning how to stand inside it.`;
  }

  return `For me, "${event.title}" was about trusting the process before I had proof. ${memory} I had to believe the unconventional path could still be the right one.`;
}

export function VoiceContextPreview({
  draft,
  event,
  resolver,
  defaultVoiceId = DEFAULT_WALT_VOICE_ID,
  scriptOptions = EMPTY_SCRIPT_OPTIONS,
  onEditEmotionalContext,
}: VoiceContextPreviewProps) {
  const { scene } = useStudio();
  const { updateDraft } = useTwin();
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [voiceId, setVoiceId] = useState(defaultVoiceId);
  const [modelId, setModelId] = useState("inworld-tts-2");
  const [emotionFamily, setEmotionFamily] =
    useState<ResearchEmotionFamily>(() => inferResearchEmotionFamily(resolver));
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [generatedClip, setGeneratedClip] = useState<GeneratedClipInfo | null>(
    null,
  );
  const [synthesisStatus, setSynthesisStatus] = useState<
    "idle" | "generating" | "ready" | "error"
  >("idle");
  const [synthesisError, setSynthesisError] = useState("");
  const [synthesisMeta, setSynthesisMeta] = useState<Record<string, unknown> | null>(
    null,
  );
  const [selectedScriptId, setSelectedScriptId] = useState(
    scriptOptions[0]?.id ?? "",
  );
  const voiceClipCacheRef = useRef<Map<string, CachedVoiceClip>>(new Map());

  useEffect(() => {
    voiceClipCacheRef.current = readPersistentVoiceClipCache();
  }, []);

  const sampleScript = useMemo(
    () =>
      buildSampleScript({
        subjectName: draft.coreIdentity.name,
        event,
        scene,
        resolver,
      }),
    [draft.coreIdentity.name, event, scene, resolver],
  );

  const narrativeGoalLabel =
    NARRATIVE_GOAL_OPTIONS.find((g) => g.id === scene.narrativeGoalId)?.label ??
    scene.narrativeGoalId;
  const steeringTag =
    resolver.beats[resolver.beats.length - 1]?.steeringTag ?? "—";
  const selectedScriptOption =
    scriptOptions.find((option) => option.id === selectedScriptId) ??
    scriptOptions[0] ??
    null;
  const synthesisScript = useMemo(
    () => {
      if (selectedScriptOption) return selectedScriptOption.answerScript;
      return buildSynthesisScript({
        event,
        resolver,
        mode: scene.mode,
      });
    },
    [event, resolver, scene.mode, selectedScriptOption],
  );

  useEffect(() => {
    setVoiceId(defaultVoiceId);
  }, [defaultVoiceId]);

  useEffect(() => {
    setEmotionFamily(inferResearchEmotionFamily(resolver));
    setSelectedScriptId(scriptOptions[0]?.id ?? "");
    setSynthesisStatus("idle");
    setSynthesisError("");
    setSynthesisMeta(null);
    setGeneratedClip(null);
    setAudioSrc((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, [resolver, scene.mode, event.id, scriptOptions]);

  useEffect(() => {
    return () => {
      if (audioSrc) URL.revokeObjectURL(audioSrc);
    };
  }, [audioSrc]);

  const handleSave = () => {
    const snapshot = captureVoiceContext({
      event,
      scene,
      resolver,
      sampleScript,
    });
    updateDraft((prev) => appendSavedVoiceContext(prev, snapshot));
    setSaveState("saved");
  };

  const handleExport = () => {
    const snapshot = captureVoiceContext({
      event,
      scene,
      resolver,
      sampleScript,
    });
    const body = buildExportSummary({
      subjectName: draft.coreIdentity.name,
      context: snapshot,
      voiceStatus: "api-connected",
    });
    const filename = exportSummaryFilename({
      subjectName: draft.coreIdentity.name,
      context: snapshot,
    });
    downloadTextFile(filename, body);
  };

  const loadVoicePreview = async (
    family: ResearchEmotionFamily,
    text = synthesisScript,
  ) => {
    setSynthesisError("");
    setSynthesisMeta(null);
    const trimmedVoiceId = voiceId.trim();
    const resolvedModelId = modelId.trim() || "inworld-tts-2";
    if (!trimmedVoiceId) {
      setSynthesisStatus("error");
      setSynthesisError("A cloned Inworld voice ID is required.");
      return;
    }

    const cacheKey = voiceClipCacheKey({
      text,
      emotionFamily: family,
      voiceId: trimmedVoiceId,
      modelId: resolvedModelId,
    });
    const cachedClip = voiceClipCacheRef.current.get(cacheKey);
    if (cachedClip) {
      if (
        cachedClip.expiresAtISO &&
        Number.isFinite(Date.parse(cachedClip.expiresAtISO)) &&
        Date.parse(cachedClip.expiresAtISO) <= Date.now()
      ) {
        voiceClipCacheRef.current.delete(cacheKey);
        persistVoiceClipCache(voiceClipCacheRef.current);
      } else {
        const nextUrl = audioUrlFromBase64(cachedClip.audioBase64);
        setAudioSrc((current) => {
          if (current) URL.revokeObjectURL(current);
          return nextUrl;
        });
        setSynthesisMeta({
          ...cachedClip.meta,
          cached: true,
          client_cached: true,
        });
        setGeneratedClip({
          family,
          model: String(cachedClip.meta.model ?? resolvedModelId),
          generatedAtISO: cachedClip.generatedAtISO,
          cached: true,
        });
        setSynthesisStatus("ready");
        return;
      }
    }

    setSynthesisStatus("generating");
    try {
      const response = await fetch(
        `${API_BASE.replace(/\/$/, "")}/api/research/voice/speak`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            emotion_family: family,
            voice_id: trimmedVoiceId,
            model_id: resolvedModelId,
          }),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? `Voice synthesis failed (${response.status})`);
      }
      const payload = (await response.json()) as {
        audio_base64: string;
        meta: Record<string, unknown>;
      };
      const generatedAtISO = new Date().toISOString();
      const expiresAtISO = new Date(
        Date.now() + VOICE_CLIP_CACHE_TTL_MS,
      ).toISOString();
      voiceClipCacheRef.current.set(cacheKey, {
        audioBase64: payload.audio_base64,
        meta: payload.meta,
        generatedAtISO,
        expiresAtISO,
      });
      persistVoiceClipCache(voiceClipCacheRef.current);
      const nextUrl = audioUrlFromBase64(payload.audio_base64);
      setAudioSrc((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextUrl;
      });
      setSynthesisMeta(payload.meta);
      setGeneratedClip({
        family,
        model: String(payload.meta.model ?? resolvedModelId),
        generatedAtISO,
        cached: payload.meta.cached === true,
      });
      setSynthesisStatus("ready");
    } catch (err) {
      setSynthesisStatus("error");
      setSynthesisError(
        err instanceof Error ? err.message : "Voice synthesis failed.",
      );
    }
  };

  const handleEmotionFamilyChange = (nextFamily: ResearchEmotionFamily) => {
    if (synthesisStatus === "generating") return;
    setEmotionFamily(nextFamily);
    void loadVoicePreview(nextFamily);
  };

  const handleScriptOptionChange = (option: VoiceScriptOption) => {
    if (synthesisStatus === "generating") return;
    setSelectedScriptId(option.id);
    void loadVoicePreview(emotionFamily, option.answerScript);
  };

  const handleGenerateVoice = async () => {
    await loadVoicePreview(emotionFamily);
  };

  return (
    <section
      aria-labelledby="voice-context-preview-heading"
      className="space-y-6 text-left"
    >
      <header className="flex flex-wrap items-center gap-3">
        <h2
          id="voice-context-preview-heading"
          className="font-display text-2xl tracking-wide text-text"
        >
          Voice Context Preview
        </h2>
        <InfoTip
          label={VOICE_CONTEXT_PREVIEW_LABEL}
          description={VOICE_CONTEXT_PREVIEW_DESCRIPTION}
        />
        <Badge variant={badgeVariantForVoiceStatus("api-connected")}>
          Inworld connected
        </Badge>
      </header>

      <p className="font-body text-sm text-textsub">
        Generate a cloned-voice preview from the locked performance context.
        The backend keeps the Inworld API key server-side and applies the
        selected emotion family as TTS steering.
      </p>

      <div
        className="rounded-lg border border-border bg-card p-5"
        aria-labelledby="voice-synthesis-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p id="voice-synthesis-heading" className="label-mono text-gold">
              Inworld synthesis
            </p>
            <p className="mt-2 font-body text-sm text-textsub">
              Uses Walt's cloned voice by default. Change the voice ID only when
              testing another approved clone.
            </p>
          </div>
          <Badge variant={synthesisStatus === "ready" ? "ok" : "muted"}>
              {synthesisStatus === "generating"
                ? "Generating"
                : synthesisStatus === "ready"
                ? generatedClip?.cached
                  ? "Cached clip"
                  : "Clip ready"
                : "Ready"}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_160px]">
          <label className="block">
            <span className="label-mono">Voice ID</span>
            <input
              className="mt-2 w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-text outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
              value={voiceId}
              onChange={(event) => setVoiceId(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="label-mono">Model</span>
            <input
              className="mt-2 w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-text outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
              value={modelId}
              onChange={(event) => setModelId(event.target.value)}
            />
          </label>
        </div>

        {scriptOptions.length > 0 && (
          <div className="mt-5">
            <p className="label-mono">Preview question</p>
            <div
              className="mt-2 grid gap-2"
              role="tablist"
              aria-label="Preview question"
            >
              {scriptOptions.map((option) => {
                const selected = selectedScriptOption?.id === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    disabled={synthesisStatus === "generating"}
                    onClick={() => handleScriptOptionChange(option)}
                    className={[
                      "rounded-md border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-55",
                      selected
                        ? "border-gold bg-goldfaint text-text"
                        : "border-border bg-bg text-textsub hover:bg-hover",
                    ].join(" ")}
                  >
                    <span className="block font-body text-sm font-semibold">
                      {option.question}
                    </span>
                    <span className="mt-1 block font-mono text-xs text-textmuted">
                      {option.sourceNote}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-md border border-border bg-bg p-3">
          <p className="label-mono">
            {selectedScriptOption ? "Answer script" : "Generated voice script"}
          </p>
          {selectedScriptOption && (
            <p className="mt-2 font-body text-sm font-semibold text-text">
              {selectedScriptOption.question}
            </p>
          )}
          <p className="mt-2 whitespace-pre-line font-serif text-base italic leading-relaxed text-text">
            {synthesisScript}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            onClick={handleGenerateVoice}
            disabled={synthesisStatus === "generating"}
          >
            {synthesisStatus === "generating"
              ? "Generating voice..."
              : "Generate voice preview"}
          </Button>
          {synthesisMeta && (
            <span className="font-mono text-xs text-textsub">
              {synthesisMeta.cached === true ? "Loaded from cache" : "Generated"} ·{" "}
              {String(synthesisMeta.model ?? modelId)} ·{" "}
              {String(synthesisMeta.emotion_family ?? emotionFamily)}
            </span>
          )}
        </div>

        {synthesisError && (
          <p className="mt-3 rounded-md border border-danger/40 bg-dangerfaint px-3 py-2 font-body text-sm text-danger">
            {synthesisError}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-5">
          <p className="label-mono">Emotion tone</p>
          <div
            className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
            role="radiogroup"
            aria-label="Emotion tone"
          >
            {RESEARCH_EMOTION_OPTIONS.map((option) => {
              const selected = emotionFamily === option;
              const disabled = synthesisStatus === "generating";
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => handleEmotionFamilyChange(option)}
                  className={[
                    "rounded-md border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-55",
                    selected
                      ? "border-gold bg-goldfaint text-text"
                      : "border-border bg-bg text-textsub hover:bg-hover",
                  ].join(" ")}
                >
                  <span className="block font-body text-sm font-semibold">
                    {option}
                  </span>
                  <span className="mt-1 block font-mono text-xs">
                    {EMOTION_BUTTON_COPY[option].avatar}
                  </span>
                  <span className="mt-1 block font-mono text-xs text-textmuted">
                    {EMOTION_BUTTON_COPY[option].timing}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label-mono">Current generated clip</p>
            <p className="mt-1 font-body text-sm text-textsub">
              {generatedClip
                ? `${generatedClip.family} · ${generatedClip.model} · ${generatedClip.cached ? "cached" : "new"}`
                : "No clip generated yet"}
            </p>
          </div>
          {generatedClip && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="gold">{generatedClip.family}</Badge>
              <Badge variant={generatedClip.cached ? "muted" : "ok"}>
                {generatedClip.cached ? "Cached" : "Generated"}
              </Badge>
            </div>
          )}
        </div>
        <AudioPreview
          src={audioSrc}
          title={`${draft.coreIdentity.name} — ${generatedClip?.family ?? "voice preview"} — ${event.title}`}
          disabledNote="No synthesized clip yet. Generate a voice preview above."
        />
      </div>

      <div
        className="rounded-lg border border-border bg-panel p-5"
        aria-labelledby="vcp-context-heading"
      >
        <p
          id="vcp-context-heading"
          className="label-mono"
        >
          Resolved performance context
        </p>

        <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="flex flex-wrap items-center gap-1.5 label-mono">
              <span>Selected event</span>
              <InfoTip
                label={ANCHORING_EVENT_LABEL}
                description={ANCHORING_EVENT_DESCRIPTION}
              />
            </dt>
            <dd className="mt-1 font-body text-text">
              {event.title}{" "}
              <span className="text-textsub">({event.year})</span>
            </dd>
          </div>
          <div>
            <dt className="flex flex-wrap items-center gap-1.5 label-mono">
              <span>Audience</span>
              <InfoTip
                label={AUDIENCE_LABEL}
                description={AUDIENCE_DESCRIPTION}
              />
            </dt>
            <dd className="mt-1 font-body text-text">{scene.audience}</dd>
          </div>
          <div>
            <dt className="flex flex-wrap items-center gap-1.5 label-mono">
              <span>Conversation mode</span>
              <InfoTip
                label={CONVERSATION_MODE_LABEL}
                description={CONVERSATION_MODE_DESCRIPTION}
              />
            </dt>
            <dd className="mt-1 font-body text-text">{scene.mode}</dd>
          </div>
          <div>
            <dt className="flex flex-wrap items-center gap-1.5 label-mono">
              <span>Narrative goal</span>
              <InfoTip
                label={NARRATIVE_GOAL_LABEL}
                description={NARRATIVE_GOAL_DESCRIPTION}
              />
            </dt>
            <dd className="mt-1 font-body text-text">{narrativeGoalLabel}</dd>
          </div>
          <div>
            <dt className="flex flex-wrap items-center gap-1.5 label-mono">
              <span>Emotional state</span>
              <InfoTip
                label={EMOTIONAL_STATE_LABEL}
                description={EMOTIONAL_STATE_DESCRIPTION}
              />
            </dt>
            <dd className="mt-1 font-body text-text">
              {resolver.signatureState}
              <span className="ml-2 font-mono text-xs text-textsub">
                {resolver.winningFamily} · {resolver.direction}
              </span>
            </dd>
          </div>
          <div>
            <dt className="flex flex-wrap items-center gap-1.5 label-mono">
              <span>Steering tag</span>
              <InfoTip
                label={STEERING_TAG_LABEL}
                description={STEERING_TAG_DESCRIPTION}
              />
            </dt>
            <dd className="mt-1">
              <Badge variant="gold">{steeringTag}</Badge>
            </dd>
          </div>
        </dl>

        <div className="mt-5 space-y-3">
          <ParamBar
            label="Intensity"
            value={resolver.intensity}
            labelTrailing={
              <InfoTip
                label={INTENSITY_LABEL}
                description={INTENSITY_DESCRIPTION}
              />
            }
          />
          <ParamBar
            label="Warmth"
            value={resolver.warmth}
            labelTrailing={
              <InfoTip label={WARMTH_LABEL} description={WARMTH_DESCRIPTION} />
            }
          />
          <ParamBar
            label="Pacing"
            value={resolver.pacing}
            labelTrailing={
              <InfoTip label={PACING_LABEL} description={PACING_DESCRIPTION} />
            }
          />
          <ParamBar
            label="Confidence"
            value={resolver.confidence}
            labelTrailing={
              <InfoTip
                label={CONFIDENCE_LABEL}
                description={CONFIDENCE_DESCRIPTION}
              />
            }
          />
        </div>
      </div>

      <div
        className="rounded-lg border-l-2 border-gold bg-card p-5"
        aria-labelledby="vcp-script-heading"
      >
        <div className="flex flex-wrap items-center gap-2">
          <p
            id="vcp-script-heading"
            className="label-mono text-gold"
          >
            Sample script
          </p>
          <Badge variant="muted">Illustrative — not synthesized</Badge>
        </div>
        <p className="mt-3 whitespace-pre-line font-serif text-base italic leading-relaxed text-text">
          {sampleScript}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onEditEmotionalContext}>
          Edit emotional context
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          aria-live="polite"
          disabled={saveState === "saved"}
        >
          {saveState === "saved" ? "Saved ✓" : "Save voice context"}
        </Button>
        <Button variant="ghost" onClick={handleExport}>
          Export summary
        </Button>
      </div>

      {saveState === "saved" && (
        <p className="font-mono text-xs text-textsub" role="status">
          Snapshot added to the draft ({draft.savedVoiceContexts?.length ?? 0}{" "}
          total). Export downloads always reflect the current resolver output.
        </p>
      )}
    </section>
  );
}
