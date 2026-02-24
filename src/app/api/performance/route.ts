import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGSCData, calculatePerformanceScore } from "@/lib/seo";

export async function GET() {
  const pieces = await prisma.contentPiece.findMany({
    where: { status: "published" },
    include: {
      outline: {
        include: {
          topic: {
            include: {
              keywords: { where: { relevant: true } },
              topicCluster: { include: { customer: true } },
            },
          },
        },
      },
      performanceHistory: {
        orderBy: { measuredAt: "desc" },
        take: 5,
      },
      performanceTracking: {
        include: { keyword: true },
        orderBy: { measuredAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Attach latest performance score to each piece
  const withScores = pieces.map((piece) => {
    const latestScore = piece.performanceHistory[0]?.performanceScore ?? null;
    return { ...piece, latestPerformanceScore: latestScore };
  });

  return NextResponse.json(withScores);
}

export async function POST(req: NextRequest) {
  const { contentPieceId } = await req.json();

  const piece = await prisma.contentPiece.findUnique({
    where: { id: contentPieceId },
    include: {
      outline: {
        include: {
          topic: {
            include: {
              keywords: { where: { relevant: true } },
              topicCluster: true,
            },
          },
        },
      },
    },
  });

  if (!piece) {
    return NextResponse.json(
      { error: "Content Piece nicht gefunden" },
      { status: 404 }
    );
  }

  const keywords = piece.outline.topic.keywords;
  const url = piece.urlLive ?? `https://example.com/${piece.urlSlug}`;

  // Fetch GSC data (mock)
  const gscData = await getGSCData(
    keywords.map((k) => k.keyword),
    url
  );

  // Store tracking data
  const trackingRecords = await Promise.all(
    gscData.map(async (data) => {
      const keyword = keywords.find((k) => k.keyword === data.keyword);
      if (!keyword) return null;

      return prisma.performanceTracking.create({
        data: {
          contentPieceId: piece.id,
          keywordId: keyword.id,
          position: data.position,
          clicks: data.clicks,
          impressions: data.impressions,
          ctr: data.ctr,
        },
      });
    })
  );

  // Calculate and store performance score
  const score = calculatePerformanceScore(
    gscData.map((d) => ({ position: d.position }))
  );

  await prisma.performanceHistory.create({
    data: {
      contentPieceId: piece.id,
      performanceScore: score,
    },
  });

  return NextResponse.json({
    score,
    trackingCount: trackingRecords.filter(Boolean).length,
    data: gscData,
  });
}
