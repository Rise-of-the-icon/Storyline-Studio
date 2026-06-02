/**
 * Compatibility barrel for the pre-feature-tree component paths.
 * New code should import from `@/shared/ui`, `@/app/navigation`, or the
 * owning feature directly.
 */
export { AppHeader } from "@/app/navigation/AppHeader";
export { TwinContextSummary } from "@/app/navigation/TwinContextSummary";
export { WizardHeader } from "@/app/navigation/WizardHeader";
export { WizardStepper } from "@/app/navigation/WizardStepper";
export { ResumeDraftPanel } from "@/features/search/ResumeDraftPanel";
export { CustomMomentDrawer } from "@/features/custom-moments/CustomMomentDrawer";
export { EditorialReviewModal } from "@/features/guardrails/EditorialReviewModal";
export { AudioPreview } from "@/shared/ui/AudioPreview";
export { ApprovalBadge, ConfidenceBadge, SourceBadge, VisibilityBadge } from "@/shared/ui/badges";
export type {
  ApprovalBadgeProps,
  ConfidenceBadgeProps,
  SourceBadgeProps,
  VisibilityBadgeProps,
} from "@/shared/ui/badges";
export { Badge } from "@/shared/ui/Badge";
export { Button } from "@/shared/ui/Button";
export { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
export type { ConfirmDialogProps } from "@/shared/ui/ConfirmDialog";
export { EmptyState } from "@/shared/ui/EmptyState";
export type { EmptyStateProps, EmptyStateTone } from "@/shared/ui/EmptyState";
export { ErrorState } from "@/shared/ui/ErrorState";
export type { ErrorStateProps, ErrorStateTone } from "@/shared/ui/ErrorState";
export { Input } from "@/shared/ui/Input";
export { LoadingState } from "@/shared/ui/LoadingState";
export type { LoadingStateProps } from "@/shared/ui/LoadingState";
export { Modal } from "@/shared/ui/Modal";
export { ParamBar } from "@/shared/ui/ParamBar";
export { ResponsivePanel } from "@/shared/ui/ResponsivePanel";
export type { ResponsivePanelProps } from "@/shared/ui/ResponsivePanel";
export { RetryPanel } from "@/shared/ui/RetryPanel";
export type { RetryPanelProps } from "@/shared/ui/RetryPanel";
export {
  ProfileCardSkeleton,
  SearchResultSkeleton,
  Skeleton,
  SkeletonLine,
  StudioPanelSkeleton,
  TimelineEventSkeleton,
} from "@/shared/ui/Skeleton";
export type { SkeletonProps } from "@/shared/ui/Skeleton";
export { StepTransition } from "@/shared/ui/StepTransition";
export type { StepTransitionProps } from "@/shared/ui/StepTransition";
export { Textarea } from "@/shared/ui/Textarea";
export { Tooltip } from "@/shared/ui/Tooltip";
export { SegControl } from "@/shared/ui/SegControl";
export { TimelineRevealItem } from "@/shared/ui/TimelineRevealItem";
