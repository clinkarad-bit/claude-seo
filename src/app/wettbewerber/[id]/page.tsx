"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  Link2,
  TrendingUp,
  FileText,
  AlertTriangle,
  Calendar,
  RefreshCw,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn, formatDate, formatNumber, parseJSON } from "@/lib/utils";

interface CompetitorDetail {
  id: string;
  domain: string;
  domainRating: number | null;
  totalBacklinks: number | null;
  organicTraffic: number | null;
  isAISuggested: boolean;
  isActive: boolean;
  lastScreenedAt: string | null;
  createdAt: string;
  customer: {
    id: string;
    companyName: string;
    domain: string | null;
  };
  updates: CompetitorUpdate[];
  backlinks: CompetitorBacklink[];
  topPages: CompetitorTopPage[];
  brokenLinks: CompetitorBrokenLink[];
  contentGaps: ContentGapItem[];
}

interface CompetitorUpdate {
  id: string;
  month: string;
  summary: string;
  newContent: string | null;
  backlinksGained: number | null;
  backlinksLost: number | null;
  trafficChange: number | null;
  createdAt: string;
}

interface CompetitorBacklink {
  id: string;
  sourceUrl: string;
  sourceDomain: string;
  anchorText: string | null;
  linkType: string;
  domainRating: number | null;
  isNew: boolean;
  isLost: boolean;
  firstSeen: string;
  lastSeen: string;
}

interface CompetitorTopPage {
  id: string;
  url: string;
  title: string | null;
  estimatedTraffic: number | null;
  keywords: string | null;
  backlinks: number | null;
}

interface CompetitorBrokenLink {
  id: string;
  brokenUrl: string;
  sourceUrl: string | null;
  anchorText: string | null;
  topicRelevant: boolean;
  httpStatus: number | null;
}

interface ContentGapItem {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number | null;
  competitorUrl: string | null;
  opportunity: string | null;
  status: string;
}

interface NewContentItem {
  url: string;
  title: string;
  estimatedTraffic: number;
  publishedDate: string;
}

