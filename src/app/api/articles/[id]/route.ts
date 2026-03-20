import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      customer: { select: { companyName: true, domain: true } },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Artikel nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    return NextResponse.json({ error: "Artikel nicht gefunden" }, { status: 404 });
  }

  // Build update data from allowed fields
  const allowedFields = [
    "title",
    "metaDescription",
    "permalink",
    "status",
    "outlineContent",
    "outlineFeedback",
    "content",
    "contentFeedback",
    "comments",
    "wordCount",
    "publishedUrl",
    "publishedAt",
  ] as const;

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const updated = await prisma.article.update({
    where: { id },
    data: updateData,
    include: {
      customer: { select: { companyName: true, domain: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    return NextResponse.json({ error: "Artikel nicht gefunden" }, { status: 404 });
  }

  await prisma.article.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
