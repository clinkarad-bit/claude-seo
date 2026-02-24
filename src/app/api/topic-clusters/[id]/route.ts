import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cluster = await prisma.topicCluster.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      topics: {
        include: {
          _count: { select: { keywords: true } },
          outline: { select: { id: true, status: true } },
        },
        orderBy: [{ category: "asc" }, { searchVolumeTotal: "desc" }],
      },
    },
  });

  if (!cluster) {
    return NextResponse.json(
      { error: "Themencluster nicht gefunden" },
      { status: 404 }
    );
  }

  return NextResponse.json(cluster);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const cluster = await prisma.topicCluster.update({
    where: { id: params.id },
    data: body,
  });
  return NextResponse.json(cluster);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.topicCluster.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
