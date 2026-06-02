/**
 * Canonical copy for the Voice Studio (S7). Three families of constants
 * live here:
 *
 *  1. **Glossary** — every specialized term gets a `_LABEL` (the short
 *     uppercase eyebrow we show in the tooltip header) and a `_DESCRIPTION`
 *     (one or two cinematic-but-professional sentences explaining the term
 *     in plain language). Caps at ≤ 220 chars so the same string fits
 *     a `<Tooltip>` body and an inline helper paragraph.
 *
 *  2. **ResolverPanel labels** — the eyebrows / section names the panel and
 *     `whyThisFeeling.ts` consume. Pinned so a future rewrite of the panel
 *     can't accidentally drift the producer-facing vocabulary.
 *
 *  3. **TwinChat copy** — every brief-mandated string the chat surface
 *     renders (placeholder, prompt chips, gate hints, demo disclaimer,
 *     insufficient-source line, source attribution, loading / error /
 *     retry copy). Pinned by `twinChat.test.ts` so the exact wording is
 *     stable across the demo seam in `lib/ai.ts` and the chat component.
 *
 * Centralized here so:
 *  - A copy change happens in one place + ships consistently.
 *  - Tests can pin exact strings without grepping JSX.
 *  - Localization (later) has a single import target.
 *
 * Naming convention: `<TERM>_LABEL` and `<TERM>_DESCRIPTION` for glossary;
 * `CHAT_*` for chat copy. Group related constants with section comments so
 * the file reads as a glossary.
 */

// ---------------------------------------------------------------------------
// Workflow primitives
// ---------------------------------------------------------------------------

export const RESOLVER_LABEL = "Resolver";
export const RESOLVER_DESCRIPTION =
  "A deterministic, pure-function resolver that maps a chosen moment, scene context, and emotional family to a steering tag. Same inputs always produce the same output — no AI guessing.";

export const ANCHORING_EVENT_LABEL = "Anchoring event";
export const ANCHORING_EVENT_DESCRIPTION =
  "The producer-approved timeline moment the studio voices against. Only events marked Reviewed in timeline review are eligible — the studio does not ratify content.";

export const SCENE_CONTEXT_LABEL = "Scene context";
export const SCENE_CONTEXT_DESCRIPTION =
  "The audience, conversation mode, and narrative goal that shape how the moment is voiced. Changing any input re-runs the resolver live.";

// ---------------------------------------------------------------------------
// Scene inputs (SS2)
// ---------------------------------------------------------------------------

export const AUDIENCE_LABEL = "Audience";
export const AUDIENCE_DESCRIPTION =
  "Who the subject is speaking to. Arena projects to a crowd, Intimate sits close-mic, Broadcast holds a neutral camera-ready frame, and Peers is conversational with equals.";

export const CONVERSATION_MODE_LABEL = "Conversation mode";
export const CONVERSATION_MODE_DESCRIPTION =
  "The speaking register the moment is delivered in — Narrator (third-person framing), Q&A (first-person response), or Documentary (reflective recall).";

export const NARRATIVE_GOAL_LABEL = "Narrative goal";
export const NARRATIVE_GOAL_DESCRIPTION =
  "What the producer wants the moment to communicate. Steers the resolver toward celebration, honoring, challenge, mourning, or calm explanation.";

export const VOICE_REGISTER_LABEL = "Voice register";
export const VOICE_REGISTER_DESCRIPTION =
  "The archetype the resolver derives from audience and domain — for example the-captain or the-poet. It biases word choice, pacing, and the steering tag.";

export const BROADCAST_NEUTRAL_LABEL = "Broadcast neutral";
export const BROADCAST_NEUTRAL_DESCRIPTION =
  "A camera-ready delivery that holds the room without projecting to it. Even pacing, controlled warmth, no arena lift — the default for press and on-camera moments.";

// ---------------------------------------------------------------------------
// Resolver output (SS3 + ResolverPanel)
// ---------------------------------------------------------------------------

export const EMOTIONAL_STATE_LABEL = "Emotional state";
export const EMOTIONAL_STATE_DESCRIPTION =
  "The resolver's primary output — a named feeling (the signature state) inside an emotional family. It is the centre of gravity the voice performance pulls from.";

