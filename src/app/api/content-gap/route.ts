import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const postSchema = z.object({
  customerId: z.string().min(1),
  competitorDomains: z.array(z.string().min(1)).min(1),
});

// GET /api/content-gap?customerId=xxx
export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json(
      { error: "customerId query parameter is required" },
      { status: 400 }
    );
  }

  const gaps = await prisma.contentGap.findMany({
    where: { customerId },
    orderBy: [{ opportunity: "asc" }, { searchVolume: "desc" }],
  });

  const competitors = await prisma.competitor.findMany({
    where: { customerId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ gaps, competitors });
}

// POST /api/content-gap — trigger analysis (mock)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { customerId, competitorDomains } = parsed.data;

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Ensure competitors exist in DB
  for (const domain of competitorDomains) {
    const existing = await prisma.competitor.findFirst({
      where: { customerId, domain },
    });
    if (!existing) {
      await prisma.competitor.create({
        data: {
          customerId,
          domain,
          isManuallyAdded: true,
          isActive: true,
        },
      });
    }
  }

  // Delete old open gaps for this customer (keep planned/created)
  await prisma.contentGap.deleteMany({
    where: { customerId, status: "open" },
  });

  // Generate mock gap data
  const mockGaps = generateMockGaps(competitorDomains);

  // Insert gaps into DB
  const created = await prisma.contentGap.createMany({
    data: mockGaps.map((gap) => ({
      customerId,
      keyword: gap.keyword,
      searchVolume: gap.searchVolume,
      difficulty: gap.difficulty,
      competitorUrl: gap.competitorUrl,
      competitorDomain: gap.competitorDomain,
      opportunity: gap.opportunity,
      status: "open",
      lastChecked: new Date(),
    })),
  });

  // Update lastScreenedAt on competitors
  for (const domain of competitorDomains) {
    await prisma.competitor.updateMany({
      where: { customerId, domain },
      data: { lastScreenedAt: new Date() },
    });
  }

  const gaps = await prisma.contentGap.findMany({
    where: { customerId },
    orderBy: [{ opportunity: "asc" }, { searchVolume: "desc" }],
  });

  return NextResponse.json(
    { gaps, created: created.count },
    { status: 201 }
  );
}

interface MockGap {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  competitorUrl: string;
  competitorDomain: string;
  opportunity: string;
}

function generateMockGaps(competitorDomains: string[]): MockGap[] {
  const gapTemplates: Omit<MockGap, "competitorUrl" | "competitorDomain">[] = [
    { keyword: "private krankenversicherung vergleich", searchVolume: 8100, difficulty: 72, opportunity: "high" },
    { keyword: "bkv arbeitgeber vorteile", searchVolume: 1900, difficulty: 35, opportunity: "high" },
    { keyword: "betriebliche krankenversicherung kosten", searchVolume: 3600, difficulty: 48, opportunity: "high" },
    { keyword: "zahnzusatzversicherung testsieger", searchVolume: 6600, difficulty: 65, opportunity: "high" },
    { keyword: "berufsunfähigkeitsversicherung vergleich", searchVolume: 12100, difficulty: 78, opportunity: "high" },
    { keyword: "krankentagegeldversicherung sinnvoll", searchVolume: 1300, difficulty: 32, opportunity: "high" },
    { keyword: "pflegezusatzversicherung test", searchVolume: 2400, difficulty: 45, opportunity: "medium" },
    { keyword: "hausratversicherung was ist versichert", searchVolume: 4400, difficulty: 52, opportunity: "medium" },
    { keyword: "rechtsschutzversicherung ohne wartezeit", searchVolume: 2900, difficulty: 55, opportunity: "medium" },
    { keyword: "haftpflichtversicherung vergleich stiftung warentest", searchVolume: 3200, difficulty: 68, opportunity: "medium" },
    { keyword: "risikolebensversicherung steuerlich absetzbar", searchVolume: 1600, difficulty: 40, opportunity: "medium" },
    { keyword: "krankenzusatzversicherung familie", searchVolume: 1100, difficulty: 38, opportunity: "medium" },
    { keyword: "unfallversicherung kinder vergleich", searchVolume: 2200, difficulty: 50, opportunity: "medium" },
    { keyword: "betriebliche altersvorsorge nachteile", searchVolume: 5400, difficulty: 42, opportunity: "medium" },
    { keyword: "tierkrankenversicherung hund erfahrungen", searchVolume: 1800, difficulty: 30, opportunity: "medium" },
    { keyword: "wohngebäudeversicherung pflicht", searchVolume: 880, difficulty: 28, opportunity: "low" },
    { keyword: "kfz versicherung fahranfänger tipps", searchVolume: 720, difficulty: 58, opportunity: "low" },
    { keyword: "reiseversicherung vergleich adac", searchVolume: 590, difficulty: 62, opportunity: "low" },
    { keyword: "glasversicherung sinnvoll mietwohnung", searchVolume: 480, difficulty: 22, opportunity: "low" },
    { keyword: "elementarschadenversicherung kosten", searchVolume: 650, difficulty: 35, opportunity: "low" },
    { keyword: "dienstunfähigkeitsversicherung beamte", searchVolume: 1400, difficulty: 55, opportunity: "high" },
    { keyword: "heilpraktikerversicherung vergleich", searchVolume: 2100, difficulty: 42, opportunity: "medium" },
    { keyword: "cyber versicherung unternehmen", searchVolume: 1700, difficulty: 38, opportunity: "high" },
    { keyword: "sterbegeldversicherung vergleich", searchVolume: 3100, difficulty: 50, opportunity: "medium" },
    { keyword: "gebäudeversicherung vergleich online", searchVolume: 920, difficulty: 60, opportunity: "low" },
  ];

  return gapTemplates.map((template) => {
    const domain =
      competitorDomains[
        Math.floor(Math.random() * competitorDomains.length)
      ];
    const slug = template.keyword.replace(/\s+/g, "-").replace(/[äöüß]/g, (c) => {
      const map: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
      return map[c] || c;
    });
    return {
      ...template,
      competitorDomain: domain,
      competitorUrl: `https://${domain}/ratgeber/${slug}/`,
    };
  });
}
