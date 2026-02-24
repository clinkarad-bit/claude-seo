import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, RefreshCw, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import { calculatePerformanceScore, getScoreBadgeClass, getRankingColor } from "@/lib/seo";
import { PerformanceMeasureButton } from "@/components/performance/PerformanceMeasureButton";

export const metadata: Metadata = { title: "Performance Monitoring" };

export default async function PerformancePage() {
  const pieces = await prisma.contentPiece.findMany({
    where: { status: "published" },
    include: {
      outline: {
        include: {
          topic: {
            include: {
              keywords: { where: { relevant: true } },
              topicCluster: { include: { customer: true } },
            },
          },
        },
      },
      performanceHistory: {
        orderBy: { measuredAt: "desc" },
        take: 1,
      },
      performanceTracking: {
        include: { keyword: true },
        orderBy: { measuredAt: "desc" },
        take: 5,
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  const avgScore =
    pieces.length > 0
      ? Math.round(
          pieces
            .filter((p) => p.performanceHistory[0])
            .reduce((s, p) => s + (p.performanceHistory[0]?.performanceScore ?? 0), 0) /
            Math.max(1, pieces.filter((p) => p.performanceHistory[0]).length)
        )
      : 0;

  return (
    <div>
      <PageHeader
        title="Performance Monitoring"
        description="Rankings und Performance aller veröffentlichten Artikel"
        actions={<PerformanceMeasureButton contentPieceIds={pieces.map((p) => p.id)} />}
      />

      {/* Summary stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Veröffentlichte Artikel</p>
            <p className="text-3xl font-bold">{pieces.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Durchschnittlicher Score</p>
            <p
              className={`text-3xl font-bold ${avgScore >= 60 ? "text-green-600" : avgScore >= 30 ? "text-yellow-600" : "text-red-600"}`}
            >
              {avgScore}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Gemessen</p>
            <p className="text-3xl font-bold">
              {pieces.filter((p) => p.performanceHistory.length > 0).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {pieces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">Keine veröffentlichten Artikel</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Setze Content Pieces auf "Veröffentlicht", um die Performance zu tracken.
          </p>
          <Link
            href="/content"
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Zu den Content Pieces →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pieces.map((piece) => {
            const score = piece.performanceHistory[0]?.performanceScore ?? null;
            const latestTracking = piece.performanceTracking;

            return (
              <Card key={piece.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/content/${piece.id}`}
                          className="font-semibold hover:text-primary hover:underline"
                        >
                          {piece.title}
                        </Link>
                        {score !== null && (
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getScoreBadgeClass(score)}`}
                          >
                            Score: {score}
                          </span>
                        )}
                        {score === null && (
                          <span className="inline-flex items-center rounded-full border bg-gray-50 px-2.5 py-0.5 text-xs text-gray-500">
                            Noch nicht gemessen
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {piece.outline.topic.topicCluster.customer.companyName}{" "}
                        · Veröffentlicht{" "}
                        {piece.publishedAt ? formatDate(piece.publishedAt) : "–"}
                      </p>
                      {piece.urlSlug && (
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          /{piece.urlSlug}
                        </p>
                      )}
                    </div>

                    <PerformanceMeasureButton
                      contentPieceIds={[piece.id]}
                      size="sm"
                      label="Messen"
                    />
                  </div>

                  {/* Keyword rankings */}
                  {latestTracking.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                      {latestTracking.map((t) => (
                        <div
                          key={t.keyword.keyword}
                          className="rounded-lg border bg-muted/30 p-2 text-center"
                        >
                          <p className="truncate text-xs text-muted-foreground">
                            {t.keyword.keyword}
                          </p>
                          <p
                            className={`mt-1 font-mono text-sm font-bold ${getRankingColor(t.position)}`}
                          >
                            #{Math.round(t.position)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t.clicks} Klicks
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