export const SIGNATURE_STATE_LABEL = "Signature state";
export const SIGNATURE_STATE_DESCRIPTION =
  "The headline name the resolver gives the emotional state, like Quiet Triumph or Steady Resolve. It pairs with the family to read at a glance.";

/**
 * Producer-facing label for `ResolverOutput.winningFamily`. The internal
 * type name is "winning family"; the producer label we ship in tooltips is
 * "Emotional family" — which reads as a category, not a contest.
 */
export const WINNING_FAMILY_LABEL = "Emotional family";
export const WINNING_FAMILY_DESCRIPTION =
  "The broader category the signature state belongs to — Triumph, Grief, Resolve, and so on. Picked by the resolver from the event vector and scene.";

export const NARRATIVE_DIRECTION_LABEL = "Narrative direction";
export const NARRATIVE_DIRECTION_DESCRIPTION =
  "The shape of the arc — ascending climbs into the moment, settle releases out of it, steady holds level. Drives the order and feel of the beats.";

export const STEERING_TAG_LABEL = "Steering tag";
export const STEERING_TAG_DESCRIPTION =
  "The short tag handed to a voice engine — for example <settle:warm>. Encodes the final beat in machine-readable form so synthesis lands the same feeling.";

export const EMOTIONAL_ARC_LABEL = "Emotional arc";
export const EMOTIONAL_ARC_DESCRIPTION =
  "How intensity moves across the beats of the moment — open, build, peak. The line shape gives a producer a quick read of where the performance lands.";

// ---------------------------------------------------------------------------
// Resolver axes — the four 0-100 dials. Each description names both ends
// (low and high) so the producer knows what the scalar means at a glance.
// ---------------------------------------------------------------------------

export const INTENSITY_LABEL = "Intensity";
export const INTENSITY_DESCRIPTION =
  "How forcefully the moment lands. Lower reads as restrained or quiet; higher reads as urgent, peaked, or explosive. Resolved from significance and arc shape.";

export const WARMTH_LABEL = "Warmth";
export const WARMTH_DESCRIPTION =
  "How close and human the delivery feels. Lower reads as cool, formal, or removed; higher reads as personal, gentle, or affectionate. Driven by audience and goal.";

export const PACING_LABEL = "Pacing";
export const PACING_DESCRIPTION =
  "The relative speed of delivery. Lower is patient and weighted; higher is brisk and pushed. Tunes against the conversation mode and the moment's significance.";

export const CONFIDENCE_LABEL = "Source confidence";
export const CONFIDENCE_DESCRIPTION =
  "How well the underlying source supports voicing this moment. Higher climbs with verified records; lower falls when sources are thin or unreviewed.";

// ---------------------------------------------------------------------------
// Voice Context Preview (SS4)
// ---------------------------------------------------------------------------

export const VOICE_CONTEXT_PREVIEW_LABEL = "Voice context preview";
export const VOICE_CONTEXT_PREVIEW_DESCRIPTION =
  "A read-only summary of the resolved performance — event, scene, feeling, parameters, steering tag, and a sample script — that you can save, export, or hand to synthesis.";

// ---------------------------------------------------------------------------
// ResolverPanel — pinned eyebrow / section labels (consumed by the panel,
// the "Why this feeling" surface, and `whyThisFeeling.ts`)
// ---------------------------------------------------------------------------

export const RESOLVED_FEELING_EYEBROW = "Resolved feeling";
export const WHY_THIS_FEELING_LABEL = "Why this feeling";
export const INPUTS_LABEL = "Inputs";
export const RESOLVER_INPUTS_LABEL = "Resolver inputs";
export const RESOLVER_LIVE_NOTE =
  "Change any input and the resolver re-resolves in real time — every output below reflects the live scene.";

export type ArcPosition = "open" | "build" | "peak";

export const ARC_POSITION_LABELS: Record<ArcPosition, string> = {
  open: "Open",
  build: "Build",
  peak: "Peak",
};

// ---------------------------------------------------------------------------
// "How this works" — 4-step overview shown on the studio entry surface
// ---------------------------------------------------------------------------

