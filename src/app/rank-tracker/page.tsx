"use client";

import { useState, useEffect, useCallback } from "react";
import { useCustomer } from "@/components/providers/CustomerProvider";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Wrench,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sparkles,
  Target,
  BarChart3,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────

interface RankKeyword {
  id: string;
  keyword: string;
  url: string | null;
  currentPosition: number | null;
  previousPosition: number | null;
  bestPosition: number | null;
  worstPosition: number | null;
  trend: string | null;
  trendDays: number | null;
  change: number | null;
  clicks: number;
  impressions: number;
  ctr: number;
  articleId: string | null;
  history: Array<{
    position: number | null;
    clicks: number;
    impressions: number;
    ctr: number;
    measuredAt: string;
  }>;
}

interface RankData {
  keywords: RankKeyword[];
  winners: RankKeyword[];
  losers: RankKeyword[];
  totalTracked: number;
  period: string;
}

interface SEOTask {
  id: string;
  articleId: string | null;
  customerId: string | null;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  analysis: string | null;
  createdAt: string;
  article?: {
    id: string;
    keyword: string;
    title: string | null;
    status: string;
  } | null;
}

interface OptimizationRecommendation {
  type: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

// ─── Mock Optimization Recommendations ────────────────────────────

function generateMockRecommendations(
  keyword: string
): OptimizationRecommendation[] {
  return [
    {
      type: "meta_update",
      title: "Title-Tag optimieren",
      description: `Keyword '${keyword}' weiter vorne im Title platzieren. Aktuell an Position 4, empfohlen: Position 1-2.`,
      priority: "high",
    },
    {
      type: "content_update",
      title: "H1 anpassen",
      description: `Aktuell: Allgemeine Überschrift. Empfohlen: '${keyword} - Kompletter Leitfaden 2026'. Top-3 nutzen das Keyword in der H1.`,
      priority: "high",
    },
    {
      type: "internal_link",
      title: "Interne Links hinzufügen",
      description:
        "3 relevante Seiten verlinken: /seo-grundlagen, /keyword-recherche, /on-page-seo. Top-Ergebnisse haben durchschnittlich 8 interne Links.",
      priority: "medium",
    },
    {
      type: "content_update",
      title: "Content erweitern",
      description: `Abschnitt zu 'Häufige Fehler bei ${keyword}' hinzufügen. Top-3 haben durchschnittlich 2.500 Wörter, Ihr Artikel hat nur 1.200.`,
      priority: "high",
    },
    {
      type: "meta_update",
      title: "Meta Description verbessern",
      description: `Aktuelle CTR liegt bei 2,1%. Empfehlung: Call-to-Action einbauen und Keyword '${keyword}' am Anfang platzieren.`,
      priority: "medium",
    },
    {
      type: "technical",
      title: "Structured Data hinzufügen",
      description:
        "FAQ-Schema und HowTo-Schema implementieren. 7 von 10 Top-Ergebnissen nutzen Rich Snippets.",
      priority: "low",
    },
    {
      type: "content_update",
      title: "Aktualität sicherstellen",
      description:
        "Daten und Statistiken auf 2026 aktualisieren. Google bevorzugt aktuelle Inhalte für dieses Keyword.",
      priority: "medium",
    },
  ];
}

// ─── Constants ───────────────────────────────────────────────────

const PERIOD_TABS = [
  { value: "day", label: "Heute" },
  { value: "week", label: "Diese Woche" },
  { value: "month", label: "Dieser Monat" },
  { value: "year", label: "Dieses Jahr" },
];

const TASK_STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  dismissed:
    "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  done: "Erledigt",
  dismissed: "Verworfen",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch",
};

// ─── Component ───────────────────────────────────────────────────

