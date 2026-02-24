import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, formatNumber, parseJSON } from "@/lib/utils";
import { OutlineCreateFromTopicWidget } from "@/components/outlines/OutlineCreateFromTopicWidget";

export const metadata: Metadata = { title: "Outlines" };

export default async function OutlinesPage({
  searchParams,
}: {
  searchParams: { topicId?: string };
}) {
  const [outlines, topics] = await Promise.all([
    prisma.outline.findMany({
      include: {
        topic: {
          include: { topicCluster: { include: { customer: true } } },
        },
        contentPiece: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.topic.findMany({
      where: { outline: null },
      include: { topicCluster: { include: { customer: true } } },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Outlines"
        description="SEO-Outlines mit Keywords, TF*IDF und internen Links"
        actions={
          <OutlineCreateFromTopicWidget
            topics={topics}
            preselectedTopicId={searchParams.topicId}
          />
        }
      />

      {outlines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">Noch keine Outlines</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Erstelle deine erste SEO-Outline aus einem bestehenden Thema.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {outlines.map((outline) => {
            const content = parseJSON<{ suggestedTitle?: string; sections?: unknown[] }>(
              outline.content,
              {}
            );
            const sectionCount = content.sections?.length ?? 0;

            return (
              <Link key={outline.id} href={`/outlines/${outline.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {outline.topic.title}
                        </p>
                        <StatusBadge status={outline.status} />
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {outline.topic.topicCluster.customer.companyName} ·{" "}
                        Main: <strong>{outline.mainKeyword}</strong> ·{" "}
                        {sectionCount} Sektionen · Erstellt{" "}
                        {formatDate(outline.createdAt)}
                      </p>
                      {outline.contentPiece && (
                        <span className="mt-1 inline-flex items-center rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs text-green-700">
                          Content Piece vorhanden
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-2xl font-bold text-primary">
                        {sectionCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Sektionen</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
