import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Card } from "@/shared/ui/Card";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { EmptyState } from "@/shared/ui/EmptyState";
import { SearchInput } from "@/shared/ui/SearchInput";
import { ResumeDraftPanel } from "@/features/search/ResumeDraftPanel";
import { RetryPanel } from "@/shared/ui/RetryPanel";
import { SearchResultSkeleton } from "@/shared/ui/Skeleton";
import { useTwin } from "@/app/providers/TwinContext";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import {
  DEMO_SUBJECTS,
  getDemoSubjectById,
} from "@/data/demoSubjects";
import type { SearchResultDomain } from "@/features/search/subjectDomain";
import {
  SEARCH_EMPTY_DESCRIPTION,
  SEARCH_ERROR_DESCRIPTION,
  SEARCH_ERROR_TITLE,
  SEARCH_LOADING_TITLE,
} from "@/lib/stateCopy";
import {
  createDraftFromWikipedia,
  fetchWikipediaProfile,
  searchWikipedia,
  type SearchErrorCode,
  type SearchSource,
  type WikipediaSearchHit,
} from "@/features/search/wikipedia";

type SearchPhase =
  | "idle"
  | "typing"
  | "loading"
  | "results"
  | "empty" // live API returned 0 hits
  | "api-error"; // live API failed AND demo fallback empty

type DomainFilter = "all" | SearchResultDomain;

const DOMAIN_FILTER_ORDER: DomainFilter[] = [
  "all",
  "sports",
  "music",
  "entertainment",
  "other",
];

const DOMAIN_LABEL: Record<DomainFilter, string> = {
  all: "All",
  sports: "Sports",
  music: "Music",
  entertainment: "Entertainment",
  other: "Other",
};

function domainBadgeLabel(domain: SearchResultDomain): string {
  return DOMAIN_LABEL[domain];
}

function domainBadgeVariant(
  domain: SearchResultDomain,
): "blue" | "gold" | "muted" {
  switch (domain) {
    case "sports":
      return "blue";
    case "music":
      return "gold";
    case "entertainment":
    case "other":
      return "muted";
  }
}

