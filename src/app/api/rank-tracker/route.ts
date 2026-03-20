import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const period = searchParams.get("period") || "week";

  if (!customerId) {
    return NextResponse.json(
      { error: "customerId is required" },
      { status: 400 }
    );
  }

  // Determine date range based on period
  const now = new Date();
  let sinceDate: Date;
  switch (period) {
    case "day":
      sinceDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "week":
      sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "year":
      sinceDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const trackers = await prisma.rankTracker.findMany({
    where: { customerId },
    include: {
      history: {
        where: { measuredAt: { gte: sinceDate } },
        orderBy: { measuredAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Compute winners and losers
  const keywords = trackers.map((t) => {
    const current = t.currentPosition;
    const previous = t.previousPosition;
    let change: number | null = null;
    if (current != null && previous != null) {
      change = previous - current; // positive = improved (went from higher number to lower)
    }

    // Latest history entry for clicks/impressions
    const latest = t.history[0];

    return {
      id: t.id,
      keyword: t.keyword,
      url: t.url,
      currentPosition: current,
      previousPosition: previous,
      bestPosition: t.bestPosition,
      worstPosition: t.worstPosition,
      trend: t.trend,
      trendDays: t.trendDays,
      change,
      clicks: latest?.clicks ?? 0,
      impressions: latest?.impressions ?? 0,
      ctr: latest?.ctr ?? 0,
      articleId: t.articleId,
      history: t.history.map((h) => ({
        position: h.position,
        clicks: h.clicks,
        impressions: h.impressions,
        ctr: h.ctr,
        measuredAt: h.measuredAt,
      })),
    };
  });

  const winners = keywords
    .filter((k) => k.change != null && k.change > 0)
    .sort((a, b) => (b.change ?? 0) - (a.change ?? 0))
    .slice(0, 10);

  const losers = keywords
    .filter((k) => k.change != null && k.change < 0)
    .sort((a, b) => (a.change ?? 0) - (b.change ?? 0))
    .slice(0, 10);

  return NextResponse.json({
    keywords,
    winners,
    losers,
    totalTracked: keywords.length,
    period,
  });
}
