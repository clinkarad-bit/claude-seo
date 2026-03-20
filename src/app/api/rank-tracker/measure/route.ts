import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const measureSchema = z.object({
  customerId: z.string().min(1),
});

// Mock keyword data for realistic ranking simulation
const MOCK_KEYWORDS = [
  { keyword: "SEO Agentur Berlin", url: "/seo-agentur-berlin" },
  { keyword: "Content Marketing Strategie", url: "/content-marketing-strategie" },
  { keyword: "Keyword Recherche Tool", url: "/keyword-recherche" },
  { keyword: "Backlink Aufbau", url: "/backlink-aufbau" },
  { keyword: "On-Page SEO Optimierung", url: "/on-page-seo" },
  { keyword: "Technisches SEO", url: "/technisches-seo" },
  { keyword: "Local SEO Tipps", url: "/local-seo-tipps" },
  { keyword: "SEO Texte schreiben", url: "/seo-texte-schreiben" },
  { keyword: "Google Ranking verbessern", url: "/google-ranking-verbessern" },
  { keyword: "Meta Description optimieren", url: "/meta-description-optimieren" },
  { keyword: "Interne Verlinkung SEO", url: "/interne-verlinkung" },
  { keyword: "Core Web Vitals", url: "/core-web-vitals" },
  { keyword: "SEO Audit durchführen", url: "/seo-audit" },
  { keyword: "Content Gap Analyse", url: "/content-gap-analyse" },
  { keyword: "SERP Analyse", url: "/serp-analyse" },
  { keyword: "Schema Markup einrichten", url: "/schema-markup" },
  { keyword: "SEO KPIs messen", url: "/seo-kpis" },
  { keyword: "E-E-A-T Google", url: "/eeat-google" },
  { keyword: "Linkbuilding Strategien", url: "/linkbuilding-strategien" },
  { keyword: "SEO für Online Shops", url: "/seo-online-shops" },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = measureSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { customerId } = parsed.data;

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    return NextResponse.json(
      { error: "Customer not found" },
      { status: 404 }
    );
  }

  // Get existing trackers for this customer
  let trackers = await prisma.rankTracker.findMany({
    where: { customerId },
  });

  // If no trackers exist, seed with mock keywords
  if (trackers.length === 0) {
    const keywordsToTrack = MOCK_KEYWORDS.slice(
      0,
      randomInt(15, MOCK_KEYWORDS.length)
    );

    const domain = customer.domain || "example.com";

    trackers = await Promise.all(
      keywordsToTrack.map((kw) => {
        const position = randomInt(1, 80);
        return prisma.rankTracker.create({
          data: {
            customerId,
            keyword: kw.keyword,
            url: `https://${domain}${kw.url}`,
            currentPosition: position,
            previousPosition: null,
            bestPosition: position,
            worstPosition: position,
            trend: "new",
            trendDays: 0,
          },
        });
      })
    );
  }

  // Simulate new measurements
  const updatedTrackers = await Promise.all(
    trackers.map(async (tracker) => {
      const prevPosition = tracker.currentPosition;

      // Simulate position change: -15 to +10 (negative = improved ranking)
      const changeRange = randomInt(-15, 10);
      let newPosition = (prevPosition ?? randomInt(5, 60)) + changeRange;
      newPosition = Math.max(1, Math.min(100, newPosition));

      // Determine trend
      let trend: string;
      if (prevPosition == null) {
        trend = "new";
      } else if (newPosition < prevPosition) {
        trend = "up";
      } else if (newPosition > prevPosition) {
        trend = "down";
      } else {
        trend = "stable";
      }

      // Calculate trendDays
      let trendDays = tracker.trendDays ?? 0;
      if (trend === tracker.trend) {
        trendDays += 1;
      } else {
        trendDays = 1;
      }

      // Calculate best/worst
      const bestPosition = Math.min(
        newPosition,
        tracker.bestPosition ?? newPosition
      );
      const worstPosition = Math.max(
        newPosition,
        tracker.worstPosition ?? newPosition
      );

      // Generate mock clicks/impressions based on position
      const impressions = Math.max(
        0,
        randomInt(50, 2000) - newPosition * 15
      );
      const clicks =
        newPosition <= 3
          ? randomInt(
              Math.floor(impressions * 0.15),
              Math.floor(impressions * 0.35)
            )
          : newPosition <= 10
            ? randomInt(
                Math.floor(impressions * 0.03),
                Math.floor(impressions * 0.12)
              )
            : randomInt(0, Math.floor(impressions * 0.02));
      const ctr =
        impressions > 0
          ? randomFloat(0, Math.min((clicks / impressions) * 100, 100))
          : 0;

      // Update the tracker
      const updated = await prisma.rankTracker.update({
        where: { id: tracker.id },
        data: {
          previousPosition: prevPosition,
          currentPosition: newPosition,
          bestPosition,
          worstPosition,
          trend,
          trendDays,
        },
      });

      // Create history entry
      await prisma.rankHistory.create({
        data: {
          rankTrackerId: tracker.id,
          position: newPosition,
          clicks,
          impressions,
          ctr,
        },
      });

      return updated;
    })
  );

  return NextResponse.json({
    message: `${updatedTrackers.length} Keywords gemessen`,
    measured: updatedTrackers.length,
  });
}