export function S1Search() {
  const { draft, setDraft, goTo, useDemoSubject } = useTwin();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);

  const [phase, setPhase] = useState<SearchPhase>("idle");
  const [results, setResults] = useState<WikipediaSearchHit[]>([]);
  const [source, setSource] = useState<SearchSource>("live");
  const [apiError, setApiError] = useState<SearchErrorCode | null>(null);
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);
  // Pending subject choice that would clobber a different in-progress
  // draft. Shows a confirm dialog until the producer chooses overwrite or
  // keep-existing. Two shapes: a real Wikipedia hit, or a demo subject id.
  const [pendingSubject, setPendingSubject] = useState<
    { kind: "hit"; hit: WikipediaSearchHit } | { kind: "demo"; id: string } | null
  >(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Query-length gating: instant UI feedback while typing.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setPhase("idle");
      setResults([]);
      setSource("live");
      setApiError(null);
      setHighlightedIndex(-1);
      return;
    }
    if (trimmed.length < 2) {
      setPhase("typing");
      setResults([]);
      setHighlightedIndex(-1);
      return;
    }
  }, [query]);

  // Debounced fetch.
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) return;

    const controller = new AbortController();
    setPhase("loading");
    setSelectError(null);

    searchWikipedia(q, controller.signal).then((response) => {
      if (controller.signal.aborted) return;
      setResults(response.results);
      setSource(response.source);
      setApiError(response.error ?? null);
      setHighlightedIndex(-1);

      if (response.results.length === 0) {
        setPhase(response.error ? "api-error" : "empty");
      } else {
        setPhase("results");
      }
    });

    return () => controller.abort();
  }, [debouncedQuery]);

  // Counts feeding the filter chips — recomputed from raw results.
  const domainCounts = useMemo(() => {
    const counts: Record<DomainFilter, number> = {
      all: results.length,
      sports: 0,
      music: 0,
      entertainment: 0,
      other: 0,
    };
    for (const hit of results) counts[hit.domain] += 1;
    return counts;
  }, [results]);

  const filteredResults = useMemo(() => {
    if (domainFilter === "all") return results;
    return results.filter((hit) => hit.domain === domainFilter);
  }, [results, domainFilter]);

  // Reset highlight when the filtered set changes (don't strand the index).
  useEffect(() => {
    resultRefs.current = resultRefs.current.slice(0, filteredResults.length);
    if (highlightedIndex >= filteredResults.length) {
      setHighlightedIndex(filteredResults.length === 0 ? -1 : 0);
    }
  }, [filteredResults.length, highlightedIndex]);

  // Inner implementation — assumed to be safe to call (no in-progress draft,
  // or the producer has just confirmed the overwrite).
  const performSelect = useCallback(
    async (hit: WikipediaSearchHit) => {
      setSelectingId(hit.pageId);
      setSelectError(null);
      try {
        if (hit.demoSubjectId) {
          const ok = useDemoSubject(hit.demoSubjectId);
          if (!ok) throw new Error("Demo subject not found");
          return;
        }
        const profile = await fetchWikipediaProfile(hit.title);
        const newDraft = createDraftFromWikipedia(profile);
        setDraft(newDraft);
        goTo("S2");
      } catch {
        setSelectError(
          "Could not load that profile. Try again or pick a demo subject below.",
        );
      } finally {
        setSelectingId(null);
      }
    },
    [goTo, setDraft, useDemoSubject],
  );

  /**
   * Entry point for every "start work on this subject" interaction (search
   * result click, demo CTA, pill row). Guards against silently overwriting
   * an in-progress draft for a different subject — the producer has to
   * affirmatively choose to discard it.
   */
  const handleSelect = useCallback(
    (hit: WikipediaSearchHit) => {
      // If we're already on this exact subject (same wikipedia pageId or
      // same demo subject id), no conflict — just continue to S2.
      const existingPageId = draft?.wikipedia.pageId;
      const incomingPageId = hit.demoSubjectId
        ? hit.demoSubjectId
        : hit.pageId;
      const conflicts =
        Boolean(existingPageId) && existingPageId !== incomingPageId;

      if (conflicts) {
        setPendingSubject({ kind: "hit", hit });
        return;
      }
      void performSelect(hit);
    },
    [draft, performSelect],
  );

  // ----- keyboard navigation -----
  const focusResult = useCallback((idx: number) => {
    setHighlightedIndex(idx);
    const el = resultRefs.current[idx];
    if (el) {
      el.focus();
      el.scrollIntoView({ block: "nearest" });
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setHighlightedIndex(-1);
    setSelectError(null);
    inputRef.current?.focus();
  }, []);

  const onInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        if (query.length > 0 || results.length > 0) {
          e.preventDefault();
          clearSearch();
        }
        return;
      }
      if (e.key === "ArrowDown" && filteredResults.length > 0) {
        e.preventDefault();
        focusResult(0);
      }
    },
    [clearSearch, filteredResults.length, focusResult, query, results.length],
  );

  const onResultKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = (idx + 1) % filteredResults.length;
        focusResult(next);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (idx === 0) {
          setHighlightedIndex(-1);
          inputRef.current?.focus();
          return;
        }
        focusResult(idx - 1);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        focusResult(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        focusResult(filteredResults.length - 1);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        clearSearch();
        return;
      }
      // Enter is implicit on <button>; nothing to add.
    },
    [clearSearch, filteredResults.length, focusResult],
  );

  const isLoading = phase === "loading";
  const showApiBanner = source === "demo" && apiError !== null && results.length > 0;

  const performDemoLoad = useCallback(
    (demoId: string) => {
      setSelectingId(demoId);
      setSelectError(null);
      const ok = useDemoSubject(demoId);
      if (!ok) {
        setSelectError("Could not load the demo profile.");
        setSelectingId(null);
      }
    },
    [useDemoSubject],
  );

  const loadDemoProfile = useCallback((demoId: string) => {
    const existingPageId = draft?.wikipedia.pageId;
    const incomingPageId = demoId;
    if (existingPageId && existingPageId !== incomingPageId) {
      setPendingSubject({ kind: "demo", id: demoId });
      return;
    }
    performDemoLoad(demoId);
  }, [draft, performDemoLoad]);

  // Confirm-dialog resolution — fires either from the result list overwrite
  // or the demo CTA overwrite. `kind` distinguishes which path to take.
  const handleConfirmOverwrite = useCallback(() => {
    if (!pendingSubject) return;
    const choice = pendingSubject;
    setPendingSubject(null);
    if (choice.kind === "hit") {
      void performSelect(choice.hit);
    } else {
      performDemoLoad(choice.id);
    }
  }, [pendingSubject, performSelect, performDemoLoad]);

  const pendingSubjectName =
    pendingSubject?.kind === "hit"
      ? pendingSubject.hit.title
      : pendingSubject?.kind === "demo"
        ? (getDemoSubjectById(pendingSubject.id)?.hit.title ?? "the new subject")
        : "";

  return (
    <div className="mx-auto max-w-[680px] px-4 py-10">
      <div className="cinematic-enter">
        <h1 className="font-display text-4xl tracking-wide text-text">
          Find a voice subject
        </h1>
        <p className="mt-2 font-body text-sm text-textsub">
          Search Wikipedia to start a digital twin.
        </p>
        <p className="mt-1 label-mono">
          Sports and music are the focus — other categories are labeled so you
          can spot them.
        </p>
      </div>

      <ResumeDraftPanel />

      <section className="mt-6" aria-labelledby="demo-profiles-title">
        <p
          id="demo-profiles-title"
          className="label-mono"
        >
          Demo profiles
        </p>
        <div className="mt-3 grid gap-3">
          {DEMO_SUBJECTS.map((subject) => (
            <Card
              key={subject.id}
              as="button"
              type="button"
              selectable
              disabled={selectingId !== null}
              onClick={() => loadDemoProfile(subject.id)}
              aria-busy={selectingId === subject.id}
              className="group flex w-full flex-col gap-3 border-l-2 border-l-gold bg-card/70 sm:flex-row sm:items-center sm:justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <Card.Header
                eyebrow="Demo profile"
                actions={<Badge variant="muted">{subject.category}</Badge>}
              >
                <p className="mt-1 font-body text-sm text-text">
                  <span className="font-medium">{subject.hit.title}</span>
                  <span className="text-textsub"> — {subject.bio}</span>
                </p>
              </Card.Header>
              <span
                aria-hidden="true"
                className="inline-flex min-h-[36px] shrink-0 items-center justify-center self-start rounded-md border border-gold bg-gold px-3 py-1.5 font-body text-xs font-medium text-bg sm:self-auto"
              >
                {selectingId === subject.id ? "Loading…" : "View demo profile"}
              </span>
            </Card>
          ))}
        </div>
      </section>

      <SearchInput
        ref={inputRef}
        className="mt-8"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onInputKeyDown}
        placeholder="Search a public figure…"
        autoComplete="off"
        role="combobox"
        aria-expanded={filteredResults.length > 0}
        aria-controls="s1-search-results"
        aria-autocomplete="list"
        aria-activedescendant={
          highlightedIndex >= 0
            ? `s1-result-${filteredResults[highlightedIndex]?.pageId}`
            : undefined
        }
      />
      <p className="mt-2 label-mono">
        ↓ to step into results · ↑↓ to navigate · enter to select · esc to clear
      </p>

      {phase === "typing" && query.trim().length > 0 && (
        <p className="mt-3 font-mono text-xs text-textmuted">
          Type at least 2 characters to search…
        </p>
      )}

      {showApiBanner && (
        <Callout tone="neutral" role="status" className="mt-3">
          Search is unavailable right now — showing seeded demo subjects. Try
          again in a moment.
        </Callout>
      )}

      {selectError && (
        <p className="mt-3 font-body text-sm text-danger" role="alert">
          {selectError}
        </p>
      )}

      {/* Category filter chips. Show whenever we have any results to scope. */}
      {phase === "results" && results.length > 0 && (
        <div
          className="mt-5 flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="Filter results by category"
        >
          {DOMAIN_FILTER_ORDER.map((key) => {
            const count = domainCounts[key];
            const isActive = domainFilter === key;
            const isDisabled = key !== "all" && count === 0;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={isDisabled}
                onClick={() => setDomainFilter(key)}
                className={[
                  "cursor-pointer rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-widest transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold active:translate-y-px motion-reduce:active:translate-y-0 disabled:cursor-not-allowed",
                  isActive
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-bordermid bg-panel text-textsub hover:border-gold/60 hover:text-text",
                  isDisabled ? "opacity-40 pointer-events-none" : "",
                ].join(" ")}
              >
                {DOMAIN_LABEL[key]}
                <span className="ml-1.5 meta-mono text-textmuted">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div
        id="s1-search-results"
        className="mt-6 space-y-3"
        aria-live="polite"
        role="listbox"
        aria-label="Search results"
      >
        {phase === "idle" && (
          <EmptyState description="Enter a name to search Wikipedia." />
        )}

        {isLoading && (
          <>
            {/* Outer #s1-search-results region is already aria-live="polite"
                — the centralized loading copy is announced from there. */}
            <p className="font-mono text-xs text-textmuted">
              {SEARCH_LOADING_TITLE}
            </p>
            <SearchResultSkeleton />
            <SearchResultSkeleton />
            <SearchResultSkeleton />
          </>
        )}

        {phase === "empty" && !isLoading && (
          <EmptyState
            tone="neutral"
            description={
              <>
                {SEARCH_EMPTY_DESCRIPTION}
                <br />
                <span className="mt-2 inline-block meta-mono text-textmuted">
                  Searched for{" "}
                  <span className="text-text">
                    &ldquo;{debouncedQuery.trim()}&rdquo;
                  </span>
                </span>
              </>
            }
          />
        )}

        {phase === "api-error" && !isLoading && (
          <RetryPanel
            tone="warning"
            eyebrow="Search"
            title={SEARCH_ERROR_TITLE}
            description={SEARCH_ERROR_DESCRIPTION}
            onRetry={() => {
              // Re-trigger fetch by nudging query (no-op set keeps debounce
              // stable but re-runs the effect).
              setQuery((q) => q + " ");
              setQuery((q) => q.trimEnd());
            }}
          />
        )}

        {phase === "results" &&
          !isLoading &&
          filteredResults.length === 0 && (
            <EmptyState
              tone="neutral"
              description={
                <>
                  No <span className="text-text">{DOMAIN_LABEL[domainFilter]}</span>{" "}
                  results in this search.
                  <br />
                  Switch the filter to <span className="text-text">All</span> to
                  see every match.
                </>
              }
              action={
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setDomainFilter("all")}
                >
                  Show all
                </Button>
              }
            />
          )}

        {phase === "results" &&
          !isLoading &&
          filteredResults.map((hit, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <Card
                key={hit.pageId}
                as="button"
                id={`s1-result-${hit.pageId}`}
                ref={(el) => {
                  resultRefs.current[idx] = el as HTMLButtonElement | null;
                }}
                type="button"
                role="option"
                selectable
                selected={isHighlighted}
                disabled={selectingId !== null}
                onClick={() => handleSelect(hit)}
                onFocus={() => setHighlightedIndex(idx)}
                onKeyDown={(e) =>
                  onResultKeyDown(
                    e as unknown as React.KeyboardEvent<HTMLButtonElement>,
                    idx,
                  )
                }
                aria-selected={isHighlighted}
                aria-label={`Select ${hit.title}`}
                aria-busy={selectingId === hit.pageId}
                data-disambiguation={hit.isDisambiguation || undefined}
                style={
                  {
                    "--cinematic-delay": `${Math.min(idx, 5) * 45}ms`,
                  } as CSSProperties
                }
                className={[
                  "cinematic-enter-soft cinematic-stagger flex w-full gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  hit.isDisambiguation ? "opacity-80" : "",
                ].join(" ")}
              >
                {hit.thumbnailUrl ? (
                  <img
                    src={hit.thumbnailUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-panel font-display text-lg text-textmuted"
                    aria-hidden="true"
                  >
                    {hit.title.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-body font-medium text-text">
                      {hit.title}
                    </span>
                    <Badge variant={domainBadgeVariant(hit.domain)}>
                      {domainBadgeLabel(hit.domain)}
                    </Badge>
                    <Badge variant="muted">
                      {hit.demoSubjectId ? "Demo" : "Wikipedia"}
                    </Badge>
                    {hit.isDisambiguation && (
                      <Badge variant="warning">Disambiguation</Badge>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 font-body text-sm text-textsub">
                    {hit.description || "No description available."}
                  </p>
                  {hit.isDisambiguation && (
                    <p className="mt-1 meta-mono text-textmuted">
                      This is a Wikipedia disambiguation page — open it to see
                      the list, then return and search for the specific subject
                      you mean.
                    </p>
                  )}
                </div>
                {selectingId === hit.pageId && (
                  <span className="font-mono text-xs text-gold">Loading…</span>
                )}
              </Card>
            );
          })}
      </div>

      <ConfirmDialog
        open={pendingSubject !== null}
        title="Replace the saved draft?"
        description={
          <>
            <p>
              You already have an in-progress draft for{" "}
              <span className="font-medium text-text">
                {draft?.coreIdentity.name}
              </span>
              . Starting{" "}
              <span className="font-medium text-text">
                {pendingSubjectName}
              </span>{" "}
              will discard the saved draft — including approved events,
              custom moments, and guardrail decisions.
            </p>
            <p className="mt-2 text-textmuted">
              This cannot be undone. To keep both, finish the current
              subject through Save draft first.
            </p>
          </>
        }
        confirmLabel="Replace draft"
        cancelLabel="Keep current draft"
        destructive
        onConfirm={handleConfirmOverwrite}
        onCancel={() => setPendingSubject(null)}
      />
    </div>
  );
}
