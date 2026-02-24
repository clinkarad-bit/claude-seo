import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const topic = await prisma.topic.findUnique({
    where: { id: params.id },
    include: {
      keywords: { orderBy: { searchVolume: "desc" } },
      topicCluster: { include: { customer: true } },
      outline: true,
    },
  });

  if (!topic) {
    return NextResponse.json({ error: "Thema nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(topic);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const topic = await prisma.topic.update({
    where: { id: params.id },
    data: body,
  });
  return NextResponse.json(topic);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.topic.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
