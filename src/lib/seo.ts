/**
 * SEO utilities: DataForSEO API integration with mock fallback,
 * TF*IDF analysis, performance score calculation.
 */

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  cpc: number;
}

export interface GSCData {
  keyword: string;
  url: string;
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  period: string;
}

export interface TFIDFTerm {
  term: string;
  score: number;
}

// ---------------------------------------------------------------------------
// DataForSEO Integration
// ---------------------------------------------------------------------------

async function callDataForSEO(
  endpoint: string,
  body: unknown
): Promise<unknown> {
  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
    return null;
  }

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

export async function getKeywordData(keywords: string[]): Promise<KeywordData[]> {
  if (!process.env.DATAFORSEO_LOGIN) {
    return mockKeywordData(keywords);
  }

  try {
    const result = await callDataForSEO(
      "keywords_data/google_ads/search_volume/live",
      [{ keywords, language_name: "German", location_name: "Germany" }]
    );

    // Parse real DataForSEO response
    const tasks = (result as { tasks: Array<{ result: Array<{ keyword: string; search_volume: number; competition: number; cpc: number }> }> }).tasks?.[0]?.result ?? [];
    return tasks.map(
      (item: { keyword: string; search_volume: number; cpc: number }) => ({
        keyword: item.keyword,
        searchVolume: item.search_volume ?? 0,
        cpc: item.cpc ?? 0,
      })
    );
  } catch (error) {
    console.error("DataForSEO error, falling back to mock:", error);
    return mockKeywordData(keywords);
  }
}

export async function getSuggestKeywords(
  seed: string
): Promise<KeywordData[]> {
  if (!process.env.DATAFORSEO_LOGIN) {
    return mockSuggestKeywords(seed);
  }

  try {
    const result = await callDataForSEO(
      "keywords_data/google_ads/keywords_for_keywords/live",
      [{ keywords: [seed], language_name: "German", location_name: "Germany" }]
    );

    const tasks = (result as { tasks: Array<{ result: Array<{ keyword: string; search_volume: number; cpc: number }> }> }).tasks?.[0]?.result ?? [];
    return tasks.slice(0, 20).map((item: { keyword: string; search_volume: number; cpc: number }) => ({
      keyword: item.keyword,
      searchVolume: item.search_volume ?? 0,
      cpc: item.cpc ?? 0,
    }));
  } catch {
    return mockSuggestKeywords(seed);
  }
}

// ---------------------------------------------------------------------------
// Mock keyword data
// ---------------------------------------------------------------------------

function mockKeywordData(keywords: string[]): KeywordData[] {
  const seedRandom = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  return keywords.map((kw) => {
    const seed = seedRandom(kw);
    return {
      keyword: kw,
      searchVolume: (seed % 9000) + 100,
      cpc: parseFloat(((seed % 500) / 100).toFixed(2)),
    };
  });
}

function mockSuggestKeywords(seed: string): KeywordData[] {
  const suggestions = [
    `${seed} ursachen`,
    `${seed} behandlung`,
    `${seed} symptome`,
    `${seed} tierarzt`,
    `${seed} zuhause behandeln`,
    `${seed} kosten`,
    `${seed} erfahrungen`,
    `${seed} was tun`,
    `${seed} anzeichen`,
    `${seed} hausmittel`,
  ];

  return mockKeywordData(suggestions);
}

// ---------------------------------------------------------------------------
// GSC Mock
// ---------------------------------------------------------------------------

export async function getGSCData(
  keywords: string[],
  url: string
): Promise<GSCData[]> {
  // In production: Google Search Console API
  // For development: mock data

  const seedRandom = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  return keywords.map((kw) => {
    const seed = seedRandom(kw + url);
    const position = (seed % 100) + 1;
    const impressions = Math.floor((seed % 900) + 100);
    const clicks = Math.floor(impressions * (((seed % 10) + 1) / 100));
    const ctr = parseFloat(((clicks / impressions) * 100).toFixed(1));

    return {
      keyword: kw,
      url,
      position,
      clicks,
      impressions,
      ctr,
      period: "last_7_days",
    };
  });
}

// ---------------------------------------------------------------------------
// Performance Score
// ---------------------------------------------------------------------------

export function calculatePerformanceScore(
  rankings: Array<{ position: number }>
): number {
  if (rankings.length === 0) return 0;

  const totalKeywords = rankings.length;
  const rankedKeywords = rankings.filter((r) => r.position <= 100).length;

  if (rankedKeywords === 0) return 0;

  const avgPosition =
    rankings
      .filter((r) => r.position <= 100)
      .reduce((sum, r) => sum + r.position, 0) / rankedKeywords;

  const score =
    (rankedKeywords / totalKeywords) * 100 * (1 - avgPosition / 100);

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getScoreColor(score: number): "green" | "yellow" | "red" {
  if (score >= 60) return "green";
  if (score >= 30) return "yellow";
  return "red";
}

export function getScoreBadgeClass(score: number): string {
  const color = getScoreColor(score);
  switch (color) {
    case "green":
      return "bg-green-100 text-green-800 border-green-200";
    case "yellow":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "red":
      return "bg-red-100 text-red-800 border-red-200";
  }
}

export function getRankingColor(position: number): string {
  if (position <= 3) return "text-green-600 font-bold";
  if (position <= 10) return "text-green-500";
  if (position <= 20) return "text-yellow-600";
  if (position <= 50) return "text-orange-500";
  return "text-red-500";
}

// ---------------------------------------------------------------------------
// TF*IDF Analysis
// ---------------------------------------------------------------------------

export function parseTFIDFCsv(csvContent: string): TFIDFTerm[] {
  const lines = csvContent.split("\n").filter((l) => l.trim());
  const results: TFIDFTerm[] = [];

  // Skip header if present
  const startIdx = lines[0]?.toLowerCase().includes("term") ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length >= 2) {
      const term = parts[0].trim().replace(/^["']|["']$/g, "");
      const score = parseFloat(parts[1].trim());
      if (term && !isNaN(score)) {
        results.push({ term, score });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 100);
}

// ---------------------------------------------------------------------------
// Internal link crawler (mock)
// ---------------------------------------------------------------------------

export async function findInternalLinks(
  domain: string,
  topic: string
): Promise<Array<{ url: string; anchor: string }>> {
  // In production: crawl the site and find relevant links
  // Mock: generate plausible internal links
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const baseLinks = [
    { url: `${domain}/blog/`, anchor: "Blog" },
    { url: `${domain}/ratgeber/`, anchor: "Ratgeber" },
    { url: `${domain}/produkte/`, anchor: "Produktübersicht" },
  ];

  // Add topic-adjacent links
  const topicLinks = [
    {
      url: `${domain}/ratgeber/${slug}-erkennen`,
      anchor: `${topic} erkennen`,
    },
    {
      url: `${domain}/ratgeber/${slug}-vorbeugung`,
      anchor: `${topic} vorbeugen`,
    },
  ];

  return [...baseLinks, ...topicLinks].slice(0, 5);
}

export async function findExternalLinks(
  topic: string
): Promise<Array<{ url: string; anchor: string }>> {
  // In production: use Perplexity/web search to find authoritative external sources
  return [
    {
      url: "https://www.vetline.de",
      anchor: "Vetline – Tierärztliche Informationen",
    },
    {
      url: "https://www.tieraerztekammer.de",
      anchor: "Bundestierärztekammer",
    },
  ];
}

// ---------------------------------------------------------------------------
// URL slug generation
// ---------------------------------------------------------------------------

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
