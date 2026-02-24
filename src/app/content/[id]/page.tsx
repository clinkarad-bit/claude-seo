import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { parseJSON } from "@/lib/utils";
import { ContentDetailView } from "@/components/content/ContentDetailView";

export const metadata: Metadata = { title: "Content Piece" };

export default async function ContentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const piece = await prisma.contentPiece.findUnique({
    where: { id: params.id },
    include: {
      outline: {
        include: {
          topic: {
            include: {
              keywords: { orderBy: { searchVolume: "desc" }, take: 10 },
              topicCluster: { include: { customer: true } },
            },
          },
        },
      },
      performanceHistory: { orderBy: { measuredAt: "desc" } },
      performanceTracking: {
        include: { keyword: true },
        orderBy: { position: "asc" },
        take: 20,
      },
    },
  });

  if (!piece) notFound();

  const parsed = {
    ...piece,
    feedbackHistory: parseJSON(piece.feedbackHistory, null),
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/content"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Alle Content Pieces
        </Link>
      </div>
      <ContentDetailView piece={parsed} />
    </div>
  );
}
