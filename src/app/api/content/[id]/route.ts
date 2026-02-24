import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { refineWithFeedback } from "@/lib/ai";
import { parseJSON } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const piece = await prisma.contentPiece.findUnique({
    where: { id: params.id },
    include: {
      outline: {
        include: {
          topic: {
            include: {
              keywords: true,
              topicCluster: { include: { customer: true } },
            },
          },
        },
      },
      performanceTracking: {
        include: { keyword: true },
        orderBy: { measuredAt: "desc" },
      },
      performanceHistory: { orderBy: { measuredAt: "desc" } },
    },
  });

  if (!piece) {
    return NextResponse.json(
      { error: "Content Piece nicht gefunden" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ...piece,
    feedbackHistory: parseJSON(piece.feedbackHistory, null),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  if (body.feedback) {
    const piece = await prisma.contentPiece.findUnique({
      where: { id: params.id },
    });
    if (!piece) {
      return NextResponse.json(
        { error: "Content Piece nicht gefunden" },
        { status: 404 }
      );
    }

    const history = parseJSON<Array<{ feedback: string; timestamp: number }>>(
      piece.feedbackHistory,
      []
    );

    const refined = await refineWithFeedback({
      entityType: "content",
      currentContent: piece.content ?? "",
      feedback: body.feedback,
      history,
    });

    const updated = await prisma.contentPiece.update({
      where: { id: params.id },
      data: {
        content: refined,
        feedbackHistory: JSON.stringify([
          ...history,
          { feedback: body.feedback, timestamp: Date.now() },
        ]),
      },
    });

    return NextResponse.json(updated);
  }

  // Status update - set publishedAt when publishing
  const updateData: Record<string, unknown> = { ...body };
  if (body.status === "published" && !body.publishedAt) {
    updateData.publishedAt = new Date();
  }

  const updated = await prisma.contentPiece.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.contentPiece.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