export const HOW_IT_WORKS_TITLE = "How this works";
export const HOW_IT_WORKS_INTRO =
  "Four steps from a verified moment to a producer-ready voice context. The right rail shows the resolver's work; nothing is synthesized until you choose to.";

export interface HowItWorksStep {
  /** Step number, 1-indexed. */
  index: number;
  /** Short title that mirrors the studio sub-step it corresponds to. */
  title: string;
  /** One-or-two-sentence description, ≤ 220 chars. */
  description: string;
}

export const HOW_IT_WORKS_STEPS: readonly HowItWorksStep[] = [
  {
    index: 1,
    title: "Choose a verified event",
    description:
      "Pick a producer-approved moment from the timeline. Only events marked Reviewed are eligible — the studio voices facts, it does not ratify them.",
  },
  {
    index: 2,
    title: "Shape the scene",
    description:
      "Set audience, conversation mode, and narrative goal. The resolver re-runs live as you change inputs so you can hear the consequence of every choice.",
  },
  {
    index: 3,
    title: "Resolve emotional state",
    description:
      "Read the resolver's output — signature state, emotional family, the four axes, and the steering tag. Same inputs always produce the same result.",
  },
  {
    index: 4,
    title: "Preview voice context",
    description:
      "Review the locked performance context — event, scene, feeling, parameters, sample script — then save it to the draft or export a plain-text summary.",
  },
] as const;

// ---------------------------------------------------------------------------
// Inline helper paragraphs (mobile-visible without any tap)
// ---------------------------------------------------------------------------

export const RESOLVER_INLINE_HELPER =
  "The resolver is a deterministic engine — it maps your scene to a feeling and a steering tag with no AI guessing.";

export const STEERING_TAG_INLINE_HELPER =
  "The short tag a voice engine reads to land the same feeling. Auto-generated from the final beat.";

export const EMOTIONAL_STATE_INLINE_HELPER =
  "The resolver's primary output — a named feeling inside a broader emotional family.";

export const AXES_INLINE_HELPER =
  "Four 0-100 dials describe the performance. Intensity is force; Warmth is closeness; Pacing is speed; Source confidence reflects how well the record supports voicing this moment.";

export const ANCHORING_EVENT_INLINE_HELPER =
  "The studio only voices producer-approved moments. Approve in timeline review first.";

// ---------------------------------------------------------------------------
// Studio glossary — flat list mirroring every (label, description) pair
// declared above. The test suite walks this list to enforce cap + non-empty
// invariants in one place; a future glossary surface can also iterate it.
// ---------------------------------------------------------------------------

export const STUDIO_GLOSSARY = [
  { label: RESOLVER_LABEL, description: RESOLVER_DESCRIPTION },
  { label: ANCHORING_EVENT_LABEL, description: ANCHORING_EVENT_DESCRIPTION },
  { label: SCENE_CONTEXT_LABEL, description: SCENE_CONTEXT_DESCRIPTION },
  { label: AUDIENCE_LABEL, description: AUDIENCE_DESCRIPTION },
  { label: CONVERSATION_MODE_LABEL, description: CONVERSATION_MODE_DESCRIPTION },
  { label: NARRATIVE_GOAL_LABEL, description: NARRATIVE_GOAL_DESCRIPTION },
  { label: VOICE_REGISTER_LABEL, description: VOICE_REGISTER_DESCRIPTION },
  { label: BROADCAST_NEUTRAL_LABEL, description: BROADCAST_NEUTRAL_DESCRIPTION },
  { label: EMOTIONAL_STATE_LABEL, description: EMOTIONAL_STATE_DESCRIPTION },
  { label: SIGNATURE_STATE_LABEL, description: SIGNATURE_STATE_DESCRIPTION },
  { label: WINNING_FAMILY_LABEL, description: WINNING_FAMILY_DESCRIPTION },
  {
    label: NARRATIVE_DIRECTION_LABEL,
    description: NARRATIVE_DIRECTION_DESCRIPTION,
  },
  { label: STEERING_TAG_LABEL, description: STEERING_TAG_DESCRIPTION },
  { label: EMOTIONAL_ARC_LABEL, description: EMOTIONAL_ARC_DESCRIPTION },
  { label: INTENSITY_LABEL, description: INTENSITY_DESCRIPTION },
  { label: WARMTH_LABEL, description: WARMTH_DESCRIPTION },
  { label: PACING_LABEL, description: PACING_DESCRIPTION },
  { label: CONFIDENCE_LABEL, description: CONFIDENCE_DESCRIPTION },
  {
    label: VOICE_CONTEXT_PREVIEW_LABEL,
    description: VOICE_CONTEXT_PREVIEW_DESCRIPTION,
  },
] as const;

