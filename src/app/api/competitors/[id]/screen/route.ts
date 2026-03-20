import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Mock data generators for competitor screening

const MOCK_BACKLINK_SOURCES = [
  { domain: "handelsblatt.com", dr: 85 },
  { domain: "t3n.de", dr: 78 },
  { domain: "gruenderszene.de", dr: 72 },
  { domain: "finanztip.de", dr: 80 },
  { domain: "stern.de", dr: 88 },
  { domain: "focus.de", dr: 90 },
  { domain: "spiegel.de", dr: 92 },
  { domain: "chip.de", dr: 82 },
  { domain: "computerbild.de", dr: 79 },
  { domain: "heise.de", dr: 85 },
  { domain: "golem.de", dr: 76 },
  { domain: "welt.de", dr: 89 },
  { domain: "faz.net", dr: 91 },
  { domain: "sueddeutsche.de", dr: 90 },
  { domain: "zeit.de", dr: 93 },
  { domain: "tagesschau.de", dr: 88 },
  { domain: "netzwelt.de", dr: 68 },
  { domain: "giga.de", dr: 74 },
  { domain: "techbook.de", dr: 65 },
  { domain: "basicthinking.de", dr: 60 },
  { domain: "it-daily.net", dr: 55 },
  { domain: "etailment.de", dr: 52 },
  { domain: "e-commerce-magazin.de", dr: 48 },
  { domain: "onlinehaendler-news.de", dr: 45 },
  { domain: "internetworld.de", dr: 62 },
  { domain: "marketing-boerse.de", dr: 50 },
  { domain: "seo-suedwest.de", dr: 58 },
  { domain: "searchenginejournal.com", dr: 88 },
  { domain: "ahrefs.com/blog", dr: 90 },
  { domain: "moz.com/blog", dr: 91 },
];

const MOCK_ANCHOR_TEXTS = [
  "hier klicken",
  "mehr erfahren",
  "zum Vergleich",
  "Testbericht",
  "Erfahrungen",
  "Bewertung",
  "Ratgeber",
  "Anbieter im Vergleich",
  "beste Angebote",
  "Kosten und Preise",
  "Tarife vergleichen",
  "Tipps und Tricks",
  "Anleitung",
  "Empfehlung",
  "Alternative",
];

const MOCK_PAGE_TITLES = [
  "Die besten Anbieter im Vergleich 2026",
  "Ratgeber: So sparen Sie richtig",
  "Erfahrungen und Testbericht",
  "Kosten und Preise im Überblick",
  "Tipps für Einsteiger",
  "Was Sie wissen sollten",
  "Der ultimative Leitfaden",
  "Häufige Fehler vermeiden",
  "Schritt-für-Schritt Anleitung",
  "Vor- und Nachteile im Detail",
  "Aktuelle Tarife und Konditionen",
  "Kundenbewertungen und Meinungen",
  "Neuigkeiten und Updates",
  "Alles Wichtige auf einen Blick",
  "Expertenmeinungen und Analysen",
];

const MOCK_KEYWORDS = [
  "versicherung vergleich",
  "kredit rechner",
  "strom anbieter wechseln",
  "konto eröffnen online",
  "geld anlegen tipps",
  "depot vergleich",
  "baufinanzierung rechner",
  "kfz versicherung wechseln",
  "girokonto kostenlos",
  "etf sparplan vergleich",
];

