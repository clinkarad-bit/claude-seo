/**
 * DataForSEO backlink API integration with mock fallbacks.
 * Also includes Hunter.io contact finder with mock fallback.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BacklinkData {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  linkType: "dofollow" | "nofollow" | "ugc" | "sponsored";
  domainAuthority: number;
  pageAuthority: number;
  firstSeen: string;
  lastSeen: string;
  isLost: boolean;
}

export interface BacklinkSummary {
  totalBacklinks: number;
  referringDomains: number;
  dofollowLinks: number;
  nofollowLinks: number;
  domainAuthority: number;
  avgDomainAuthority: number;
  topAnchors: Array<{ anchor: string; count: number }>;
  topPages: Array<{ url: string; backlinks: number }>;
}

export interface GapResult {
  domain: string;
  targetHasLink: boolean;
  competitors: Array<{ domain: string; hasLink: boolean }>;
  domainAuthority: number;
  totalBacklinks: number;
}

export interface BrokenBacklinkData {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  httpCode: number;
  firstSeen: string;
  lastChecked: string;
  domainAuthority: number;
}

export interface CompetitorData {
  domain: string;
  commonBacklinks: number;
  totalBacklinks: number;
  domainAuthority: number;
  overlapPercentage: number;
}

export interface MentionData {
  url: string;
  title: string;
  snippet: string;
  domain: string;
  publishedAt: string;
  hasLink: boolean;
  sentiment: "positive" | "neutral" | "negative";
}

export interface ContactData {
  email: string;
  firstName: string | null;
  lastName: string | null;
  position: string | null;
  domain: string;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seedRandom(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededValue(seed: number, min: number, max: number): number {
  return min + (seed % (max - min + 1));
}

function hasDataForSEOCredentials(): boolean {
  return !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
}

function hasHunterCredentials(): boolean {
  return !!process.env.HUNTER_API_KEY;
}

async function callDataForSEO(
  endpoint: string,
  body: unknown
): Promise<unknown> {
  const credentials = Buffer.from(
    `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
  ).toString("base64");

  const response = await fetch(`https://api.dataforseo.com/v3/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`DataForSEO error: ${response.statusText}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Fetch Backlinks
// ---------------------------------------------------------------------------

export async function fetchBacklinks(
  domain: string
): Promise<BacklinkData[]> {
  if (!hasDataForSEOCredentials()) {
    return mockBacklinks(domain);
  }

  try {
    const result = await callDataForSEO("backlinks/backlinks/live", [
      {
        target: domain,
        limit: 100,
        order_by: ["rank.desc"],
      },
    ]);

    const items =
      (result as { tasks?: Array<{ result?: Array<{ items?: unknown[] }> }> })
        .tasks?.[0]?.result?.[0]?.items ?? [];

    return (items as Array<Record<string, unknown>>).map((item) => ({
      sourceUrl: (item.url_from as string) ?? "",
      targetUrl: (item.url_to as string) ?? "",
      anchorText: (item.anchor as string) ?? "",
      linkType: mapLinkType(item.dofollow as boolean | undefined),
      domainAuthority: (item.domain_from_rank as number) ?? 0,
      pageAuthority: (item.page_from_rank as number) ?? 0,
      firstSeen: (item.first_seen as string) ?? "",
      lastSeen: (item.last_seen as string) ?? "",
      isLost: (item.is_lost as boolean) ?? false,
    }));
  } catch (error) {
    console.error("DataForSEO backlinks error, falling back to mock:", error);
    return mockBacklinks(domain);
  }
}

function mapLinkType(
  dofollow?: boolean
): "dofollow" | "nofollow" | "ugc" | "sponsored" {
  if (dofollow === true) return "dofollow";
  return "nofollow";
}

// ---------------------------------------------------------------------------
// Fetch Backlink Summary
// ---------------------------------------------------------------------------

export async function fetchBacklinkSummary(
  domain: string
): Promise<BacklinkSummary> {
  if (!hasDataForSEOCredentials()) {
    return mockBacklinkSummary(domain);
  }

  try {
    const result = await callDataForSEO("backlinks/summary", [
      { target: domain },
    ]);

    const data =
      (
        result as {
          tasks?: Array<{ result?: Array<Record<string, unknown>> }>;
        }
      ).tasks?.[0]?.result?.[0] ?? {};

    return {
      totalBacklinks: (data.total_backlinks as number) ?? 0,
      referringDomains: (data.referring_domains as number) ?? 0,
      dofollowLinks: (data.dofollow as number) ?? 0,
      nofollowLinks: (data.nofollow as number) ?? 0,
      domainAuthority: (data.rank as number) ?? 0,
      avgDomainAuthority: (data.referring_domains_rank as number) ?? 0,
      topAnchors: [],
      topPages: [],
    };
  } catch (error) {
    console.error("DataForSEO summary error, falling back to mock:", error);
    return mockBacklinkSummary(domain);
  }
}

// ---------------------------------------------------------------------------
// Domain Intersection (Link Gap)
// ---------------------------------------------------------------------------

export async function fetchDomainIntersection(
  target: string,
  competitors: string[]
): Promise<GapResult[]> {
  if (!hasDataForSEOCredentials()) {
    return mockDomainIntersection(target, competitors);
  }

  try {
    const targets: Record<string, string> = { 1: target };
    competitors.forEach((c, i) => {
      targets[String(i + 2)] = c;
    });

    const result = await callDataForSEO(
      "backlinks/domain_intersection/live",
      [
        {
          targets,
          limit: 100,
          order_by: ["1.rank.desc"],
        },
      ]
    );

    const items =
      (result as { tasks?: Array<{ result?: Array<{ items?: unknown[] }> }> })
        .tasks?.[0]?.result?.[0]?.items ?? [];

    return (items as Array<Record<string, unknown>>).map((item) => ({
      domain: (item.domain as string) ?? "",
      targetHasLink: !!(item["1"] as Record<string, unknown>)?.is_intersected,
      competitors: competitors.map((c, i) => ({
        domain: c,
        hasLink: !!(item[String(i + 2)] as Record<string, unknown>)
          ?.is_intersected,
      })),
      domainAuthority: ((item as Record<string, unknown>).rank as number) ?? 0,
      totalBacklinks:
        ((item as Record<string, unknown>).backlinks as number) ?? 0,
    }));
  } catch (error) {
    console.error("DataForSEO intersection error, falling back to mock:", error);
    return mockDomainIntersection(target, competitors);
  }
}

// ---------------------------------------------------------------------------
// Broken Backlinks
// ---------------------------------------------------------------------------

export async function fetchBrokenBacklinks(
  domain: string
): Promise<BrokenBacklinkData[]> {
  if (!hasDataForSEOCredentials()) {
    return mockBrokenBacklinks(domain);
  }

  try {
    const result = await callDataForSEO("backlinks/broken_backlinks/live", [
      { target: domain, limit: 100 },
    ]);

    const items =
      (result as { tasks?: Array<{ result?: Array<{ items?: unknown[] }> }> })
        .tasks?.[0]?.result?.[0]?.items ?? [];

    return (items as Array<Record<string, unknown>>).map((item) => ({
      sourceUrl: (item.url_from as string) ?? "",
      targetUrl: (item.url_to as string) ?? "",
      anchorText: (item.anchor as string) ?? "",
      httpCode: (item.http_code as number) ?? 404,
      firstSeen: (item.first_seen as string) ?? "",
      lastChecked: (item.last_seen as string) ?? "",
      domainAuthority: (item.domain_from_rank as number) ?? 0,
    }));
  } catch (error) {
    console.error("DataForSEO broken links error, falling back to mock:", error);
    return mockBrokenBacklinks(domain);
  }
}

// ---------------------------------------------------------------------------
// Competitors
// ---------------------------------------------------------------------------

export async function fetchCompetitors(
  domain: string
): Promise<CompetitorData[]> {
  if (!hasDataForSEOCredentials()) {
    return mockCompetitors(domain);
  }

  try {
    const result = await callDataForSEO("backlinks/competitors", [
      { target: domain, limit: 20 },
    ]);

    const items =
      (result as { tasks?: Array<{ result?: Array<{ items?: unknown[] }> }> })
        .tasks?.[0]?.result?.[0]?.items ?? [];

    return (items as Array<Record<string, unknown>>).map((item) => ({
      domain: (item.domain as string) ?? "",
      commonBacklinks: (item.common_backlinks as number) ?? 0,
      totalBacklinks: (item.total_backlinks as number) ?? 0,
      domainAuthority: (item.rank as number) ?? 0,
      overlapPercentage: (item.overlap as number) ?? 0,
    }));
  } catch (error) {
    console.error("DataForSEO competitors error, falling back to mock:", error);
    return mockCompetitors(domain);
  }
}

// ---------------------------------------------------------------------------
// Brand Mentions (Content Analysis)
// ---------------------------------------------------------------------------

export async function searchBrandMentions(
  keywords: string[]
): Promise<MentionData[]> {
  if (!hasDataForSEOCredentials()) {
    return mockBrandMentions(keywords);
  }

  try {
    const result = await callDataForSEO("content_analysis/search/live", [
      {
        keyword: keywords.join(" OR "),
        search_mode: "as_is",
        limit: 50,
      },
    ]);

    const items =
      (result as { tasks?: Array<{ result?: Array<{ items?: unknown[] }> }> })
        .tasks?.[0]?.result?.[0]?.items ?? [];

    return (items as Array<Record<string, unknown>>).map((item) => ({
      url: (item.url as string) ?? "",
      title: (item.title as string) ?? "",
      snippet: (item.snippet as string) ?? "",
      domain: (item.domain as string) ?? "",
      publishedAt: (item.date_published as string) ?? "",
      hasLink: (item.is_link as boolean) ?? false,
      sentiment: mapSentiment(item.sentiment as Record<string, number> | undefined),
    }));
  } catch (error) {
    console.error("DataForSEO mentions error, falling back to mock:", error);
    return mockBrandMentions(keywords);
  }
}

function mapSentiment(
  sentiment?: Record<string, number>
): "positive" | "neutral" | "negative" {
  if (!sentiment) return "neutral";
  const { positive = 0, negative = 0 } = sentiment;
  if (positive > negative) return "positive";
  if (negative > positive) return "negative";
  return "neutral";
}

// ---------------------------------------------------------------------------
// Contact Finder (Hunter.io)
// ---------------------------------------------------------------------------

export async function findContacts(
  domain: string
): Promise<ContactData[]> {
  if (!hasHunterCredentials()) {
    return mockContacts(domain);
  }

  try {
    const apiKey = process.env.HUNTER_API_KEY;
    const response = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}`,
      { method: "GET" }
    );

    if (!response.ok) {
      throw new Error(`Hunter.io error: ${response.statusText}`);
    }

    const json = (await response.json()) as {
      data?: {
        emails?: Array<{
          value: string;
          first_name: string | null;
          last_name: string | null;
          position: string | null;
          confidence: number;
        }>;
      };
    };

    return (json.data?.emails ?? []).map((email) => ({
      email: email.value,
      firstName: email.first_name,
      lastName: email.last_name,
      position: email.position,
      domain,
      confidence: email.confidence,
    }));
  } catch (error) {
    console.error("Hunter.io error, falling back to mock:", error);
    return mockContacts(domain);
  }
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

function mockBacklinks(domain: string): BacklinkData[] {
  const seed = seedRandom(domain);
  const sources = [
    "techblog.de",
    "marketing-magazin.de",
    "seo-experten.de",
    "digitale-wirtschaft.de",
    "online-ratgeber.de",
    "branchenbuch-online.de",
    "fachportal24.de",
    "startup-news.de",
  ];

  return sources.map((source, i) => {
    const s = seedRandom(domain + source + i);
    return {
      sourceUrl: `https://${source}/artikel/${seededValue(s, 100, 9999)}`,
      targetUrl: `https://${domain}/`,
      anchorText:
        i % 3 === 0
          ? domain.replace(/\.\w+$/, "")
          : i % 3 === 1
            ? "Hier klicken"
            : `${domain.replace(/\.\w+$/, "")} Ratgeber`,
      linkType: (["dofollow", "nofollow", "dofollow", "dofollow"] as const)[
        i % 4
      ],
      domainAuthority: seededValue(s, 15, 85),
      pageAuthority: seededValue(s + 1, 10, 70),
      firstSeen: new Date(
        Date.now() - seededValue(s, 30, 365) * 86400000
      ).toISOString(),
      lastSeen: new Date(
        Date.now() - seededValue(s, 0, 14) * 86400000
      ).toISOString(),
      isLost: i === 5,
    };
  });
}

function mockBacklinkSummary(domain: string): BacklinkSummary {
  const seed = seedRandom(domain);
  const total = seededValue(seed, 200, 5000);
  const referring = seededValue(seed + 1, 50, 800);

  return {
    totalBacklinks: total,
    referringDomains: referring,
    dofollowLinks: Math.round(total * 0.72),
    nofollowLinks: Math.round(total * 0.28),
    domainAuthority: seededValue(seed + 2, 20, 75),
    avgDomainAuthority: seededValue(seed + 3, 25, 55),
    topAnchors: [
      { anchor: domain.replace(/\.\w+$/, ""), count: seededValue(seed, 20, 150) },
      { anchor: "Hier klicken", count: seededValue(seed + 1, 10, 80) },
      { anchor: `${domain.replace(/\.\w+$/, "")} Ratgeber`, count: seededValue(seed + 2, 5, 40) },
      { anchor: domain, count: seededValue(seed + 3, 5, 30) },
      { anchor: "Webseite besuchen", count: seededValue(seed + 4, 3, 20) },
    ],
    topPages: [
      { url: `https://${domain}/`, backlinks: seededValue(seed, 50, 300) },
      { url: `https://${domain}/blog/`, backlinks: seededValue(seed + 1, 20, 100) },
      { url: `https://${domain}/ratgeber/`, backlinks: seededValue(seed + 2, 10, 60) },
    ],
  };
}

function mockDomainIntersection(
  target: string,
  competitors: string[]
): GapResult[] {
  const domains = [
    "branchenbuch-online.de",
    "fachportal24.de",
    "seo-verzeichnis.de",
    "marketingforum.de",
    "digitale-trends.de",
    "gastbeitrag-portal.de",
    "pr-newswire.de",
    "startup-directory.de",
  ];

  return domains.map((d, i) => {
    const s = seedRandom(target + d);
    return {
      domain: d,
      targetHasLink: i % 3 !== 0,
      competitors: competitors.map((c, j) => ({
        domain: c,
        hasLink: seedRandom(c + d) % 2 === 0 || j === 0,
      })),
      domainAuthority: seededValue(s, 20, 80),
      totalBacklinks: seededValue(s, 100, 5000),
    };
  });
}

function mockBrokenBacklinks(domain: string): BrokenBacklinkData[] {
  const seed = seedRandom(domain);
  const sources = [
    "alte-seite.de",
    "verzeichnis-portal.de",
    "blog-archiv.de",
  ];

  return sources.map((source, i) => {
    const s = seedRandom(domain + source);
    return {
      sourceUrl: `https://${source}/link/${seededValue(s, 100, 9999)}`,
      targetUrl: `https://${domain}/seite-${seededValue(s, 1, 50)}`,
      anchorText: `${domain.replace(/\.\w+$/, "")} Info`,
      httpCode: i === 0 ? 404 : i === 1 ? 410 : 404,
      firstSeen: new Date(
        Date.now() - seededValue(seed + i, 60, 300) * 86400000
      ).toISOString(),
      lastChecked: new Date(
        Date.now() - seededValue(seed + i, 1, 7) * 86400000
      ).toISOString(),
      domainAuthority: seededValue(s, 15, 60),
    };
  });
}

function mockCompetitors(domain: string): CompetitorData[] {
  const seed = seedRandom(domain);
  const competitors = [
    "konkurrent-a.de",
    "konkurrent-b.de",
    "wettbewerber-eins.de",
    "branchenleader.de",
    "marktfuehrer-online.de",
  ];

  return competitors.map((c, i) => {
    const s = seedRandom(domain + c);
    return {
      domain: c,
      commonBacklinks: seededValue(s, 5, 120),
      totalBacklinks: seededValue(s + 1, 200, 8000),
      domainAuthority: seededValue(s + 2, 25, 85),
      overlapPercentage: parseFloat(
        (seededValue(seed + i, 5, 45) / 100).toFixed(2)
      ),
    };
  });
}

function mockBrandMentions(keywords: string[]): MentionData[] {
  const primary = keywords[0] ?? "brand";
  const seed = seedRandom(primary);
  const sites = [
    { domain: "tech-nachrichten.de", title: `${primary} im Test: Unsere Erfahrung` },
    { domain: "branchen-journal.de", title: `Marktanalyse: ${primary} wächst` },
    { domain: "digital-review.de", title: `${primary} – Vor- und Nachteile` },
    { domain: "startup-magazin.de", title: `Interview mit ${primary} Gründer` },
    { domain: "forum.fachverband.de", title: `Erfahrungen mit ${primary}?` },
  ];

  return sites.map((site, i) => {
    const s = seedRandom(primary + site.domain);
    return {
      url: `https://${site.domain}/artikel/${seededValue(s, 1000, 9999)}`,
      title: site.title,
      snippet: `... ${primary} bietet innovative Lösungen im Bereich der digitalen Transformation. Laut Experten ...`,
      domain: site.domain,
      publishedAt: new Date(
        Date.now() - seededValue(s, 1, 90) * 86400000
      ).toISOString(),
      hasLink: i < 2,
      sentiment: (["positive", "neutral", "positive", "positive", "neutral"] as const)[i],
    };
  });
}

function mockContacts(domain: string): ContactData[] {
  const seed = seedRandom(domain);
  const name = domain.replace(/\.\w+$/, "").replace(/[^a-z]/gi, "");
  const contacts = [
    { first: "Max", last: "Müller", pos: "Redaktionsleiter" },
    { first: "Anna", last: "Schmidt", pos: "Marketing Manager" },
    { first: "Thomas", last: "Weber", pos: "Content Manager" },
  ];

  return contacts.map((c, i) => ({
    email: `${c.first.toLowerCase()}.${c.last.toLowerCase()}@${domain}`,
    firstName: c.first,
    lastName: c.last,
    position: c.pos,
    domain,
    confidence: seededValue(seed + i, 60, 99),
  }));
}
