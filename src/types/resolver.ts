import type { Confidence, Sensitivity } from "./twin";

export type Domain = "sports" | "music";

export interface ResolverInput {
  domain: Domain;
  archetype: string;
  eventId: string;
  /** Human-readable moment title for biographical reason strings (from timeline). */
  eventTitle?: string;
  /** Optional extra event text for event-vector classification. */
  eventContext?: string;
  /** 0–100; defaults from intent heuristics when omitted. */
  emotionalSignificance?: number;
  intent: string;
  mode: "Narrator" | "Q&A" | "Documentary";
  sensitivity: Sensitivity;
  confidence: Confidence;
}

export interface ResolverBeat {
  role: string;
  state: string;
  steeringTag: string;
  intensity: number;
}

export interface ResolverOutput {
  domain: Domain;
  winningFamily: string;
  signatureState: string;
  direction: "ascending" | "settle" | "steady";
  beats: ResolverBeat[];
  intensity: number;
  warmth: number;
  pacing: number;
  confidence: number;
  reason: string;
  guardrailWarnings: string[];
}
