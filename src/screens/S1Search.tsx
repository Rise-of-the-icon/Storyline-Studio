import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { SearchResultSkeleton } from "../components/Skeleton";
import { useTwin } from "../context/TwinContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { getDemoSubjectById } from "../lib/mockData";
import {
  createDraftFromDemoSubject,
  createDraftFromWikipedia,
  fetchWikipediaProfile,
  searchWikipedia,
  type SearchSource,
  type WikipediaSearchHit,
} from "../lib/wikipedia";

type SearchPhase =
  | "idle"
  | "typing"
  | "loading"
  | "results"
  | "empty"
  | "error";

export function S1Search() {
  const { setDraft, goTo } = useTwin();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);
  const [phase, setPhase] = useState<SearchPhase>("idle");
  const [results, setResults] = useState<WikipediaSearchHit[]>([]);
  const [source, setSource] = useState<SearchSource>("live");
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setPhase("idle");
      setResults([]);
      setSource("live");
      return;
    }
    if (trimmed.length < 2) {
      setPhase("typing");
      setResults([]);
      return;
    }
  }, [query]);

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
      if (response.results.length === 0) {
        setPhase("empty");
      } else {
        setPhase("results");
      }
    });

    return () => controller.abort();
  }, [debouncedQuery]);

  const handleSelect = useCallback(
    async (hit: WikipediaSearchHit) => {
      setSelectingId(hit.pageId);
      setSelectError(null);
      try {
        let draft;
        if (hit.demoSubjectId) {
          const subject = getDemoSubjectById(hit.demoSubjectId);
          if (!subject) throw new Error("Demo subject not found");
          draft = createDraftFromDemoSubject(subject);
        } else {
          const profile = await fetchWikipediaProfile(hit.title);
          draft = createDraftFromWikipedia(profile);
        }
        setDraft(draft);
        goTo("S2");
      } catch {
        setSelectError("Could not load that profile. Try again or pick a demo subject.");
      } finally {
        setSelectingId(null);
      }
    },
    [goTo, setDraft],
  );

  const showDemoNote = source === "demo" && results.length > 0;
  const isLoading = phase === "loading";

  return (
    <div className="mx-auto max-w-[680px] px-4 py-10">
      <h1 className="font-display text-4xl tracking-wide text-text">
        Find a voice subject
      </h1>
      <p className="mt-2 font-body text-sm text-textsub">
        Search Wikipedia to start a digital twin.
      </p>

      <label className="mt-8 block">
        <span className="sr-only">Search by name</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a public figure…"
          autoComplete="off"
          className="w-full rounded-lg border border-border bg-card px-4 py-3 font-body text-text placeholder:text-textmuted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
      </label>

      {phase === "typing" && query.trim().length > 0 && (
        <p className="mt-3 font-mono text-xs text-textmuted">
          Type at least 2 characters to search…
        </p>
      )}

      {showDemoNote && (
        <p
          className="mt-3 rounded-md border border-bordermid bg-panel px-3 py-2 font-mono text-xs text-textsub"
          role="status"
        >
          Showing demo subjects — Wikipedia is unavailable or rate-limited.
        </p>
      )}

      {selectError && (
        <p className="mt-3 font-body text-sm text-danger" role="alert">
          {selectError}
        </p>
      )}

      <div className="mt-6 space-y-3" aria-live="polite">
        {phase === "idle" && (
          <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
            <p className="font-body text-sm text-textsub">
              Enter a name to search Wikipedia.
            </p>
          </div>
        )}

        {isLoading && (
          <>
            <p className="font-mono text-xs text-textmuted">Searching…</p>
            <SearchResultSkeleton />
            <SearchResultSkeleton />
            <SearchResultSkeleton />
          </>
        )}

        {phase === "empty" && !isLoading && (
          <div className="rounded-lg border border-border bg-card px-6 py-10 text-center">
            <p className="font-body text-sm text-text">
              No results — try a different name.
            </p>
          </div>
        )}

        {(phase === "results" || phase === "error") &&
          !isLoading &&
          results.map((hit) => (
            <button
              key={hit.pageId}
              type="button"
              disabled={selectingId !== null}
              onClick={() => handleSelect(hit)}
              aria-label={`Select ${hit.title}`}
              aria-busy={selectingId === hit.pageId}
              className="flex w-full gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-bordermid hover:bg-hover focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-60"
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
                  <Badge variant={hit.demoSubjectId ? "gold" : "blue"}>
                    {hit.demoSubjectId ? "Demo" : "Wikipedia"}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 font-body text-sm text-textsub">
                  {hit.description || "No description available."}
                </p>
              </div>
              {selectingId === hit.pageId && (
                <span className="font-mono text-xs text-gold">Loading…</span>
              )}
            </button>
          ))}
      </div>

      {import.meta.env.DEV && (
        <div className="mt-10 border-t border-border pt-4">
          <Button
            variant="ghost"
            size="small"
            onClick={() => {
              setQuery("michael");
            }}
          >
            Dev: fill &quot;michael&quot;
          </Button>
        </div>
      )}
    </div>
  );
}
