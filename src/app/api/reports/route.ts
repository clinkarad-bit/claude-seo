import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const generateSchema = z.object({
  customerId: z.string().min(1),
  type: z.enum(["weekly_rank", "monthly_competitor", "content_gap"]),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {};
  if (customerId) where.customerId = customerId;
  if (type && type !== "all") where.type = type;

  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { companyName: true } },
    },
  });

  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { customerId, type } = parsed.data;

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { companyName: true, domain: true },
  });
  if (!customer) {
    return NextResponse.json({ error: "Kunde nicht gefunden" }, { status: 404 });
  }

  // Generate mock report data based on type
  const now = new Date();
  let title: string;
  let data: Record<string, unknown>;

  switch (type) {
    case "weekly_rank":
      title = `Ranking-Report KW ${getCalendarWeek(now)} - ${customer.companyName}`;
      data = {
        period: `KW ${getCalendarWeek(now)}, ${now.getFullYear()}`,
        domain: customer.domain || "example.com",
        summary: {
          totalKeywords: 48,
          improved: 12,
          declined: 5,
          unchanged: 31,
          avgPosition: 14.3,
          avgPositionChange: -1.2,
        },
        topMovers: [
          { keyword: "SEO Agentur Berlin", position: 3, change: +5, volume: 2400 },
          { keyword: "Content Marketing Strategie", position: 7, change: +3, volume: 1800 },
          { keyword: "Keyword Recherche Tool", position: 12, change: +4, volume: 3200 },
        ],
        topDecliners: [
          { keyword: "Online Marketing Beratung", position: 18, change: -3, volume: 1200 },
          { keyword: "SEO Analyse", position: 22, change: -2, volume: 900 },
        ],
        newRankings: [
          { keyword: "lokale SEO Optimierung", position: 15, volume: 880 },
        ],
        top10Count: 8,
        top10Change: +2,
        top30Count: 24,
        top30Change: +1,
      };
      break;

    case "monthly_competitor":
      title = `Wettbewerber-Report ${getMonthName(now)} ${now.getFullYear()} - ${customer.companyName}`;
      data = {
        period: `${getMonthName(now)} ${now.getFullYear()}`,
        domain: customer.domain || "example.com",
        competitors: [
          {
            domain: "competitor-a.de",
            trafficChange: +12.5,
            newContent: 8,
            newBacklinks: 24,
            domainRating: 52,
            drChange: +1,
          },
          {
            domain: "competitor-b.de",
            trafficChange: -3.2,
            newContent: 3,
            newBacklinks: 11,
            domainRating: 45,
            drChange: 0,
          },
          {
            domain: "competitor-c.de",
            trafficChange: +8.1,
            newContent: 12,
            newBacklinks: 35,
            domainRating: 61,
            drChange: +2,
          },
        ],
        summary: {
          totalCompetitors: 3,
          avgTrafficChange: +5.8,
          strongestGrowth: "competitor-c.de",
          newContentTotal: 23,
        },
        opportunities: [
          "competitor-a.de hat neuen Content zu 'Technical SEO' veroeffentlicht - Thema pruefen",
          "competitor-c.de hat 12 neue Backlinks von hochrangigen Domains erhalten",
          "competitor-b.de verliert Traffic - moegliche Content-Gaps identifizieren",
        ],
      };
      break;

    case "content_gap":
      title = `Content-Gap-Report ${getMonthName(now)} ${now.getFullYear()} - ${customer.companyName}`;
      data = {
        period: `${getMonthName(now)} ${now.getFullYear()}`,
        domain: customer.domain || "example.com",
        summary: {
          totalGaps: 34,
          highOpportunity: 8,
          mediumOpportunity: 14,
          lowOpportunity: 12,
          estimatedTrafficPotential: 15600,
        },
        topGaps: [
          { keyword: "SEO fuer kleine Unternehmen", volume: 2200, difficulty: 35, competitor: "competitor-a.de", opportunity: "high" },
          { keyword: "Content Strategie entwickeln", volume: 1800, difficulty: 42, competitor: "competitor-c.de", opportunity: "high" },
          { keyword: "Backlink Aufbau Tipps", volume: 1500, difficulty: 28, competitor: "competitor-b.de", opportunity: "high" },
          { keyword: "Meta Tags optimieren", volume: 1200, difficulty: 22, competitor: "competitor-a.de", opportunity: "medium" },
          { keyword: "Google Search Console einrichten", volume: 3400, difficulty: 55, competitor: "competitor-c.de", opportunity: "medium" },
        ],
        coveredKeywords: 48,
        uncoveredKeywords: 34,
        coveragePercent: 58.5,
      };
      break;
  }

  const report = await prisma.report.create({
    data: {
      customerId,
      type,
      title,
      data: JSON.stringify(data),
      emailSent: false,
    },
    include: {
      customer: { select: { companyName: true } },
    },
  });

  return NextResponse.json(report, { status: 201 });
}

function getCalendarWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getMonthName(date: Date): string {
  const months = [
    "Januar", "Februar", "Maerz", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];
  return months[date.getMonth()];
}
