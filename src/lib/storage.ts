import {
  SCHEMA_VERSION,
  type DigitalTwinProfile,
} from "../types/twin";

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
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      console.warn(
        `[storage] schemaVersion mismatch: expected ${SCHEMA_VERSION}, got ${parsed.schemaVersion}`,
      );
      return null;
    }
    return parsed;
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
  return { ...twin, schemaVersion: SCHEMA_VERSION };
}

export function saveTwin(twin: DigitalTwinProfile): boolean {
  const normalized = normalizeTwin(twin);
  const payload = JSON.stringify(normalized);
  if (!writeItem(twinKey(normalized.twinId), payload)) {
    return false;
  }

  const index = readIndex();
  if (!index.includes(normalized.twinId)) {
    if (!writeIndex([...index, normalized.twinId])) {
      return false;
    }
  }
  return true;
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
