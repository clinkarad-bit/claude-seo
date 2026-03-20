import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      topicClusters: {
        include: { _count: { select: { topics: true } } },
        orderBy: { createdAt: "desc" },
      },
      urls: { orderBy: { createdAt: "desc" } },
      keywordMaps: {
        select: { id: true, name: true, coverageScore: true, totalKeywords: true, coveredKeywords: true },
        orderBy: { createdAt: "desc" },
      },
      articles: {
        select: { id: true, keyword: true, title: true, status: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      },
      contentGaps: {
        select: { id: true, keyword: true, searchVolume: true, opportunity: true, status: true },
        where: { status: "open" },
        orderBy: { searchVolume: "desc" },
        take: 5,
      },
      rankTrackers: {
        select: { id: true, keyword: true, currentPosition: true, previousPosition: true, trend: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          articles: true,
          keywordMaps: true,
          contentGaps: true,
          rankTrackers: true,
          competitors: true,
        },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Kunde nicht gefunden" }, { status: 404 });
  }

  // Calculate average coverage score from keyword maps
  const avgCoverage = customer.keywordMaps.length > 0
    ? customer.keywordMaps.reduce((sum, km) => sum + km.coverageScore, 0) / customer.keywordMaps.length
    : 0;

  return NextResponse.json({
    ...customer,
    metrics: {
      organicTraffic: customer.organicTraffic ?? 0,
      domainRating: customer.domainRating ?? 0,
      domainAuthority: customer.domainAuthority ?? 0,
      totalBacklinks: customer.totalBacklinks ?? 0,
      referringDomains: customer.referringDomains ?? 0,
      indexedPages: customer.indexedPages ?? 0,
      coverageScore: Math.round(avgCoverage * 10) / 10,
      metricsUpdatedAt: customer.metricsUpdatedAt,
    },
    cms: {
      wordpress: {
        connected: customer.wpConnected,
        siteUrl: customer.wpSiteUrl,
      },
      webflow: {
        connected: customer.webflowConnected,
        siteId: customer.webflowSiteId,
      },
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: body,
  });
  return NextResponse.json(customer);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.customer.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
