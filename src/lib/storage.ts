import { customMomentSource } from "./contentModel";
import {
  SCHEMA_VERSION,
  type CustomMoment,
  type DigitalTwinProfile,
  type TimelineEvent,
} from "@/types/twin";
import {
  deleteTwinFromRemote,
  mirrorTwinToRemote,
} from "@/services/twinRemoteStorage";

const KEY_PREFIX = "ricon";
const INDEX_KEY = `${KEY_PREFIX}:index`;
const DRAFT_KEY = `${KEY_PREFIX}:draft`;

function twinKey(twinId: string): string {
  return `${KEY_PREFIX}:twin:${twinId}`;
}

function readItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn("[storage] read failed", key, err);
    return null;
  }
}

function writeItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn("[storage] write failed", key, err);
    return false;
  }
}

function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn("[storage] remove failed", key, err);
  }
}

/**
 * V1→V2 migration — applied on load so a producer's draft from before the
 * source-backed content model still opens.
 *
 * What V2 adds:
 *  - `TimelineEvent.visibility` defaults to `"Internal"`.
 *  - `TimelineEvent.category` mirrors `eventType` (alias).
 *  - `TimelineEvent.summary` mirrors `description` (alias).
 *  - `TimelineEvent.source.notes` mirrors the legacy `citation` when present.
 *  - `CustomMoment.source` is populated from the V1 inference — if
 *    `sourceNotes` mentions "unverified" / "rumor" / "speculation" / "hearsay"
 *    or is blank, the moment becomes `{ sourceType: "producer", verified: false }`;
 *    otherwise `verified: true`. This is the conservative path — when in
 *    doubt, mark unverified.
 *
 * Pure: returns a new draft, does not mutate the input.
 */
export function migrateV1ToV2(draft: DigitalTwinProfile): DigitalTwinProfile {
  const timeline: TimelineEvent[] = draft.timeline.map((event) => ({
    ...event,
    visibility: event.visibility ?? "Internal",
    category: event.category ?? event.eventType,
    summary: event.summary ?? event.description,
    source: {
      ...event.source,
      notes: event.source.notes ?? event.source.citation,
    },
  }));

  const customMoments: CustomMoment[] = draft.customMoments.map((moment) => ({
    ...moment,
    source: moment.source ?? customMomentSource(moment),
  }));

  return {
    ...draft,
    schemaVersion: SCHEMA_VERSION,
    timeline,
    customMoments,
  };
}

function parseTwin(raw: string | null): DigitalTwinProfile | null {
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as DigitalTwinProfile;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.schemaVersion !== "number"
    ) {
      console.warn("[storage] invalid twin payload");
      return null;
    }
    if (parsed.schemaVersion === SCHEMA_VERSION) {
      return parsed;
    }
    if (parsed.schemaVersion === 1) {
      console.info("[storage] migrating draft from schemaVersion 1 → 2");
      return migrateV1ToV2(parsed);
    }
    console.warn(
      `[storage] schemaVersion mismatch: expected ${SCHEMA_VERSION}, got ${parsed.schemaVersion}`,
    );
    return null;
  } catch (err) {
    console.warn("[storage] failed to parse twin JSON", err);
    return null;
  }
}

function readIndex(): string[] {
  const raw = readItem(INDEX_KEY);
  if (raw === null) return [];
  try {
    const ids = JSON.parse(raw) as unknown;
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string")) {
      console.warn("[storage] invalid index payload");
      return [];
    }
    return ids;
  } catch (err) {
    console.warn("[storage] failed to parse index", err);
    return [];
  }
}

function writeIndex(ids: string[]): boolean {
  return writeItem(INDEX_KEY, JSON.stringify(ids));
}

function normalizeTwin(twin: DigitalTwinProfile): DigitalTwinProfile {
  return {
    ...twin,
    schemaVersion: SCHEMA_VERSION,
    lastSavedAtISO: new Date().toISOString(),
  };
}