const MONTH_SUMMARIES = [
  "Der Wettbewerber hat diesen Monat verstärkt auf Content-Marketing gesetzt und mehrere neue Ratgeber-Artikel veröffentlicht. Besonders auffällig ist der Fokus auf Vergleichsseiten und interaktive Rechner-Tools.",
  "Starke Backlink-Kampagne mit Gastbeiträgen in verschiedenen Fachmedien. Die organische Sichtbarkeit ist um ca. 12% gestiegen. Neue Landing-Pages für saisonale Keywords wurden erstellt.",
  "Technisches SEO-Update durchgeführt: Core Web Vitals verbessert, strukturierte Daten erweitert. Mehrere bestehende Artikel wurden aktualisiert und um FAQ-Sektionen ergänzt.",
  "Neuer Blog-Bereich mit wöchentlichen Beiträgen gestartet. Video-Content wird zunehmend in Artikel eingebettet. Deutlicher Traffic-Anstieg bei informationalen Keywords.",
  "Relaunch der Hauptkategorieseiten mit verbessertem UX-Design. A/B-Tests bei Call-to-Action Elementen. Neue Infografiken für Linkbuilding erstellt.",
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

function randomFloat(min: number, max: number, decimals = 1): number {
  const val = min + Math.random() * (max - min);
  return parseFloat(val.toFixed(decimals));
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const competitor = await prisma.competitor.findUnique({
    where: { id },
  });

  if (!competitor) {
    return NextResponse.json(
      { error: "Wettbewerber nicht gefunden" },
      { status: 404 }
    );
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Generate new content pages (for monthly update)
  const newContentCount = randomInt(3, 8);
  const newContent = Array.from({ length: newContentCount }, (_, i) => {
    const title = MOCK_PAGE_TITLES[i % MOCK_PAGE_TITLES.length];
    const slug = title
      .toLowerCase()
      .replace(/[äöüß]/g, (m) =>
        ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[m] || m
      )
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return {
      url: `https://${competitor.domain}/${slug}`,
      title,
      estimatedTraffic: randomInt(100, 5000),
      publishedDate: new Date(
        now.getTime() - randomInt(1, 28) * 24 * 60 * 60 * 1000
      ).toISOString(),
    };
  });

  // 1. Create CompetitorUpdate
  const update = await prisma.competitorUpdate.create({
    data: {
      competitorId: id,
      month: currentMonth,
      summary:
        MONTH_SUMMARIES[Math.floor(Math.random() * MONTH_SUMMARIES.length)],
      newContent: JSON.stringify(newContent),
      backlinksGained: randomInt(5, 30),
      backlinksLost: randomInt(1, 10),
      trafficChange: randomFloat(-15, 25),
    },
  });

  // 2. Generate mock backlinks (20-30)
  const backlinkCount = randomInt(20, 31);
  const selectedSources = pickRandom(MOCK_BACKLINK_SOURCES, backlinkCount);
  const backlinks = await Promise.all(
    selectedSources.map(async (source, i) => {
      const isNew = i < Math.floor(backlinkCount * 0.6);
      const isLost = !isNew && i < Math.floor(backlinkCount * 0.8);
      const anchor =
        MOCK_ANCHOR_TEXTS[Math.floor(Math.random() * MOCK_ANCHOR_TEXTS.length)];
      const linkType = Math.random() > 0.2 ? "dofollow" : "nofollow";

      return prisma.competitorBacklink.create({
        data: {
          competitorId: id,
          sourceUrl: `https://${source.domain}/artikel/${randomInt(1000, 9999)}`,
          sourceDomain: source.domain,
          anchorText: anchor,
          linkType,
          domainRating: source.dr + randomFloat(-5, 5),
          isNew,
          isLost,
          firstSeen: new Date(
            now.getTime() - randomInt(1, 180) * 24 * 60 * 60 * 1000
          ),
          lastSeen: isLost
            ? new Date(
                now.getTime() - randomInt(1, 30) * 24 * 60 * 60 * 1000
              )
            : now,
        },
      });
    })
  );

  // 3. Generate mock top pages (10-15)
  const topPageCount = randomInt(10, 16);
  const topPages = await Promise.all(
    Array.from({ length: topPageCount }, (_, i) => {
      const title =
        MOCK_PAGE_TITLES[i % MOCK_PAGE_TITLES.length] +
        ` - ${competitor.domain}`;
      const slug = title
        .split(" - ")[0]
        .toLowerCase()
        .replace(/[äöüß]/g, (m) =>
          ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[m] || m
        )
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const keywords = pickRandom(MOCK_KEYWORDS, randomInt(2, 5));

      return prisma.competitorTopPage.create({
        data: {
          competitorId: id,
          url: `https://${competitor.domain}/${slug}`,
          title,
          estimatedTraffic: randomInt(500, 50000),
          keywords: JSON.stringify(keywords),
          backlinks: randomInt(5, 200),
        },
      });
    })
  );

  // 4. Generate mock broken links (3-5)
  const brokenLinkCount = randomInt(3, 6);
  const brokenLinks = await Promise.all(
    Array.from({ length: brokenLinkCount }, () => {
      const brokenSlug = `${["ratgeber", "vergleich", "test", "tipps", "angebot"][randomInt(0, 5)]}-${randomInt(100, 999)}`;
      return prisma.competitorBrokenLink.create({
        data: {
          competitorId: id,
          brokenUrl: `https://${competitor.domain}/${brokenSlug}`,
          sourceUrl: `https://${MOCK_BACKLINK_SOURCES[randomInt(0, MOCK_BACKLINK_SOURCES.length)].domain}/artikel/${randomInt(1000, 9999)}`,
          anchorText:
            MOCK_ANCHOR_TEXTS[
              Math.floor(Math.random() * MOCK_ANCHOR_TEXTS.length)
            ],
          topicRelevant: Math.random() > 0.3,
          httpStatus: [404, 410, 301, 503][randomInt(0, 4)],
        },
      });
    })
  );

  // 5. Update competitor metrics
  await prisma.competitor.update({
    where: { id },
    data: {
      lastScreenedAt: now,
      domainRating: randomFloat(30, 90),
      totalBacklinks: (competitor.totalBacklinks || 0) + randomInt(10, 50),
      organicTraffic:
        (competitor.organicTraffic || 0) + randomInt(-5000, 15000),
    },
  });

  return NextResponse.json({
    update,
    backlinksCreated: backlinks.length,
    topPagesCreated: topPages.length,
    brokenLinksFound: brokenLinks.length,
  });
}
