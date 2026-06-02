/**
 * Classify Wikipedia search hits into resolver-aligned domains.
 *
 * - `SubjectDomain` ("sports" | "music") is the **narrow** type the studio
 *   resolver is configured for. Do not widen it without also widening
 *   `RESOLVER_CONFIG.domains`.
 * - `SearchResultDomain` is the **wider** type S1 search uses so we can
 *   _label_ (not drop) results that fall outside the resolver's wheelhouse —
 *   e.g. actors, directors, comedians, athletes from sports we haven't
 *   modeled. The S1 filter chips ride on this wider type.
 *
 * Classifier pipeline:
 *   pass 1: description keywords (cheap, no network)
 *   pass 2: Wikidata occupation (P106) allowlist for unclassified hits
 *   default: anything still unknown is labeled "other"
 */

export type SubjectDomain = "sports" | "music";

/** Wider type used by S1 search results (resolver-supported + adjacent). */
export type SearchResultDomain = SubjectDomain | "entertainment" | "other";

/** Phrase lists — longer phrases checked first within each domain pass. */
export const SPORTS_KEYWORDS = [
  "basketball player",
  "baseball player",
  "american football player",
  "association football player",
  "football player",
  "ice hockey player",
  "tennis player",
  "professional wrestler",
  "mixed martial artist",
  "formula one driver",
  "olympic athlete",
  "professional athlete",
  "footballer",
  "goalkeeper",
  "quarterback",
  "pitcher",
  "boxer",
  "golfer",
  "swimmer",
  "gymnast",
  "skateboarder",
  "snowboarder",
  "cricketer",
  "rugby player",
  "racing driver",
  "motocross rider",
  "cyclist",
  "sprinter",
  "marathon runner",
  "wrestler",
  "fencer",
  "weightlifter",
  "bodybuilder",
  "sportsperson",
  "athlete",
] as const;

export const MUSIC_KEYWORDS = [
  "hip hop artist",
  "hip-hop artist",
  "record producer",
  "music producer",
  "singer-songwriter",
  "singer songwriter",
  "folk singer",
  "opera singer",
  "jazz musician",
  "jazz singer",
  "rock musician",
  "pop singer",
  "country singer",
  "r&b singer",
  "rapper",
  "songwriter",
  "composer",
  "musician",
  "singer",
  "vocalist",
  "guitarist",
  "bassist",
  "drummer",
  "pianist",
  "cellist",
  "violinist",
  "disc jockey",
  "conductor",
  "lyricist",
  "music artist",
  "recording artist",
  "band member",
  "frontman",
  "frontwoman",
] as const;

/** Wikidata occupation (P106) Q-IDs — curated allowlist. */
export const SPORTS_OCCUPATION_QIDS = new Set([
  "Q2066131", // athlete
  "Q937857", // association football player
  "Q3665646", // basketball player
  "Q10871364", // baseball player
  "Q19204627", // American football player
  "Q10833314", // tennis player
  "Q10873124", // boxer
  "Q11338576", // mixed martial artist
  "Q10843402", // racing driver
  "Q1852228", // professional wrestler
  "Q2142357", // coach
  "Q628099", // association football manager
  "Q11774891", // ice hockey player (was Q10800557 — that QID is actually "film actor"; bug fixed in 2026-06-01 search-relevance pass)
  "Q10866633", // cricketer
  "Q13381863", // basketball coach
  "Q10802995", // volleyball player
  "Q10842936", // handball player
]);

export const MUSIC_OCCUPATION_QIDS = new Set([
  "Q177220", // singer
  "Q639669", // musician
  "Q36834", // composer
  "Q753110", // songwriter
  "Q130857", // disc jockey
  "Q488205", // singer-songwriter
  "Q17125263", // rapper
  "Q2088357", // session musician
  "Q3455803", // record producer
  "Q264389", // vocalist
  "Q16145150", // music artist
]);

/** Entertainment keywords — actors, directors, hosts, comedians, etc. */
export const ENTERTAINMENT_KEYWORDS = [
  "stand-up comedian",
  "stand up comedian",
  "voice actor",
  "voice actress",
  "film director",
  "film producer",
  "television presenter",
  "television host",
  "talk show host",
  "podcast host",
  "screenwriter",
  "playwright",
  "choreographer",
  "comedian",
  "podcaster",
  "youtuber",
  "twitch streamer",
  "streamer",
  "actor",
  "actress",
  "filmmaker",
  "director",
  "producer",
  "dancer",
  "entertainer",
  "magician",
  "illusionist",
  "ballerina",
  "model",
] as const;

/** Wikidata occupation Q-IDs for entertainment-adjacent roles. */
export const ENTERTAINMENT_OCCUPATION_QIDS = new Set([
  "Q33999", // actor
  "Q10800557", // film actor
  "Q2526255", // film director
  "Q3282637", // film producer
  "Q28389", // screenwriter
  "Q947873", // television presenter
  "Q245068", // comedian
  "Q19350898", // YouTuber
  "Q822146", // entertainer
  "Q6625963", // stand-up comedian
  "Q21027763", // voice actor
  "Q5716684", // dancer
  "Q805221", // television actor
  "Q2259451", // stage actor
]);

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesKeyword(text: string, keyword: string): boolean {
  const lower = text.toLowerCase();
  const kw = keyword.toLowerCase();
  if (kw.includes(" ")) {
    return lower.includes(kw);
  }
  return new RegExp(`\\b${escapeRegex(kw)}\\b`, "i").test(lower);
}

function matchesAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((kw) => matchesKeyword(text, kw));
}

/**
 * Pass 1 — classify from Wikipedia short description.
 * Music is checked before sports/entertainment when both could match rare
 * crossover phrases (the resolver has more headroom for music than the
 * narrower entertainment label).
 */
export function classifyByDescription(
  description: string,
): SearchResultDomain | null {
  const text = description.trim();
  if (!text) return null;
  if (matchesAny(text, MUSIC_KEYWORDS)) return "music";
  if (matchesAny(text, SPORTS_KEYWORDS)) return "sports";
  if (matchesAny(text, ENTERTAINMENT_KEYWORDS)) return "entertainment";
  return null;
}

function domainFromOccupationQids(qids: string[]): SearchResultDomain | null {
  for (const id of qids) {
    if (MUSIC_OCCUPATION_QIDS.has(id)) return "music";
  }
  for (const id of qids) {
    if (SPORTS_OCCUPATION_QIDS.has(id)) return "sports";
  }
  for (const id of qids) {
    if (ENTERTAINMENT_OCCUPATION_QIDS.has(id)) return "entertainment";
  }
  return null;
}

function extractOccupationQids(entity: WikidataEntity): string[] {
  const claims = entity.claims?.P106 ?? [];
  const ids: string[] = [];
  for (const claim of claims) {
    const id = claim.mainsnak?.datavalue?.value?.id;
    if (id) ids.push(id);
  }
  return ids;
}

interface WikidataEntity {
  missing?: string;
  sitelinks?: { enwiki?: { title?: string } };
  claims?: {
    P106?: Array<{
      mainsnak?: { datavalue?: { value?: { id?: string } } };
    }>;
  };
}

interface WikidataEntitiesResponse {
  entities?: Record<string, WikidataEntity>;
}

/**
 * Pass 2 — batch Wikidata lookup by enwiki title. Returns map title → domain.
 * On failure returns empty map (callers fall back to "other" for unclassified).
 */
export async function classifyByWikidata(
  titles: string[],
  signal?: AbortSignal,
): Promise<Map<string, SearchResultDomain | null>> {
  const out = new Map<string, SearchResultDomain | null>();
  if (titles.length === 0) return out;

  try {
    const url = new URL(WIKIDATA_API);
    url.searchParams.set("action", "wbgetentities");
    url.searchParams.set("sites", "enwiki");
    url.searchParams.set("titles", titles.join("|"));
    url.searchParams.set("props", "claims|sitelinks");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const res = await fetch(url.toString(), { signal });
    if (!res.ok) {
      console.warn("[subjectDomain] Wikidata lookup failed", res.status);
      return out;
    }

    const data = (await res.json()) as WikidataEntitiesResponse;
    for (const entity of Object.values(data.entities ?? {})) {
      if (entity.missing !== undefined) continue;
      const title = entity.sitelinks?.enwiki?.title;
      if (!title) continue;
      const domain = domainFromOccupationQids(extractOccupationQids(entity));
      if (domain) out.set(title, domain);
    }
  } catch (err) {
    if (signal?.aborted) return out;
    console.warn("[subjectDomain] Wikidata lookup error", err);
  }

  return out;
}

export interface ClassifiableHit {
  title: string;
  description: string;
}

export interface ClassifiedHit<T extends ClassifiableHit> {
  hit: T;
  domain: SearchResultDomain;
}

/**
 * Two-pass classifier — keywords, then Wikidata for unknowns.
 *
 * **Returns every input hit.** Anything the keyword + Wikidata passes can't
 * classify is returned with `domain: "other"` (not dropped) so the S1 filter
 * UI can decide what to surface. Use the filter chips to scope visibility
 * rather than calling `classifyHits` with a narrower contract.
 *
 * `droppedCount` is always 0 — kept for back-compat with the older
 * dropping-classifier callsites and tests; it will be removed once those are
 * migrated.
 */
export async function classifyHits<T extends ClassifiableHit>(
  hits: T[],
  signal?: AbortSignal,
): Promise<{ classified: ClassifiedHit<T>[]; droppedCount: number }> {
  const classified: ClassifiedHit<T>[] = new Array(hits.length);
  const unknownIndices: number[] = [];
  const unknownTitles: string[] = [];

  hits.forEach((hit, idx) => {
    const byDesc = classifyByDescription(hit.description);
    if (byDesc) {
      classified[idx] = { hit, domain: byDesc };
    } else {
      unknownIndices.push(idx);
      unknownTitles.push(hit.title);
    }
  });

  if (unknownTitles.length > 0) {
    const wikidataMap = await classifyByWikidata(unknownTitles, signal);
    unknownIndices.forEach((idx) => {
      const hit = hits[idx];
      const domain = wikidataMap.get(hit.title) ?? "other";
      classified[idx] = { hit, domain };
    });
  }

  return { classified, droppedCount: 0 };
}
