import type {
  DisplayApprovalStatus,
  DisplayConfidence,
  DisplayVisibility,
  SourceType,
} from "../types/twin";
import { Badge } from "./Badge";

/**
 * Content-model badges. The four shapes the brief calls out:
 *   - SourceBadge      ← provenance (Wikipedia / Producer / Demo / Manual / Unknown)
 *   - ConfidenceBadge  ← high / medium / low
 *   - ApprovalBadge    ← approved / deferred / needsReview / rejected
 *   - VisibilityBadge  ← public / internal / private
 *
 * Each badge is a thin wrapper around `<Badge variant=…>` so the visual
 * vocabulary stays consistent (rounded pill, mono uppercase, 10px font) but
 * the meaning is locked to a single content-model concept. UI surfaces
 * (S3, S4, SS1, S5, AppHeader) consume these — never `<Badge>` directly —
 * so a global re-skin is one-file work.
 */

// ---------- SourceBadge ----------

const SOURCE_LABEL: Record<SourceType, string> = {
  wikipedia: "Wikipedia",
  producer: "Producer",
  demo: "Demo seed",
  manual: "Manual",
  unknown: "Unknown source",
};

const SOURCE_VARIANT: Record<
  SourceType,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  wikipedia: "blue",
  producer: "gold",
  demo: "warning",
  manual: "muted",
  unknown: "muted",
};

export interface SourceBadgeProps {
  sourceType: SourceType;
  /**
   * Whether the producer has affirmed the source. Defaults to `true` —
   * pass `false` to render an "unverified" label and use the danger tone
   * so the UI never silently presents unverified content as fact.
   */
  verified?: boolean;
  /**
   * Optional source URL — when present the badge renders as a link so
   * reviewers can verify in one click. Keep `target="_blank" rel="noreferrer noopener"`.
   */
  sourceUrl?: string;
}

export function SourceBadge({
  sourceType,
  verified = true,
  sourceUrl,
}: SourceBadgeProps) {
  const label = SOURCE_LABEL[sourceType];
  const variant = verified ? SOURCE_VARIANT[sourceType] : "danger";
  const suffix = verified ? "" : " · unverified";
  const content = `${label}${suffix}`;
  // Producer / demo / manual / unknown content stays as a passive pill —
  // there's no third-party URL to link to. Wikipedia (and `manual` in the
  // future) get a clickable link when `sourceUrl` is present.
  if (sourceUrl && (sourceType === "wikipedia" || sourceType === "manual")) {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        aria-label={`${content} — opens source in new tab`}
      >
        <Badge variant={variant}>
          {content}
          <span aria-hidden="true" className="ml-1 opacity-70">
            ↗
          </span>
        </Badge>
      </a>
    );
  }
  return <Badge variant={variant}>{content}</Badge>;
}

// ---------- ConfidenceBadge ----------

const CONFIDENCE_VARIANT: Record<
  DisplayConfidence,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  high: "ok",
  medium: "gold",
  low: "warning",
  unknown: "muted",
};

const CONFIDENCE_LABEL: Record<DisplayConfidence, string> = {
  high: "Confidence · high",
  medium: "Confidence · medium",
  low: "Confidence · low",
  unknown: "Confidence · unknown",
};

export interface ConfidenceBadgeProps {
  level: DisplayConfidence;
}

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  return <Badge variant={CONFIDENCE_VARIANT[level]}>{CONFIDENCE_LABEL[level]}</Badge>;
}

// ---------- ApprovalBadge ----------

const APPROVAL_VARIANT: Record<
  DisplayApprovalStatus,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  approved: "ok",
  deferred: "muted",
  needsReview: "warning",
  rejected: "danger",
};

const APPROVAL_LABEL: Record<DisplayApprovalStatus, string> = {
  approved: "Approved",
  deferred: "Deferred",
  needsReview: "Needs review",
  rejected: "Rejected",
};

export interface ApprovalBadgeProps {
  status: DisplayApprovalStatus;
}

export function ApprovalBadge({ status }: ApprovalBadgeProps) {
  return <Badge variant={APPROVAL_VARIANT[status]}>{APPROVAL_LABEL[status]}</Badge>;
}

// ---------- VisibilityBadge ----------

const VISIBILITY_VARIANT: Record<
  DisplayVisibility,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  public: "gold",
  internal: "blue",
  private: "muted",
};

const VISIBILITY_LABEL: Record<DisplayVisibility, string> = {
  public: "Public",
  internal: "Internal",
  private: "Private",
};

export interface VisibilityBadgeProps {
  level: DisplayVisibility;
}

export function VisibilityBadge({ level }: VisibilityBadgeProps) {
  return <Badge variant={VISIBILITY_VARIANT[level]}>{VISIBILITY_LABEL[level]}</Badge>;
}
