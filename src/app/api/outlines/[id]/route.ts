import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { refineWithFeedback } from "@/lib/ai";
import { parseJSON } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const outline = await prisma.outline.findUnique({
    where: { id: params.id },
    include: {
      topic: {
        include: {
          keywords: { orderBy: { searchVolume: "desc" } },
          topicCluster: { include: { customer: true } },
        },
      },
      contentPiece: { select: { id: true, status: true } },
    },
  });

  if (!outline) {
    return NextResponse.json({ error: "Outline nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({
    ...outline,
    secondaryKeywords: parseJSON(outline.secondaryKeywords, []),
    internalLinks: parseJSON(outline.internalLinks, []),
    externalLinks: parseJSON(outline.externalLinks, []),
    tfidfData: parseJSON(outline.tfidfData, null),
    content: parseJSON(outline.content, {}),
    feedbackHistory: parseJSON(outline.feedbackHistory, null),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  if (body.feedback) {
    // Handle feedback refinement
    const outline = await prisma.outline.findUnique({ where: { id: params.id } });
    if (!outline) {
      return NextResponse.json({ error: "Outline nicht gefunden" }, { status: 404 });
    }

    const history = parseJSON<Array<{ feedback: string; timestamp: number }>>(
      outline.feedbackHistory,
      []
    );

    const refined = await refineWithFeedback({
      entityType: "outline",
      currentContent: outline.content,
      feedback: body.feedback,
      history,
    });

    const updated = await prisma.outline.update({
      where: { id: params.id },
      data: {
        content: refined,
        status: "revised",
        feedbackHistory: JSON.stringify([
          ...history,
          { feedback: body.feedback, timestamp: Date.now() },
        ]),
      },
    });

    return NextResponse.json({
      ...updated,
      content: parseJSON(updated.content, {}),
    });
  }

  // Regular update
  const updated = await prisma.outline.update({
    where: { id: params.id },
    data: {
      ...body,
      content: body.content ? JSON.stringify(body.content) : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.outline.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
