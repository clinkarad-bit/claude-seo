import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  customerId: z.string().min(1),
  domain: z.string().min(1),
  isManuallyAdded: z.boolean().optional().default(true),
  isAISuggested: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  if (!customerId) {
    return NextResponse.json(
      { error: "customerId query parameter is required" },
      { status: 400 }
    );
  }

  const competitors = await prisma.competitor.findMany({
    where: { customerId, isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          updates: true,
          backlinks: true,
          topPages: true,
          brokenLinks: true,
        },
      },
    },
  });

  return NextResponse.json(competitors);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check for duplicate domain for this customer
  const existing = await prisma.competitor.findFirst({
    where: {
      customerId: parsed.data.customerId,
      domain: parsed.data.domain,
      isActive: true,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Dieser Wettbewerber existiert bereits für diesen Kunden." },
      { status: 409 }
    );
  }

  const competitor = await prisma.competitor.create({
    data: {
      customerId: parsed.data.customerId,
      domain: parsed.data.domain,
      isManuallyAdded: parsed.data.isManuallyAdded,
      isAISuggested: parsed.data.isAISuggested,
      // Generate initial mock metrics
      domainRating: Math.round((30 + Math.random() * 60) * 10) / 10,
      totalBacklinks: Math.floor(1000 + Math.random() * 50000),
      organicTraffic: Math.floor(5000 + Math.random() * 200000),
    },
  });

  return NextResponse.json(competitor, { status: 201 });
}
