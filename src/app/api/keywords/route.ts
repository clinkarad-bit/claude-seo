import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  customerId: z.string().min(1, "Kunde ist erforderlich"),
  seedKeywords: z.string().optional().default(""),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  const where = customerId ? { customerId } : {};

  const maps = await prisma.keywordMap.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { companyName: true } },
      _count: { select: { hubs: true } },
    },
  });

  return NextResponse.json(maps);
}

// ---- Mock keyword generation helpers ----

const GERMAN_HUBS: { name: string; keywords: string[] }[] = [
  {
    name: "SEO Grundlagen",
    keywords: [
      "seo optimierung", "suchmaschinenoptimierung", "seo strategie",
      "seo tipps", "onpage seo", "offpage seo", "technisches seo",
      "seo analyse", "seo audit", "seo check", "seo ranking verbessern",
      "seo für anfänger", "seo agentur", "seo beratung", "seo kosten",
    ],
  },
  {
    name: "Content Marketing",
    keywords: [
      "content marketing strategie", "content erstellung", "blog strategie",
      "content plan erstellen", "redaktionsplan", "content ideen",
      "content marketing agentur", "content marketing beispiele",
      "storytelling marketing", "content distribution", "evergreen content",
      "content audit", "pillar content", "content marketing roi",
    ],
  },
  {
    name: "Keyword Recherche",
    keywords: [
      "keyword recherche tool", "keyword analyse", "keyword planner",
      "long tail keywords finden", "suchvolumen prüfen", "keyword difficulty",
      "keyword mapping", "keyword clustering", "wdf idf analyse",
      "semantische keywords", "keyword kannibalisierung", "keyword gap analyse",
    ],
  },
  {
    name: "Lokales SEO",
    keywords: [
      "local seo", "google my business optimieren", "lokale suchmaschinenoptimierung",
      "google maps ranking", "lokale keywords", "bewertungen sammeln",
      "nap konsistenz", "lokale landingpages", "regional seo",
      "google unternehmensprofil", "lokale seo agentur",
    ],
  },
  {
    name: "Technisches SEO",
    keywords: [
      "core web vitals", "page speed optimierung", "crawlability",
      "indexierung prüfen", "xml sitemap erstellen", "robots txt",
      "canonical tag", "hreflang tag", "structured data",
      "schema markup", "mobile first indexierung", "ssl zertifikat seo",
    ],
  },
  {
    name: "Linkbuilding",
    keywords: [
      "backlinks aufbauen", "linkbuilding strategie", "gastbeiträge schreiben",
      "broken link building", "linkjuice", "domain authority erhöhen",
      "backlink analyse", "toxische backlinks", "linkprofil",
      "natürlicher linkaufbau", "outreach strategie",
    ],
  },
  {
    name: "E-Commerce SEO",
    keywords: [
      "online shop seo", "produktseiten optimieren", "kategorie seo",
      "shop suchmaschinenoptimierung", "produktbeschreibungen seo",
      "e-commerce conversion rate", "warenkorb optimierung",
      "shop navigation seo", "produktbilder optimieren",
      "kundenbewertungen seo", "checkout optimierung",
    ],
  },
  {
    name: "Social Media & SEO",
    keywords: [
      "social signals seo", "social media marketing", "instagram seo",
      "youtube seo", "linkedin strategie", "tiktok marketing",
      "social media für unternehmen", "social media reichweite",
      "social media content", "influencer marketing seo",
    ],
  },
];

