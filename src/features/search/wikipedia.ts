import { SCHEMA_VERSION, type DigitalTwinProfile, type WikipediaProfile } from "@/types/twin";
import { searchDemoSubjects, type DemoSubject } from "@/data/demoSubjects";
import { classifyHits, type SearchResultDomain } from "./subjectDomain";

const WIKI_SEARCH = "https://en.wikipedia.org/w/rest.php/v1/search/page";
const WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/";

export type SearchSource = "live" | "demo";
/**
 * Why the live API didn't supply results, if applicable. Drives S1's banner /
 * dedicated error empty-state copy.
 */
export type SearchErrorCode = "unavailable" | "rate-limited";

export interface WikipediaSearchHit {
  pageId: string;
  title: string;
  description: string;
  domain: SearchResultDomain;
  thumbnailUrl?: string;
  /** True when the page looks like a Wikipedia disambiguation page. */
  isDisambiguation?: boolean;
  /** Present when this hit maps to a full local demo twin. */
  demoSubjectId?: string;
}

export interface WikipediaSearchResponse {
  results: WikipediaSearchHit[];
  source: SearchSource;
  /**
   * Set when the live API failed and the response is a demo fallback (or
   * empty). UI surfaces a "Search is unavailable" banner in this case.
   */
  error?: SearchErrorCode;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

/**
 * Heuristic disambiguation detection from the search-result row. Wikipedia's
 * `/v1/search/page` endpoint doesn't tag disambiguation pages directly, so we
 * lean on two near-universal signals:
 *   - title ends with "(disambiguation)" (case-insensitive)
 *   - excerpt contains "may refer to" / "may also refer to" /
 *     "is a disambiguation page"
 * Confirmation happens at fetch time via `WIKI_SUMMARY.type === "disambiguation"`
 * but is too expensive to do for every row at search time.
 */
export function detectDisambiguation(title: string, excerpt: string): boolean {
  if (/\(disambiguation\)\s*$/i.test(title.trim())) return true;
  const lower = excerpt.toLowerCase();
  return (
    lower.includes("may refer to") ||
    lower.includes("may also refer to") ||
    lower.includes("is a disambiguation page") ||
    lower.includes("disambiguation page providing links")
  );
}

export async function searchWikipedia(
  query: string,
  signal?: AbortSignal,
): Promise<WikipediaSearchResponse> {
  const q = query.trim();
  if (q.length < 2) {
    return { results: [], source: "live" };
  }

  try {
    const url = new URL(WIKI_SEARCH);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "10");

    const res = await fetch(url.toString(), {
      signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const code: SearchErrorCode = res.status === 429 ? "rate-limited" : "unavailable";
      throw Object.assign(new Error(`Wikipedia search failed (${res.status})`), {
        searchErrorCode: code,
      });
    }

    const data = (await res.json()) as {
      pages?: Array<{
        id: number;
        title: string;
        excerpt?: string;
        thumbnail?: { url?: string };
      }>;
    };

    const rawHits = (data.pages ?? []).map((page) => {
      const description = stripHtml(page.excerpt ?? "");
      return {
        pageId: String(page.id),
        title: page.title,
        description,
        thumbnailUrl: page.thumbnail?.url,
        isDisambiguation: detectDisambiguation(page.title, description),
      };
    });

    const { classified } = await classifyHits(rawHits, signal);
    const results: WikipediaSearchHit[] = classified.map(({ hit, domain }) => ({
      ...hit,
      domain,
    }));

    return { results, source: "live" };
  } catch (err: unknown) {
    if (signal?.aborted) {
      return { results: [], source: "live" };
    }
    const errorCode: SearchErrorCode =
      (err as { searchErrorCode?: SearchErrorCode })?.searchErrorCode ??
      "unavailable";
    console.warn("[wikipedia] search fallback to demo subjects", err);
    return {
      results: searchDemoSubjects(q),
      source: "demo",
      error: errorCode,
    };
  }
}

export async function fetchWikipediaProfile(
  title: string,
  signal?: AbortSignal,
): Promise<WikipediaProfile> {
  const slug = encodeURIComponent(title.replace(/ /g, "_"));
  const res = await fetch(`${WIKI_SUMMARY}${slug}`, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Wikipedia summary failed (${res.status})`);
  }

  const data = (await res.json()) as {
    pageid?: number;
    title?: string;
    description?: string;
    extract?: string;
    thumbnail?: { source?: string };
    content_urls?: { desktop?: { page?: string } };
    revision?: string;
  };

  const pageTitle = data.title ?? title;
  return {
    pageId: String(data.pageid ?? title),
    title: pageTitle,
    summary: data.extract ?? "",
    description: data.description ?? "",
    imageUrl: data.thumbnail?.source,
    sourceUrl:
      data.content_urls?.desktop?.page ??
      `https://en.wikipedia.org/wiki/${slug}`,
    revisionId: data.revision,
  };
}

export function createDraftFromWikipedia(
  wikipedia: WikipediaProfile,
): DigitalTwinProfile {
  return {
    schemaVersion: SCHEMA_VERSION,
    twinId: crypto.randomUUID(),
    consentAcknowledged: false,
    coreIdentity: { name: wikipedia.title },
    wikipedia,
    timeline: [],
    customMoments: [],
    guardrailReviews: [],
    draftStatus: "draft",
    createdAtISO: new Date().toISOString(),
  };
}

export function createDraftFromDemoSubject(subject: DemoSubject): DigitalTwinProfile {
  const template = subject.buildTwin();
  return {
    ...template,
    twinId: crypto.randomUUID(),
    consentAcknowledged: false,
    draftStatus: "draft",
    createdAtISO: new Date().toISOString(),
  };
}
