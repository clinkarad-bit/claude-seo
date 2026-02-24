import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { parseJSON } from "@/lib/utils";
import { OutlineDetailView } from "@/components/outlines/OutlineDetailView";

export const metadata: Metadata = { title: "Outline" };

export default async function OutlineDetailPage({
  params,
}: {
  params: { id: string };
}) {
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

  if (!outline) notFound();

  const parsed = {
    ...outline,
    secondaryKeywords: parseJSON<string[]>(outline.secondaryKeywords, []),
    internalLinks: parseJSON<Array<{ url: string; anchor: string }>>(
      outline.internalLinks,
      []
    ),
    externalLinks: parseJSON<Array<{ url: string; anchor: string }>>(
      outline.externalLinks,
      []
    ),
    tfidfData: parseJSON(outline.tfidfData, null),
    content: parseJSON<{ suggestedTitle?: string; sections?: Array<{
      h2: string;
      bullets: string[];
      keywords: string[];
      internalLinks: Array<{ url: string; anchor: string }>;
      externalLinks: Array<{ url: string; anchor: string }>;
    }> }>(outline.content, { sections: [] }),
    feedbackHistory: parseJSON(outline.feedbackHistory, null),
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/outlines"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Alle Outlines
        </Link>
      </div>
      <OutlineDetailView outline={parsed} />
    </div>
  );
}