/** Hard cap so every description fits a tooltip + inline helper at any breakpoint. */
export const STUDIO_COPY_MAX_LENGTH = 220;

// ===========================================================================
// TwinChat copy — brief-mandated strings consumed by `TwinChat.tsx` and the
// `lib/ai.ts` demo seam. Pinned in `twinChat.test.ts`.
// ===========================================================================

/**
 * One of four prompt categories the demo composer routes on. The first
 * three are the brief-mandated example chips below; `general` is the
 * fall-through for free-form prompts (token-overlap match against the
 * approved event description).
 */
export type ChatPromptCategory =
  | "shaping"
  | "meaning"
  | "voiceDirection"
  | "general";

export interface ChatPromptChip {
  /** The exact button label rendered in the UI (also used as a placeholder). */
  label: string;
  /** Composition path the demo composer takes for this chip. */
  category: ChatPromptCategory;
}

/**
 * Brief-mandated three example chips. Order is fixed — the test pins it. */
export const CHAT_PROMPT_CHIPS: readonly ChatPromptChip[] = [
  { label: "What shaped this moment?", category: "shaping" },
  { label: "Why does this event matter?", category: "meaning" },
  { label: "How should the voice respond?", category: "voiceDirection" },
] as const;

export const CHAT_EYEBROW = "Digital Twin";
export const CHAT_SUBHEADING =
  "Demo chat — every reply cites the producer-approved timeline event.";

export const CHAT_PLACEHOLDER = "Ask about an approved timeline moment…";

/** Aria-label prefix for prompt-chip buttons (then concatenated with the chip label). */
export const CHAT_PROMPT_CHIP_ARIA_PREFIX = "Use prompt:";

export const CHAT_SEND_GLYPH = "↑";
export const CHAT_SEND_ARIA_LABEL = "Send chat message";

// ----- Source attribution
export const CHAT_SOURCE_PREFIX = "Source:";
/** Prefix to the source-event button's aria-label. */
export const CHAT_SOURCE_ARIA_PREFIX = "Source event:";

// ----- Gate hints (rendered above the input when chat is locked)
export const CHAT_GATE_NO_APPROVED_DESCRIPTION =
  "Approve at least one timeline event in S3 to enable the assistant.";
export const CHAT_GATE_NO_APPROVED_CTA = "Go to timeline review";
export const CHAT_GATE_NO_SELECTED_DESCRIPTION =
  "Select an anchoring event in SS1 to start asking questions.";
export const CHAT_GATE_NO_SELECTED_CTA = "Go to event selector";

// ----- Loading / error / disclaimer copy
export const CHAT_LOADING_TITLE = "Composing reply…";
export const CHAT_ERROR_TITLE = "Assistant error";
export const CHAT_ERROR_DESCRIPTION =
  "Assistant unavailable. Try again or use one of the suggested prompts.";
export const CHAT_ERROR_RETRY_LABEL = "Retry";

export const CHAT_DEMO_BADGE_LABEL = "Demo response";
export const CHAT_DEMO_DISCLAIMER =
  "Demo response — no live assistant is connected. Composed from the approved event metadata.";

/**
 * Honesty copy returned when the approved event description doesn't carry
 * enough text to compose a grounded answer. Pinned by both the demo
 * composer (`composeDemoChatResponse`) and the chat surface.
 */
export const CHAT_INSUFFICIENT_SOURCE =
  "The approved event does not contain enough source material to answer this. Approve more events in S3 or add a custom moment in S4.";
