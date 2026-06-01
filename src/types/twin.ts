export const SCHEMA_VERSION = 1;

export type Confidence = "High" | "Medium" | "Low";
export type Sensitivity = "Low" | "Medium" | "High";
export type Visibility = "Private" | "Internal" | "Public";
export type ReviewStatus = "Draft" | "NeedsReview" | "Reviewed" | "Rejected";

export type EventType =
  | "Personal"
  | "Career"
  | "Achievement"
  | "Award"
  | "Relationship"
  | "Education"
  | "Business"
  | "Legacy"
  | "Historical"
  | "Custom";

export interface SourceObject {
  type: "wikipedia" | "custom" | "manual";
  url?: string;
  citation?: string;
  verified: boolean;
  importedAtISO: string;
  revisionId?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date?: string;
  year: number;
  decade: string;
  eventType: EventType;
  source: SourceObject;
  confidence: Confidence;
  approvalStatus: ReviewStatus;
  sensitivity: Sensitivity;
  emotionalSignificance: number;
}

export interface CustomMoment {
  id: string;
  title: string;
  date?: string;
  description: string;
  emotionalSignificance: string;
  visibility: Visibility;
  sensitivity: Sensitivity;
  sourceNotes: string;
}

export interface GuardrailReview {
  eventId: string;
  trigger: string;
  severity: Sensitivity;
  status: ReviewStatus;
  editorialNote?: string;
  reviewedAtISO?: string;
}

export interface WikipediaProfile {
  pageId: string;
  title: string;
  summary: string;
  description: string;
  imageUrl?: string;
  sourceUrl: string;
  revisionId?: string;
}

export interface DigitalTwinProfile {
  schemaVersion: number;
  twinId: string;
  consentAcknowledged: boolean;
  coreIdentity: { name: string };
  wikipedia: WikipediaProfile;
  timeline: TimelineEvent[];
  customMoments: CustomMoment[];
  guardrailReviews: GuardrailReview[];
  draftStatus: "draft" | "saved";
  createdAtISO: string;
}