export default function WettbewerberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [competitor, setCompetitor] = useState<CompetitorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [screening, setScreening] = useState(false);

  const fetchCompetitor = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/competitors/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCompetitor(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCompetitor();
  }, [fetchCompetitor]);

  async function handleScreen() {
    setScreening(true);
    try {
      const res = await fetch(`/api/competitors/${id}/screen`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchCompetitor();
      }
    } catch {
      // ignore
    } finally {
      setScreening(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="py-8">
                  <div className="h-10 w-20 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!competitor) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Wettbewerber nicht gefunden.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gather new content from the latest update
  const latestUpdate = competitor.updates[0] ?? null;
  const newContentItems: NewContentItem[] = latestUpdate
    ? parseJSON<NewContentItem[]>(latestUpdate.newContent, [])
    : [];

  const newBacklinks = competitor.backlinks.filter((b) => b.isNew && !b.isLost);
  const lostBacklinks = competitor.backlinks.filter((b) => b.isLost);
  const allBacklinks = competitor.backlinks;

  return (
    <div className="p-8">
      <PageHeader
        title={competitor.domain}
        description={`Wettbewerbsanalyse für ${competitor.customer.companyName}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/wettbewerber")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
            <Button onClick={handleScreen} disabled={screening}>
              {screening ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Screening starten
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">
            <Globe className="mr-1.5 h-4 w-4" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="new-content">
            <FileText className="mr-1.5 h-4 w-4" />
            Neuer Content
          </TabsTrigger>
          <TabsTrigger value="top-pages">
            <TrendingUp className="mr-1.5 h-4 w-4" />
            Top-Seiten
          </TabsTrigger>
          <TabsTrigger value="content-gaps">
            <AlertTriangle className="mr-1.5 h-4 w-4" />
            Content-Gaps zu uns
          </TabsTrigger>
          <TabsTrigger value="backlinks">
            <Link2 className="mr-1.5 h-4 w-4" />
            Backlinks
          </TabsTrigger>
          <TabsTrigger value="updates">
            <Calendar className="mr-1.5 h-4 w-4" />
            Monatliche Updates
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Übersicht */}
        <TabsContent value="overview">
          <OverviewTab competitor={competitor} latestUpdate={latestUpdate} />
        </TabsContent>

        {/* Tab 2: Neuer Content */}
        <TabsContent value="new-content">
          <NewContentTab items={newContentItems} domain={competitor.domain} />
        </TabsContent>

        {/* Tab 3: Top-Seiten */}
        <TabsContent value="top-pages">
          <TopPagesTab pages={competitor.topPages} />
        </TabsContent>

        {/* Tab 4: Content-Gaps */}
        <TabsContent value="content-gaps">
          <ContentGapsTab gaps={competitor.contentGaps} />
        </TabsContent>

        {/* Tab 5: Backlinks */}
        <TabsContent value="backlinks">
          <BacklinksTab
            newBacklinks={newBacklinks}
            lostBacklinks={lostBacklinks}
            allBacklinks={allBacklinks}
            brokenLinks={competitor.brokenLinks}
          />
        </TabsContent>

        {/* Tab 6: Monatliche Updates */}
        <TabsContent value="updates">
          <MonthlyUpdatesTab updates={competitor.updates} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============ Tab Components ============ */

function OverviewTab({
  competitor,
  latestUpdate,
}: {
  competitor: CompetitorDetail;
  latestUpdate: CompetitorUpdate | null;
}) {
  return (
    <div className="space-y-6">
      {/* Metrics cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Domain Rating</p>
            <p className="text-3xl font-bold text-blue-600">
              {competitor.domainRating?.toFixed(1) ?? "--"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Gesamte Backlinks</p>
            <p className="text-3xl font-bold text-amber-600">
              {competitor.totalBacklinks != null
                ? formatNumber(competitor.totalBacklinks)
                : "--"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Organischer Traffic (geschätzt)
            </p>
            <p className="text-3xl font-bold text-green-600">
              {competitor.organicTraffic != null
                ? formatNumber(competitor.organicTraffic)
                : "--"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly summary */}
      {latestUpdate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Monatszusammenfassung ({latestUpdate.month})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {latestUpdate.summary}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Backlinks gewonnen
                </p>
                <p className="text-lg font-semibold text-green-600">
                  +{latestUpdate.backlinksGained ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Backlinks verloren
                </p>
                <p className="text-lg font-semibold text-red-600">
                  -{latestUpdate.backlinksLost ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Traffic-Veränderung
                </p>
                <p
                  className={cn(
                    "text-lg font-semibold",
                    (latestUpdate.trafficChange ?? 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  )}
                >
                  {(latestUpdate.trafficChange ?? 0) >= 0 ? "+" : ""}
                  {latestUpdate.trafficChange?.toFixed(1) ?? "0"}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <span className="text-muted-foreground">Hinzugefügt am</span>
              <p className="font-medium">{formatDate(competitor.createdAt)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Zuletzt analysiert</span>
              <p className="font-medium">
                {competitor.lastScreenedAt
                  ? formatDate(competitor.lastScreenedAt)
                  : "Noch nicht"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Top-Seiten</span>
              <p className="font-medium">{competitor.topPages.length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Broken Links</span>
              <p className="font-medium">{competitor.brokenLinks.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NewContentTab({
  items,
  domain,
}: {
  items: NewContentItem[];
  domain: string;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <p>
            Kein neuer Content gefunden. Starten Sie ein Screening, um aktuelle
            Daten zu laden.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Kürzlich veröffentlichte Seiten von {domain}
      </p>
      {items.map((item, i) => (
        <Card key={i}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{item.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {item.url}
              </p>
            </div>
            <div className="ml-4 flex items-center gap-6 text-sm">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  Geschätzter Traffic
                </p>
                <p className="font-semibold text-green-600">
                  {formatNumber(item.estimatedTraffic)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Veröffentlicht</p>
                <p className="font-medium">{formatDate(item.publishedDate)}</p>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </a>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TopPagesTab({ pages }: { pages: CompetitorTopPage[] }) {
  if (pages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <p>
            Keine Top-Seiten vorhanden. Starten Sie ein Screening, um Daten zu
            laden.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Top-Seiten nach geschätztem Traffic
      </p>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Seite
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Traffic
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Keywords
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Backlinks
                </th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => {
                const keywords = parseJSON<string[]>(page.keywords, []);
                return (
                  <tr key={page.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{page.title ?? page.url}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {page.url}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-600">
                      {page.estimatedTraffic != null
                        ? formatNumber(page.estimatedTraffic)
                        : "--"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {keywords.slice(0, 3).map((kw, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                        {keywords.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{keywords.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {page.backlinks ?? "--"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ContentGapsTab({ gaps }: { gaps: ContentGapItem[] }) {
  if (gaps.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <p>
            Keine Content-Gaps gefunden. Führen Sie zuerst eine
            Content-Gap-Analyse durch.
          </p>
        </CardContent>
      </Card>
    );
  }

  const opportunityColor: Record<string, string> = {
    high: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Keywords, für die dieser Wettbewerber rankt und wir nicht
      </p>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Keyword
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Suchvolumen
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Schwierigkeit
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Opportunity
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {gaps.map((gap) => (
                <tr key={gap.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{gap.keyword}</td>
                  <td className="px-4 py-3">
                    {formatNumber(gap.searchVolume)}
                  </td>
                  <td className="px-4 py-3">
                    {gap.difficulty != null
                      ? gap.difficulty.toFixed(0)
                      : "--"}
                  </td>
                  <td className="px-4 py-3">
                    {gap.opportunity && (
                      <Badge
                        className={cn(
                          "text-xs",
                          opportunityColor[gap.opportunity] ??
                            "bg-gray-100 text-gray-700"
                        )}
                      >
                        {gap.opportunity === "high"
                          ? "Hoch"
                          : gap.opportunity === "medium"
                            ? "Mittel"
                            : "Niedrig"}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs capitalize">
                      {gap.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function BacklinksTab({
  newBacklinks,
  lostBacklinks,
  allBacklinks,
  brokenLinks,
}: {
  newBacklinks: CompetitorBacklink[];
  lostBacklinks: CompetitorBacklink[];
  allBacklinks: CompetitorBacklink[];
  brokenLinks: CompetitorBrokenLink[];
}) {
  if (allBacklinks.length === 0 && brokenLinks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Link2 className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <p>
            Keine Backlinks vorhanden. Starten Sie ein Screening, um Daten zu
            laden.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Gesamt</p>
            <p className="text-2xl font-bold">{allBacklinks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Neue Backlinks</p>
            <p className="text-2xl font-bold text-green-600">
              {newBacklinks.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Verlorene Backlinks</p>
            <p className="text-2xl font-bold text-red-600">
              {lostBacklinks.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Broken Links</p>
            <p className="text-2xl font-bold text-amber-600">
              {brokenLinks.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* New Backlinks */}
      {newBacklinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
              Neue Backlinks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {newBacklinks.slice(0, 10).map((bl) => (
                <div
                  key={bl.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="success" className="text-xs">
                        Neu
                      </Badge>
                      <span className="font-medium">{bl.sourceDomain}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {bl.sourceUrl}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Anker</p>
                      <p>{bl.anchorText ?? "--"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">DR</p>
                      <p className="font-semibold">
                        {bl.domainRating?.toFixed(0) ?? "--"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {bl.linkType}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lost Backlinks */}
      {lostBacklinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
              Verlorene Backlinks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lostBacklinks.map((bl) => (
                <div
                  key={bl.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        Verloren
                      </Badge>
                      <span className="font-medium">{bl.sourceDomain}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {bl.sourceUrl}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Anker</p>
                      <p>{bl.anchorText ?? "--"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">DR</p>
                      <p className="font-semibold">
                        {bl.domainRating?.toFixed(0) ?? "--"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Broken Links */}
      {brokenLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Broken Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {brokenLinks.map((bl) => (
                <div
                  key={bl.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-800 text-xs">
                        Broken
                      </Badge>
                      {bl.topicRelevant && (
                        <Badge variant="outline" className="text-xs">
                          Themenrelevant
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm font-medium">
                      {bl.brokenUrl}
                    </p>
                    {bl.sourceUrl && (
                      <p className="truncate text-xs text-muted-foreground">
                        Quelle: {bl.sourceUrl}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex items-center gap-4 text-sm">
                    {bl.anchorText && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Anker</p>
                        <p>{bl.anchorText}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        HTTP-Status
                      </p>
                      <p className="font-semibold text-red-600">
                        {bl.httpStatus ?? "--"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Backlinks table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alle Backlinks</CardTitle>
          <CardDescription>
            Vollständige Backlink-Übersicht
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Quelle
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Ankertext
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    DR
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Typ
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Erstmals gesehen
                  </th>
                </tr>
              </thead>
              <tbody>
                {allBacklinks.map((bl) => (
                  <tr key={bl.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{bl.sourceDomain}</p>
                      <p className="truncate text-xs text-muted-foreground max-w-xs">
                        {bl.sourceUrl}
                      </p>
                    </td>
                    <td className="px-4 py-3">{bl.anchorText ?? "--"}</td>
                    <td className="px-4 py-3 font-semibold">
                      {bl.domainRating?.toFixed(0) ?? "--"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {bl.linkType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(bl.firstSeen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MonthlyUpdatesTab({ updates }: { updates: CompetitorUpdate[] }) {
  if (updates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Calendar className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <p>
            Keine monatlichen Updates vorhanden. Starten Sie ein Screening, um
            Daten zu generieren.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Zeitverlauf der monatlichen Wettbewerber-Updates
      </p>
      {updates.map((update) => {
        const newContent = parseJSON<NewContentItem[]>(update.newContent, []);
        return (
          <Card key={update.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{update.month}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {formatDate(update.createdAt)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {update.summary}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Neuer Content
                  </p>
                  <p className="text-lg font-semibold">{newContent.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Backlinks gewonnen
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                    +{update.backlinksGained ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Backlinks verloren
                  </p>
                  <p className="text-lg font-semibold text-red-600">
                    -{update.backlinksLost ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Traffic-Veränderung
                  </p>
                  <p
                    className={cn(
                      "text-lg font-semibold",
                      (update.trafficChange ?? 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {(update.trafficChange ?? 0) >= 0 ? "+" : ""}
                    {update.trafficChange?.toFixed(1) ?? "0"}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
