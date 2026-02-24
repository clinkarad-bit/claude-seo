import type { Metadata } from "next";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import { getScoreBadgeClass } from "@/lib/seo";

export const metadata: Metadata = { title: "Content Pieces" };

export default async function ContentPage() {
  const pieces = await prisma.contentPiece.findMany({
    include: {
      outline: {
        include: {
          topic: { include: { topicCluster: { include: { customer: true } } } },
        },
      },
      performanceHistory: {
        orderBy: { measuredAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Content Pieces"
        description="KI-generierte SEO-Artikel verwalten und veröffentlichen"
      />

      {pieces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <PenLine className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">Noch keine Content Pieces</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Erstelle zuerst eine Outline und generiere daraus einen Artikel.
          </p>
          <Link
            href="/outlines"
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Zu den Outlines →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {pieces.map((piece) => {
            const score = piece.performanceHistory[0]?.performanceScore ?? null;
            return (
              <Link key={piece.id} href={`/content/${piece.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{piece.title}</p>
                        <StatusBadge status={piece.status} />
                        {score !== null && (
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getScoreBadgeClass(score)}`}
                          >
                            Score: {score}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {piece.outline.topic.topicCluster.customer.companyName}{" "}
                        · {piece.outline.topic.title} · Erstellt{" "}
                        {formatDate(piece.createdAt)}
                      </p>
                      {piece.urlSlug && (
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          /{piece.urlSlug}
                        </p>
                      )}
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