export default function RankTrackerPage() {
  const { activeCustomer } = useCustomer();
  const router = useRouter();

  const [period, setPeriod] = useState("week");
  const [data, setData] = useState<RankData | null>(null);
  const [tasks, setTasks] = useState<SEOTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [measuring, setMeasuring] = useState(false);

  // Optimization dialog state
  const [optimizeDialogOpen, setOptimizeDialogOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<RankKeyword | null>(
    null
  );
  const [recommendations, setRecommendations] = useState<
    OptimizationRecommendation[]
  >([]);
  const [creatingTask, setCreatingTask] = useState(false);

  const fetchData = useCallback(async () => {
    if (!activeCustomer) return;
    setLoading(true);
    try {
      const [rankRes, taskRes] = await Promise.all([
        fetch(
          `/api/rank-tracker?customerId=${activeCustomer.id}&period=${period}`
        ),
        fetch(`/api/seo-tasks?customerId=${activeCustomer.id}`),
      ]);
      if (rankRes.ok) {
        const rankData = await rankRes.json();
        setData(rankData);
      }
      if (taskRes.ok) {
        const taskData = await taskRes.json();
        setTasks(taskData);
      }
    } catch (err) {
      console.error("Failed to fetch rank data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeCustomer, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMeasure = async () => {
    if (!activeCustomer) return;
    setMeasuring(true);
    try {
      const res = await fetch("/api/rank-tracker/measure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: activeCustomer.id }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to measure:", err);
    } finally {
      setMeasuring(false);
    }
  };

  const handleOptimize = (kw: RankKeyword) => {
    setSelectedKeyword(kw);
    setRecommendations(generateMockRecommendations(kw.keyword));
    setOptimizeDialogOpen(true);
  };

  const handleCreateTask = async (rec: OptimizationRecommendation) => {
    if (!activeCustomer || !selectedKeyword) return;
    setCreatingTask(true);
    try {
      const res = await fetch("/api/seo-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: activeCustomer.id,
          articleId: selectedKeyword.articleId ?? null,
          type: rec.type,
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          analysis: JSON.stringify({
            keyword: selectedKeyword.keyword,
            currentPosition: selectedKeyword.currentPosition,
            url: selectedKeyword.url,
            recommendation: rec,
          }),
        }),
      });
      if (res.ok) {
        const taskRes = await fetch(
          `/api/seo-tasks?customerId=${activeCustomer.id}`
        );
        if (taskRes.ok) {
          setTasks(await taskRes.json());
        }
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setCreatingTask(false);
    }
  };

  const handleUpdateTaskStatus = async (
    taskId: string,
    status: string
  ) => {
    try {
      const res = await fetch("/api/seo-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status } : t))
        );
      }
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDirectOptimize = () => {
    if (selectedKeyword?.articleId) {
      router.push(`/content-writer/${selectedKeyword.articleId}`);
    }
    setOptimizeDialogOpen(false);
  };

  // ─── Render helpers ─────────────────────────────────────────

  function renderTrendIcon(trend: string | null, size = "h-4 w-4") {
    switch (trend) {
      case "up":
        return <TrendingUp className={cn(size, "text-green-600")} />;
      case "down":
        return <TrendingDown className={cn(size, "text-red-600")} />;
      case "stable":
        return <Minus className={cn(size, "text-gray-500")} />;
      default:
        return <Sparkles className={cn(size, "text-blue-500")} />;
    }
  }

  function renderChangeIndicator(change: number | null) {
    if (change == null) return <span className="text-gray-400">--</span>;
    if (change > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-green-600 font-medium">
          <ArrowUp className="h-3.5 w-3.5" />
          {Math.abs(change).toFixed(0)}
        </span>
      );
    }
    if (change < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-red-600 font-medium">
          <ArrowDown className="h-3.5 w-3.5" />
          {Math.abs(change).toFixed(0)}
        </span>
      );
    }
    return <span className="text-gray-500">0</span>;
  }

  // ─── No customer selected ──────────────────────────────────

  if (!activeCustomer) {
    return (
      <div className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Rank-Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Keyword-Rankings und Performance
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-center">
              Bitte wählen Sie einen Kunden aus, um Rankings zu tracken.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Main render ────────────────────────────────────────────

  const activeTasks = tasks.filter(
    (t) => t.status === "open" || t.status === "in_progress"
  );
  const completedTasks = tasks.filter(
    (t) => t.status === "done" || t.status === "dismissed"
  );

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rank-Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Keyword-Rankings und Performance
          </p>
        </div>
        <Button
          onClick={handleMeasure}
          disabled={measuring}
          className="gap-2"
        >
          <RefreshCw
            className={cn("h-4 w-4", measuring && "animate-spin")}
          />
          {measuring ? "Messe..." : "Rankings messen"}
        </Button>
      </div>

      {/* Period Tabs */}
      <Tabs
        value={period}
        onValueChange={setPeriod}
        className="mb-6"
      >
        <TabsList>
          {PERIOD_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading && !data ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mr-3" />
            <span className="text-muted-foreground">Lade Rankings...</span>
          </CardContent>
        </Card>
      ) : !data || data.keywords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              Noch keine Keywords getrackt. Starten Sie eine erste Messung.
            </p>
            <Button onClick={handleMeasure} disabled={measuring}>
              <RefreshCw
                className={cn("h-4 w-4 mr-2", measuring && "animate-spin")}
              />
              Erste Messung starten
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Winners & Losers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Winners */}
            <Card className="border-green-200 dark:border-green-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 dark:text-green-400">
                    Winner
                  </span>
                  {data.winners.length > 0 && (
                    <Badge
                      variant="success"
                      className="ml-auto"
                    >
                      {data.winners.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.winners.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Keine Verbesserungen in diesem Zeitraum
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.winners.map((kw) => (
                      <div
                        key={kw.id}
                        className="flex items-center gap-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 px-3 py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {kw.keyword}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {kw.url}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">
                            Pos. {kw.currentPosition?.toFixed(0)}
                          </p>
                          <span className="inline-flex items-center gap-0.5 text-xs text-green-600 font-medium">
                            <ArrowUp className="h-3 w-3" />
                            {Math.abs(kw.change ?? 0).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Losers */}
            <Card className="border-red-200 dark:border-red-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <span className="text-red-700 dark:text-red-400">Loser</span>
                  {data.losers.length > 0 && (
                    <Badge
                      className="ml-auto bg-red-100 text-red-800 hover:bg-red-100/80 border-transparent"
                    >
                      {data.losers.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.losers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Keine Verschlechterungen in diesem Zeitraum
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.losers.map((kw) => (
                      <div
                        key={kw.id}
                        className="flex items-center gap-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 px-3 py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {kw.keyword}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {kw.url}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              Pos. {kw.currentPosition?.toFixed(0)}
                            </p>
                            <span className="inline-flex items-center gap-0.5 text-xs text-red-600 font-medium">
                              <ArrowDown className="h-3 w-3" />
                              {Math.abs(kw.change ?? 0).toFixed(0)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOptimize(kw)}
                            className="h-7 px-2 text-xs"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Full Rankings Table */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Alle Keywords ({data.totalTracked})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                        Keyword
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                        Aktuelle Pos.
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                        Vorherige Pos.
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                        Beste Pos.
                      </th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">
                        Trend
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                        Clicks
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                        Impressions
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                        CTR
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                        URL
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.keywords.map((kw) => (
                      <tr
                        key={kw.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2.5 px-2 font-medium">
                          {kw.keyword}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <span
                            className={cn(
                              "font-semibold",
                              kw.currentPosition != null &&
                                kw.currentPosition <= 3
                                ? "text-green-600"
                                : kw.currentPosition != null &&
                                    kw.currentPosition <= 10
                                  ? "text-blue-600"
                                  : kw.currentPosition != null &&
                                      kw.currentPosition <= 20
                                    ? "text-amber-600"
                                    : "text-foreground"
                            )}
                          >
                            {kw.currentPosition?.toFixed(0) ?? "--"}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right text-muted-foreground">
                          {kw.previousPosition?.toFixed(0) ?? "--"}
                        </td>
                        <td className="py-2.5 px-2 text-right text-muted-foreground">
                          {kw.bestPosition?.toFixed(0) ?? "--"}
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center justify-center gap-1">
                            {renderTrendIcon(kw.trend)}
                            {renderChangeIndicator(kw.change)}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {kw.clicks.toLocaleString("de-DE")}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {kw.impressions.toLocaleString("de-DE")}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {kw.ctr.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-2 max-w-[200px]">
                          <span className="text-xs text-muted-foreground truncate block">
                            {kw.url ?? "--"}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {kw.change != null && kw.change < 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOptimize(kw)}
                              className="h-7 text-xs gap-1"
                            >
                              <Wrench className="h-3 w-3" />
                              Optimieren
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* SEO Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                SEO-Tasks
                {activeTasks.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeTasks.length} aktiv
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Noch keine SEO-Tasks erstellt. Nutzen Sie die
                  Optimieren-Funktion bei Losern, um Tasks zu generieren.
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Active tasks */}
                  {activeTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 rounded-lg border border-border/60 bg-background p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              TASK_STATUS_STYLES[task.status]
                            )}
                          >
                            {TASK_STATUS_LABELS[task.status]}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              PRIORITY_STYLES[task.priority]
                            )}
                          >
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                        {task.article && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Artikel: {task.article.title || task.article.keyword}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleUpdateTaskStatus(task.id, "done")
                          }
                          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Erledigt"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleUpdateTaskStatus(task.id, "dismissed")
                          }
                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                          title="Verwerfen"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Completed/dismissed tasks */}
                  {completedTasks.length > 0 && (
                    <>
                      <div className="pt-2 pb-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Abgeschlossen ({completedTasks.length})
                        </p>
                      </div>
                      {completedTasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 rounded-lg border border-border/30 bg-muted/20 p-3 opacity-60"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium line-through">
                                {task.title}
                              </p>
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                  TASK_STATUS_STYLES[task.status]
                                )}
                              >
                                {TASK_STATUS_LABELS[task.status]}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Optimization Dialog */}
      <Dialog open={optimizeDialogOpen} onOpenChange={setOptimizeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Optimierung: {selectedKeyword?.keyword}
            </DialogTitle>
            <DialogDescription>
              Basierend auf der Top-10-Analyse: Position{" "}
              {selectedKeyword?.currentPosition?.toFixed(0)} (
              {selectedKeyword?.change != null && selectedKeyword.change < 0
                ? `${Math.abs(selectedKeyword.change).toFixed(0)} Plätze gefallen`
                : "stabil"}
              )
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/60 bg-background p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{rec.title}</p>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          PRIORITY_STYLES[rec.priority]
                        )}
                      >
                        {PRIORITY_LABELS[rec.priority]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {rec.description}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateTask(rec)}
                    disabled={creatingTask}
                    className="shrink-0 h-7 text-xs gap-1"
                  >
                    <Wrench className="h-3 w-3" />
                    SEO-Task
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setOptimizeDialogOpen(false)}
            >
              Schließen
            </Button>
            {selectedKeyword?.articleId && (
              <Button onClick={handleDirectOptimize} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Direkt optimieren
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
