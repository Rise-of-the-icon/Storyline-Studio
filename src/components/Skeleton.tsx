/** Skeleton placeholders (docs/05-STATES — prefer shapes over spinners). */

export function SkeletonLine({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={["animate-pulse rounded bg-panel", className].join(" ")}
      aria-hidden="true"
    />
  );
}

export function SearchResultSkeleton() {
  return (
    <div
      className="animate-pulse rounded-lg border border-border bg-card p-4"
      aria-hidden="true"
    >
      <div className="flex gap-3">
        <div className="h-14 w-14 rounded-md bg-panel" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-2/3" />
          <SkeletonLine className="h-3 w-full" />
        </div>
      </div>
    </div>
  );
}

export function TimelineEventSkeleton() {
  return (
    <div
      className="animate-pulse rounded-lg border border-border bg-card p-4"
      aria-hidden="true"
    >
      <SkeletonLine className="h-4 w-1/2" />
      <SkeletonLine className="mt-3 h-3 w-full" />
      <SkeletonLine className="mt-2 h-3 w-4/5" />
      <div className="mt-4 flex gap-2">
        <SkeletonLine className="h-9 w-20" />
        <SkeletonLine className="h-9 w-16" />
      </div>
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-lg border border-border bg-card p-4"
      aria-hidden="true"
    >
      <div className="flex gap-4">
        <div className="h-24 w-24 shrink-0 rounded-lg bg-panel" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-5 w-1/2" />
          <SkeletonLine className="h-3 w-full" />
          <SkeletonLine className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}
