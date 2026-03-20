"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Globe,
  Link2,
  FileSearch,
  Layers,
  BarChart3,
  ArrowRight,
  Map,
  PenLine,
  LineChart,
  SearchX,
  Plus,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Minus,
} from "lucide-react";
import { useCustomer } from "@/components/providers/CustomerProvider";
import { cn, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ---------- Types ----------

interface CustomerMetrics {
  organicTraffic: number;
  domainRating: number;
  domainAuthority: number;
  totalBacklinks: number;
  referringDomains: number;
  indexedPages: number;
  coverageScore: number;
  metricsUpdatedAt: string | null;
}

interface CMSStatus {
  wordpress: { connected: boolean; siteUrl: string | null };
  webflow: { connected: boolean; siteId: string | null };
}

interface RecentArticle {
  id: string;
  keyword: string;
  title: string | null;
  status: string;
  updatedAt: string;
}

interface RankChange {
  id: string;
  keyword: string;
  currentPosition: number | null;
  previousPosition: number | null;
  trend: string | null;
}

interface ContentGapItem {
  id: string;
  keyword: string;
  searchVolume: number;
  opportunity: string | null;
  status: string;
}

interface CustomerData {
  metrics: CustomerMetrics;
  cms: CMSStatus;
  articles: RecentArticle[];
  rankTrackers: RankChange[];
  contentGaps: ContentGapItem[];
}

// ---------- Mock data for when no real metrics exist ----------

const MOCK_METRICS: CustomerMetrics = {
  organicTraffic: 12847,
  domainRating: 42.5,
  domainAuthority: 38,
  totalBacklinks: 3241,
  referringDomains: 287,
  indexedPages: 156,
  coverageScore: 64.2,
  metricsUpdatedAt: null,
};

const MOCK_TRENDS: Record<string, number> = {
  organicTraffic: 12.4,
  domainRating: 2.1,
  totalBacklinks: 8.7,
  referringDomains: 5.3,
  indexedPages: 3.2,
  coverageScore: -1.8,
};

const MOCK_ARTICLES: RecentArticle[] = [
  { id: "1", keyword: "SEO Strategie 2026", title: "Die ultimative SEO-Strategie fuer 2026", status: "published", updatedAt: new Date().toISOString() },
  { id: "2", keyword: "Content Marketing", title: "Content Marketing: Der komplette Leitfaden", status: "draft", updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "3", keyword: "Keyword Recherche", title: "Keyword-Recherche in 5 Schritten", status: "review", updatedAt: new Date(Date.now() - 172800000).toISOString() },
];

const MOCK_RANK_CHANGES: RankChange[] = [
  { id: "1", keyword: "seo tool", currentPosition: 5, previousPosition: 12, trend: "up" },
  { id: "2", keyword: "content optimierung", currentPosition: 3, previousPosition: 3, trend: "stable" },
  { id: "3", keyword: "keyword analyse", currentPosition: 18, previousPosition: 8, trend: "down" },
  { id: "4", keyword: "seo agentur", currentPosition: 7, previousPosition: 15, trend: "up" },
];

const MOCK_GAPS: ContentGapItem[] = [
  { id: "1", keyword: "technisches seo", searchVolume: 2400, opportunity: "high", status: "open" },
  { id: "2", keyword: "local seo optimierung", searchVolume: 1800, opportunity: "high", status: "open" },
  { id: "3", keyword: "seo audit durchfuehren", searchVolume: 1200, opportunity: "medium", status: "open" },
];

// ---------- Component ----------

export default function DashboardPage() {
  const { activeCustomer, refreshCustomers, loading: customerLoading } = useCustomer();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Dialog state
  const showNewDialog = searchParams.get("new") === "true";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDomain, setFormDomain] = useState("");
  const [formProjectStart, setFormProjectStart] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formUrls, setFormUrls] = useState("");

  // Open dialog when ?new=true
  useEffect(() => {
    if (showNewDialog) {
      setDialogOpen(true);
    }
  }, [showNewDialog]);

  // Fetch customer data when active customer changes
  const fetchCustomerData = useCallback(async (customerId: string) => {
    setDataLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerData(data);
      }
    } catch {
      // Fall back to mocks
      setCustomerData(null);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeCustomer) {
      fetchCustomerData(activeCustomer.id);
    }
  }, [activeCustomer, fetchCustomerData]);

  // Use real data or mocks
  const metrics = customerData?.metrics ?? MOCK_METRICS;
  const hasRealMetrics = metrics.organicTraffic > 0 || metrics.totalBacklinks > 0;
  const displayMetrics = hasRealMetrics ? metrics : MOCK_METRICS;

  const articles = customerData?.articles?.length ? customerData.articles : MOCK_ARTICLES;
  const rankChanges = customerData?.rankTrackers?.length ? customerData.rankTrackers : MOCK_RANK_CHANGES;
  const gaps = customerData?.contentGaps?.length ? customerData.contentGaps : MOCK_GAPS;
  const cms = customerData?.cms ?? { wordpress: { connected: false, siteUrl: null }, webflow: { connected: false, siteId: null } };

  // Handle dialog close
  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open && showNewDialog) {
      router.replace("/");
    }
  }

  // Handle customer creation
  async function handleCreateCustomer() {
    if (!formName.trim()) return;
    setCreating(true);
    try {
      const urlList = formUrls
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formName.trim(),
          domain: formDomain.trim() || undefined,
          description: "",
          projectStart: formProjectStart,
          urls: urlList,
        }),
      });

      if (res.ok) {
        await refreshCustomers();
        setDialogOpen(false);
        setFormName("");
        setFormDomain("");
        setFormUrls("");
        setFormProjectStart(new Date().toISOString().split("T")[0]);
        if (showNewDialog) {
          router.replace("/");
        }
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  // ---------- Metric Cards Config ----------

  const metricCards = [
    {
      label: "Organic Traffic",
      value: formatNumber(displayMetrics.organicTraffic),
      trend: MOCK_TRENDS.organicTraffic,
      icon: TrendingUp,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Domain Rating",
      value: displayMetrics.domainRating.toFixed(1),
      trend: MOCK_TRENDS.domainRating,
      icon: BarChart3,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Total Backlinks",
      value: formatNumber(displayMetrics.totalBacklinks),
      trend: MOCK_TRENDS.totalBacklinks,
      icon: Link2,
      iconBg: "bg-violet-100 dark:bg-violet-900/30",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Referring Domains",
      value: formatNumber(displayMetrics.referringDomains),
      trend: MOCK_TRENDS.referringDomains,
      icon: Globe,
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Indexed Pages",
      value: formatNumber(displayMetrics.indexedPages),
      trend: MOCK_TRENDS.indexedPages,
      icon: FileSearch,
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
      iconColor: "text-cyan-600 dark:text-cyan-400",
    },
    {
      label: "Coverage Score",
      value: `${displayMetrics.coverageScore}%`,
      trend: MOCK_TRENDS.coverageScore,
      icon: Layers,
      iconBg: "bg-rose-100 dark:bg-rose-900/30",
      iconColor: "text-rose-600 dark:text-rose-400",
    },
  ];

  // ---------- Quick Actions Config ----------

  const quickActions = [
    {
      title: "Keyword-Map erstellen",
      description: "Keyword-Cluster generieren und Abdeckung analysieren",
      icon: Map,
      href: "/keywords",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      title: "Artikel generieren",
      description: "SEO-optimierte Artikel mit KI erstellen",
      icon: PenLine,
      href: "/content-writer",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      title: "Rankings pruefen",
      description: "Keyword-Positionen tracken und Trends erkennen",
      icon: LineChart,
      href: "/rank-tracker",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      title: "Content-Gaps finden",
      description: "Chancen bei der Konkurrenz entdecken",
      icon: SearchX,
      href: "/content-gap",
      gradient: "from-amber-500 to-orange-600",
    },
  ];

  // ---------- Render ----------

  if (customerLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ===== Welcome Header ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {activeCustomer
              ? `${activeCustomer.companyName}`
              : "Willkommen bei SEOPilot"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {activeCustomer
              ? `SEO-Dashboard fuer ${activeCustomer.domain || activeCustomer.companyName}`
              : "Waehle einen Kunden oder erstelle ein neues Projekt, um zu starten."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeCustomer && (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 shadow-sm">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Live</span>
            </div>
          )}
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Neuer Kunde
          </Button>
        </div>
      </div>

      {/* ===== SEO Metrics Cards ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metricCards.map((card) => {
          const Icon = card.icon;
          const isPositive = card.trend >= 0;
          return (
            <div
              key={card.label}
              className={cn(
                "rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:shadow-md",
                dataLoading && "animate-pulse"
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", card.iconBg)}>
                  <Icon className={cn("h-5 w-5", card.iconColor)} />
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    isPositive
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(card.trend)}%
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Quick Actions ===== */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
                  <div
                    className={cn(
                      "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                      action.gradient
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {action.description}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary transition-transform group-hover:translate-x-1">
                    Starten <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                  {/* Decorative gradient overlay on hover */}
                  <div className={cn(
                    "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity group-hover:opacity-10",
                    action.gradient
                  )} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ===== Recent Activity + Rank Changes + Content Gaps ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Articles */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Letzte Artikel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex items-start gap-3 rounded-lg border border-border/40 p-3 transition-colors hover:bg-muted/50"
              >
                <div className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  article.status === "published"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : article.status === "draft"
                    ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                )}>
                  {article.status === "published" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : article.status === "draft" ? (
                    <PenLine className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {article.title || article.keyword}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {article.status === "published" ? "Veroeffentlicht" : article.status === "draft" ? "Entwurf" : "In Pruefung"}
                    {" \u00B7 "}
                    {new Date(article.updatedAt).toLocaleDateString("de-DE")}
                  </p>
                </div>
              </div>
            ))}
            {articles.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Noch keine Artikel vorhanden
              </p>
            )}
          </CardContent>
        </Card>

        {/* Rank Changes */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChart className="h-4 w-4 text-muted-foreground" />
              Ranking-Veraenderungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rankChanges.map((rank) => {
              const diff = rank.previousPosition && rank.currentPosition
                ? rank.previousPosition - rank.currentPosition
                : 0;
              return (
                <div
                  key={rank.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{rank.keyword}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Position: {rank.currentPosition ?? "n/a"}
                    </p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                    rank.trend === "up"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : rank.trend === "down"
                      ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  )}>
                    {rank.trend === "up" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : rank.trend === "down" ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    {diff !== 0 ? `${diff > 0 ? "+" : ""}${diff}` : "\u2013"}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Content Gaps */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <SearchX className="h-4 w-4 text-muted-foreground" />
              Content-Gaps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gaps.map((gap) => (
              <div
                key={gap.id}
                className="flex items-center justify-between rounded-lg border border-border/40 p-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{gap.keyword}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatNumber(gap.searchVolume)} Suchen/Monat
                  </p>
                </div>
                <span className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                  gap.opportunity === "high"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : gap.opportunity === "medium"
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                )}>
                  {gap.opportunity === "high" ? "Hoch" : gap.opportunity === "medium" ? "Mittel" : "Niedrig"}
                </span>
              </div>
            ))}
            <Link
              href="/content-gap"
              className="mt-2 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Alle Gaps ansehen <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ===== CMS Connection Status ===== */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">CMS-Verbindungen</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className={cn(
              "flex h-11 w-11 items-center justify-center rounded-lg",
              cms.wordpress.connected
                ? "bg-blue-100 dark:bg-blue-900/30"
                : "bg-gray-100 dark:bg-gray-800"
            )}>
              <Globe className={cn(
                "h-5 w-5",
                cms.wordpress.connected
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400"
              )} />
            </div>
            <div>
              <p className="text-sm font-semibold">WordPress</p>
              <p className={cn(
                "text-xs",
                cms.wordpress.connected ? "text-emerald-600" : "text-muted-foreground"
              )}>
                {cms.wordpress.connected ? "Verbunden" : "Nicht verbunden"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className={cn(
              "flex h-11 w-11 items-center justify-center rounded-lg",
              cms.webflow.connected
                ? "bg-violet-100 dark:bg-violet-900/30"
                : "bg-gray-100 dark:bg-gray-800"
            )}>
              <Layers className={cn(
                "h-5 w-5",
                cms.webflow.connected
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-gray-400"
              )} />
            </div>
            <div>
              <p className="text-sm font-semibold">Webflow</p>
              <p className={cn(
                "text-xs",
                cms.webflow.connected ? "text-emerald-600" : "text-muted-foreground"
              )}>
                {cms.webflow.connected ? "Verbunden" : "Nicht verbunden"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Customer Create Dialog ===== */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neuen Kunden anlegen</DialogTitle>
            <DialogDescription>
              Erstelle ein neues Kundenprojekt fuer dein SEO-Management.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Kundenname *</Label>
              <Input
                id="customer-name"
                placeholder="z.B. Muster GmbH"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-domain">Website / Domain</Label>
              <Input
                id="customer-domain"
                placeholder="https://www.example.com"
                value={formDomain}
                onChange={(e) => setFormDomain(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-start">Projektstart</Label>
              <Input
                id="customer-start"
                type="date"
                value={formProjectStart}
                onChange={(e) => setFormProjectStart(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-urls">URLs eingeben</Label>
              <Textarea
                id="customer-urls"
                placeholder={"https://www.example.com/seite-1\nhttps://www.example.com/seite-2\nhttps://www.example.com/seite-3"}
                rows={4}
                value={formUrls}
                onChange={(e) => setFormUrls(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Eine URL pro Zeile. Diese Seiten werden initial analysiert.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={creating}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateCustomer}
              disabled={!formName.trim() || creating}
            >
              {creating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Wird erstellt...
                </>
              ) : (
                "Kunde erstellen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
