import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const competitor = await prisma.competitor.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, companyName: true, domain: true },
      },
      updates: {
        orderBy: { createdAt: "desc" },
      },
      backlinks: {
        orderBy: { createdAt: "desc" },
      },
      topPages: {
        orderBy: { estimatedTraffic: "desc" },
      },
      brokenLinks: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!competitor) {
    return NextResponse.json(
      { error: "Wettbewerber nicht gefunden" },
      { status: 404 }
    );
  }

  // Fetch content gaps for this competitor's domain
  const contentGaps = await prisma.contentGap.findMany({
    where: {
      customerId: competitor.customerId,
      competitorDomain: competitor.domain,
    },
    orderBy: { searchVolume: "desc" },
  });

  return NextResponse.json({ ...competitor, contentGaps });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const competitor = await prisma.competitor.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(competitor);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Soft delete
  const competitor = await prisma.competitor.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json(competitor);
}