/**
 * Persist a twin to `localStorage`. Returns the normalized twin (with
 * `lastSavedAtISO` stamped) on success, or `null` on failure. Callers that
 * want to surface a "save error" UI inspect the return value rather than
 * the legacy boolean — see `S6DraftSaved` and `TwinContext.updateDraft`.
 *
 * Failure modes (all logged via `console.warn` + caller-observable as
 * `null` return):
 *  - `localStorage` write threw (quota exceeded, private-mode iOS, etc.)
 *  - Twin index write threw after the twin payload succeeded
 *
 * The returned twin is what the caller should put into React state so
 * `lastSavedAtISO` is in sync between persistence and UI.
 */
export function saveTwin(twin: DigitalTwinProfile): DigitalTwinProfile | null {
  const normalized = normalizeTwin(twin);
  const payload = JSON.stringify(normalized);
  if (!writeItem(twinKey(normalized.twinId), payload)) {
    return null;
  }

  const index = readIndex();
  if (!index.includes(normalized.twinId)) {
    if (!writeIndex([...index, normalized.twinId])) {
      return null;
    }
  }
  mirrorTwinToRemote(normalized);
  return normalized;
}

export function getTwin(twinId: string): DigitalTwinProfile | null {
  return parseTwin(readItem(twinKey(twinId)));
}

export function listTwins(): DigitalTwinProfile[] {
  return readIndex()
    .map((id) => getTwin(id))
    .filter((twin): twin is DigitalTwinProfile => twin !== null);
}

export function setDraft(twinId: string | null): boolean {
  if (twinId === null) {
    removeItem(DRAFT_KEY);
    return true;
  }
  return writeItem(DRAFT_KEY, twinId);
}

export function getDraft(): DigitalTwinProfile | null {
  const draftId = readItem(DRAFT_KEY);
  if (draftId === null) return null;
  return getTwin(draftId);
}

export function clearDraft(): void {
  removeItem(DRAFT_KEY);
}

/**
 * Hard-delete the active draft from `localStorage`: the twin payload, the
 * index entry, and the draft pointer. This is the "Clear draft" action on
 * S1 — the producer's explicit "throw this away" verb. Returns `true` if
 * either a draft was cleared, `false` if there was nothing to clear.
 *
 * Pure deletion — does not touch other twins in the index, only the active
 * one. Use `resetAllRiconStorage()` for the "wipe everything" semantics
 * (between demo runs).
 */
export function deleteActiveDraft(): boolean {
  const draftId = readItem(DRAFT_KEY);
  if (draftId === null) {
    // Nothing pointing at a draft — but the user may still have an orphan
    // payload from a corrupted prior run. We don't go hunting; return false
    // and let `resetAllRiconStorage` be the nuclear option.
    return false;
  }
  removeItem(twinKey(draftId));
  removeItem(DRAFT_KEY);
  // Drop the id from the index so `listTwins()` stays accurate.
  const index = readIndex().filter((id) => id !== draftId);
  writeIndex(index);
  deleteTwinFromRemote(draftId);
  return true;
}

/** Clear all RICON keys — use between demo runs (Five Challenge B1). */
export function resetAllRiconStorage(): void {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(KEY_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach(removeItem);
  } catch (err) {
    console.warn("[storage] resetAllRiconStorage failed", err);
  }
}

/**
 * Dev-only harness: write raw JSON to a twin key (e.g. schemaVersion corruption tests).
 * Not for production use.
 */
export function devWriteRawTwin(twinId: string, rawJson: string): boolean {
  if (!import.meta.env.DEV) {
    console.warn("[storage] devWriteRawTwin is only available in development");
    return false;
  }
  const index = readIndex();
  if (!index.includes(twinId)) {
    if (!writeIndex([...index, twinId])) return false;
  }
  return writeItem(twinKey(twinId), rawJson);
}
