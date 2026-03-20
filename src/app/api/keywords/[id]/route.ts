import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["generating", "ready", "error"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const keywordMap = await prisma.keywordMap.findUnique({
    where: { id },
    include: {
      customer: { select: { companyName: true, domain: true } },
      hubs: {
        orderBy: { totalVolume: "desc" },
        include: {
          keywords: {
            orderBy: [{ isMainVariant: "desc" }, { searchVolume: "desc" }],
          },
        },
      },
    },
  });

  if (!keywordMap) {
    return NextResponse.json({ error: "Keyword-Map nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(keywordMap);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.keywordMap.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Keyword-Map nicht gefunden" }, { status: 404 });
  }

  const updated = await prisma.keywordMap.update({
    where: { id },
    data: parsed.data,
    include: {
      customer: { select: { companyName: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.keywordMap.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Keyword-Map nicht gefunden" }, { status: 404 });
  }

  await prisma.keywordMap.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
