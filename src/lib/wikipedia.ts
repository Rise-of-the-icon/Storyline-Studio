import { SCHEMA_VERSION, type DigitalTwinProfile, type WikipediaProfile } from "../types/twin";
import { searchDemoSubjects, type DemoSearchSubject } from "./mockData";
import { classifyHits, type SubjectDomain } from "./subjectDomain";

const WIKI_SEARCH = "https://en.wikipedia.org/w/rest.php/v1/search/page";
const WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/";

export type SearchSource = "live" | "demo";

export interface WikipediaSearchHit {
  pageId: string;
  title: string;
  description: string;
  domain: SubjectDomain;
  thumbnailUrl?: string;
  /** Present when this hit maps to a full local demo twin. */
  demoSubjectId?: string;
}

export interface WikipediaSearchResponse {
  results: WikipediaSearchHit[];
  source: SearchSource;
  /** Live Wikipedia returned pages but none matched sports/music filter. */
  allFilteredByDomain?: boolean;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
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
      throw new Error(`Wikipedia search failed (${res.status})`);
    }

    const data = (await res.json()) as {
      pages?: Array<{
        id: number;
        title: string;
        excerpt?: string;
        thumbnail?: { url?: string };
      }>;
    };

    const rawHits = (data.pages ?? []).map((page) => ({
      pageId: String(page.id),
      title: page.title,
      description: stripHtml(page.excerpt ?? ""),
      thumbnailUrl: page.thumbnail?.url,
    }));

    const rawCount = rawHits.length;
    const { classified } = await classifyHits(rawHits, signal);
    const results: WikipediaSearchHit[] = classified.map(({ hit, domain }) => ({
      ...hit,
      domain,
    }));

    return {
      results,
      source: "live",
      allFilteredByDomain: rawCount > 0 && results.length === 0,
    };
  } catch (err) {
    if (signal?.aborted) {
      return { results: [], source: "live" };
    }
    console.warn("[wikipedia] search fallback to demo subjects", err);
    return {
      results: searchDemoSubjects(q),
      source: "demo",
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

export function createDraftFromDemoSubject(subject: DemoSearchSubject): DigitalTwinProfile {
  const template = subject.buildTwin();
  return {
    ...template,
    twinId: crypto.randomUUID(),
    consentAcknowledged: false,
    draftStatus: "draft",
    createdAtISO: new Date().toISOString(),
  };
}
