import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const tracking = await prisma.performanceTracking.findMany({
    where: { contentPieceId: params.id },
    include: { keyword: true },
    orderBy: { measuredAt: "desc" },
  });

  const history = await prisma.performanceHistory.findMany({
    where: { contentPieceId: params.id },
    orderBy: { measuredAt: "desc" },
  });

  return NextResponse.json({ tracking, history });
}