const SEARCH_INTENTS = ["informational", "navigational", "commercial", "transactional"] as const;
const FUNNEL_LEVELS = ["top", "middle", "bottom"] as const;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockKeywords(seedKeywords: string) {
  // Pick 5-8 hubs
  const hubCount = randomInt(5, 8);
  const shuffled = [...GERMAN_HUBS].sort(() => Math.random() - 0.5);
  const selectedHubs = shuffled.slice(0, hubCount);

  // If seed keywords provided, use the first hub name from seeds
  const seeds = seedKeywords
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return selectedHubs.map((hub) => {
    // Pick 10-20 keywords per hub
    const keywordCount = Math.min(hub.keywords.length, randomInt(10, 20));
    const hubKeywords = hub.keywords.slice(0, keywordCount);

    // Mix in seed keywords to the first hub
    if (seeds.length > 0 && hub === selectedHubs[0]) {
      seeds.forEach((seed) => {
        if (!hubKeywords.includes(seed)) {
          hubKeywords.push(seed);
        }
      });
    }

    const keywords = hubKeywords.map((kw, i) => {
      const isMain = i % 3 === 0; // every 3rd keyword is a main variant
      const parentIndex = isMain ? null : Math.floor(i / 3) * 3;
      const isCovered = Math.random() < 0.3;

      return {
        keyword: kw,
        searchVolume: randomInt(100, 12000),
        cpc: randomFloat(0.5, 8.0),
        searchIntent: pickRandom(SEARCH_INTENTS),
        funnelLevel: pickRandom(FUNNEL_LEVELS),
        difficulty: randomFloat(10, 90),
        isCovered,
        coveredUrl: isCovered ? `https://example.com/${kw.replace(/\s+/g, "-")}` : null,
        isMainVariant: isMain,
        parentIndex: isMain ? null : parentIndex,
      };
    });

    const totalVolume = keywords.reduce((sum, k) => sum + k.searchVolume, 0);
    const coveredCount = keywords.filter((k) => k.isCovered).length;

    return {
      name: hub.name,
      totalVolume,
      keywordCount: keywords.length,
      coveredCount,
      coverageScore: keywords.length > 0 ? Math.round((coveredCount / keywords.length) * 100) : 0,
      keywords,
    };
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, customerId, seedKeywords } = parsed.data;

  // Create the keyword map
  const keywordMap = await prisma.keywordMap.create({
    data: {
      name,
      customerId,
      seedKeywords,
      status: "generating",
    },
  });

  // Generate mock hubs and keywords
  const mockHubs = generateMockKeywords(seedKeywords);

  let totalKeywords = 0;
  let totalCovered = 0;

  for (const hubData of mockHubs) {
    const hub = await prisma.keywordHub.create({
      data: {
        keywordMapId: keywordMap.id,
        name: hubData.name,
        totalVolume: hubData.totalVolume,
        keywordCount: hubData.keywordCount,
        coveredCount: hubData.coveredCount,
        coverageScore: hubData.coverageScore,
      },
    });

    // Create keyword entries - first pass for main variants to get IDs
    const mainKeywordIds: Record<number, string> = {};

    for (let i = 0; i < hubData.keywords.length; i++) {
      const kw = hubData.keywords[i];
      const entry = await prisma.keywordEntry.create({
        data: {
          hubId: hub.id,
          keyword: kw.keyword,
          searchVolume: kw.searchVolume,
          cpc: kw.cpc,
          searchIntent: kw.searchIntent,
          funnelLevel: kw.funnelLevel,
          difficulty: kw.difficulty,
          isCovered: kw.isCovered,
          coveredUrl: kw.coveredUrl,
          isMainVariant: kw.isMainVariant,
          parentKeywordId: kw.parentIndex !== null ? (mainKeywordIds[kw.parentIndex] ?? null) : null,
        },
      });

      if (kw.isMainVariant) {
        mainKeywordIds[i] = entry.id;
      }
    }

    totalKeywords += hubData.keywordCount;
    totalCovered += hubData.coveredCount;
  }

  // Update the map with totals
  const coverageScore = totalKeywords > 0 ? Math.round((totalCovered / totalKeywords) * 100) : 0;

  const updatedMap = await prisma.keywordMap.update({
    where: { id: keywordMap.id },
    data: {
      status: "ready",
      totalKeywords,
      coveredKeywords: totalCovered,
      coverageScore,
    },
    include: {
      customer: { select: { companyName: true } },
      _count: { select: { hubs: true } },
    },
  });

  return NextResponse.json(updatedMap, { status: 201 });
}
