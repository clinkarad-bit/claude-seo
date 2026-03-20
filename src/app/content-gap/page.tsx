"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomer } from "@/components/providers/CustomerProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatDate, formatNumber } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────

interface ContentGap {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number | null;
  competitorUrl: string | null;
  competitorDomain: string | null;
  opportunity: string | null;
  status: string;
  articleId: string | null;
  lastChecked: string;
}

interface Competitor {
  id: string;
  domain: string;
  isAISuggested: boolean;
  isManuallyAdded: boolean;
  isActive: boolean;
  lastScreenedAt: string | null;
}

// ── Helpers ────────────────────────────────────────────

const OPPORTUNITY_STYLES: Record<string, string> = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

const OPPORTUNITY_LABELS: Record<string, string> = {
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 border-blue-200",
  planned: "bg-yellow-100 text-yellow-800 border-yellow-200",
  created: "bg-green-100 text-green-800 border-green-200",
  dismissed: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Offen",
  planned: "Geplant",
  created: "Erstellt",
  dismissed: "Verworfen",
};

// ── Component ──────────────────────────────────────────

export default function ContentGapPage() {
  const router = useRouter();
  const { activeCustomer } = useCustomer();

  const [gaps, setGaps] = useState<ContentGap[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [lastAnalysisDate, setLastAnalysisDate] = useState<string | null>(null);

  // Filters
  const [filterOpportunity, setFilterOpportunity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // ── Fetch data ─────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!activeCustomer) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/content-gap?customerId=${activeCustomer.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setGaps(data.gaps || []);
        setCompetitors(data.competitors || []);

        // Pre-select AI suggested competitors
        const suggested = (data.competitors || [])
          .filter((c: Competitor) => c.isAISuggested && c.isActive)
          .map((c: Competitor) => c.domain);
        if (suggested.length > 0) {
          setSelectedDomains(suggested);
        }

        // Last analysis date
        const latestGap = (data.gaps || []).reduce(
          (latest: string | null, g: ContentGap) => {
            if (!latest || g.lastChecked > latest) return g.lastChecked;
            return latest;
          },
          null as string | null
        );
        setLastAnalysisDate(latestGap);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeCustomer]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Actions ────────────────────────────────────────

  async function runAnalysis() {
    if (!activeCustomer || selectedDomains.length === 0) return;
    setAnalysisLoading(true);
    try {
      const res = await fetch("/api/content-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: activeCustomer.id,
          competitorDomains: selectedDomains,
        }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // ignore
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function updateGapStatus(gapId: string, status: string) {
    try {
      const res = await fetch(`/api/content-gap/${gapId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setGaps((prev) =>
          prev.map((g) => (g.id === gapId ? { ...g, status } : g))
        );
      }
    } catch {
      // ignore
    }
  }

  function addCompetitorDomain() {
    const domain = newDomain.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (domain && !selectedDomains.includes(domain)) {
      setSelectedDomains((prev) => [...prev, domain]);
      setNewDomain("");
    }
  }

  function removeCompetitorDomain(domain: string) {
    setSelectedDomains((prev) => prev.filter((d) => d !== domain));
  }

  function toggleCompetitorDomain(domain: string) {
    setSelectedDomains((prev) =>
      prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : [...prev, domain]
    );
  }

  // ── Filtered gaps ──────────────────────────────────

  const filteredGaps = gaps.filter((g) => {
    if (filterOpportunity !== "all" && g.opportunity !== filterOpportunity) return false;
    if (filterStatus !== "all" && g.status !== filterStatus) return false;
    return true;
  });

  // ── Summary counts ────────────────────────────────

  const highCount = gaps.filter((g) => g.opportunity === "high").length;
  const mediumCount = gaps.filter((g) => g.opportunity === "medium").length;
  const lowCount = gaps.filter((g) => g.opportunity === "low").length;

  // ── Next analysis date (mock: 30 days from last) ──

  const nextAnalysisDate = lastAnalysisDate
    ? new Date(new Date(lastAnalysisDate).getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;

  // ── No customer selected ──────────────────────────

  if (!activeCustomer) {
    return (
      <div className="p-8">
        <PageHeader
          title="Content-Gap-Analyse"
          description="Fehlende Themen im Vergleich zum Wettbewerb"
        />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Bitte zuerst einen Kunden auswaehlen.
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Content-Gap-Analyse"
        description="Fehlende Themen im Vergleich zum Wettbewerb"
      />

      {/* ── Competitor Selector ──────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Wettbewerber auswaehlen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI suggested competitors */}
          {competitors.filter((c) => c.isAISuggested).length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Vorgeschlagene Wettbewerber
              </p>
              <div className="flex flex-wrap gap-2">
                {competitors
                  .filter((c) => c.isAISuggested)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => toggleCompetitorDomain(c.domain)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        selectedDomains.includes(c.domain)
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                      )}
                    >
                      {selectedDomains.includes(c.domain) && (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {c.domain}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Selected manually-added domains */}
          {selectedDomains.filter(
            (d) => !competitors.some((c) => c.isAISuggested && c.domain === d)
          ).length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Manuell hinzugefuegt
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedDomains
                  .filter(
                    (d) =>
                      !competitors.some((c) => c.isAISuggested && c.domain === d)
                  )
                  .map((domain) => (
                    <span
                      key={domain}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-primary/10 text-primary border-primary/30 px-3 py-1.5 text-sm font-medium"
                    >
                      {domain}
                      <button
                        onClick={() => removeCompetitorDomain(domain)}
                        className="ml-0.5 hover:text-destructive"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Add domain input */}
          <div className="flex gap-2">
            <Input
              placeholder="Domain hinzufuegen (z.B. check24.de)"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCompetitorDomain();
                }
              }}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={addCompetitorDomain}>
              Hinzufuegen
            </Button>
          </div>

          {/* Run analysis button + last date */}
          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={runAnalysis}
              disabled={analysisLoading || selectedDomains.length === 0}
            >
              {analysisLoading ? "Analyse laeuft..." : "Analyse starten"}
            </Button>
            {lastAnalysisDate && (
              <span className="text-sm text-muted-foreground">
                Letzte Analyse: {formatDate(lastAnalysisDate)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Loading state ────────────────────────────── */}
      {loading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Daten werden geladen...
          </CardContent>
        </Card>
      )}

      {/* ── Results section (only if gaps exist) ─────── */}
      {!loading && gaps.length > 0 && (
        <>
          {/* Summary card */}
          <Card>
            <CardContent className="py-6">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-3xl font-bold">{gaps.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Content-Gaps gefunden
                  </p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-xl font-semibold text-green-700">
                      {highCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Hoch</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold text-amber-700">
                      {mediumCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Mittel</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold text-gray-500">
                      {lowCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Niedrig</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Opportunity:
              </span>
              {["all", "high", "medium", "low"].map((level) => (
                <button
                  key={level}
                  onClick={() => setFilterOpportunity(level)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    filterOpportunity === level
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  )}
                >
                  {level === "all" ? "Alle" : OPPORTUNITY_LABELS[level]}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Status:
              </span>
              {["all", "open", "planned", "created", "dismissed"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      filterStatus === status
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    )}
                  >
                    {status === "all" ? "Alle" : STATUS_LABELS[status]}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Gap table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Keyword
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Suchvolumen
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Difficulty
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Competitor URL
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Domain
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                        Opportunity
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGaps.map((gap) => (
                      <tr
                        key={gap.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {gap.keyword}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatNumber(gap.searchVolume)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {gap.difficulty != null
                            ? Math.round(gap.difficulty)
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {gap.competitorUrl ? (
                            <a
                              href={gap.competitorUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate block max-w-[240px]"
                              title={gap.competitorUrl}
                            >
                              {gap.competitorUrl.replace(/^https?:\/\//, "").slice(0, 40)}
                              {gap.competitorUrl.replace(/^https?:\/\//, "").length > 40 ? "..." : ""}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {gap.competitorDomain || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {gap.opportunity && (
                            <Badge
                              className={cn(
                                "text-xs",
                                OPPORTUNITY_STYLES[gap.opportunity] ||
                                  OPPORTUNITY_STYLES.low
                              )}
                            >
                              {OPPORTUNITY_LABELS[gap.opportunity] || gap.opportunity}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                              STATUS_STYLES[gap.status] || STATUS_STYLES.open
                            )}
                          >
                            {STATUS_LABELS[gap.status] || gap.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {gap.status === "open" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateGapStatus(gap.id, "planned")
                                  }
                                >
                                  Artikel planen
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      `/content-writer?keyword=${encodeURIComponent(gap.keyword)}`
                                    )
                                  }
                                >
                                  Artikel erstellen
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() =>
                                    updateGapStatus(gap.id, "dismissed")
                                  }
                                >
                                  Verwerfen
                                </Button>
                              </>
                            )}
                            {gap.status === "planned" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/content-writer?keyword=${encodeURIComponent(gap.keyword)}`
                                  )
                                }
                              >
                                Artikel erstellen
                              </Button>
                            )}
                            {gap.status === "dismissed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateGapStatus(gap.id, "open")
                                }
                              >
                                Wiederherstellen
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredGaps.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-12 text-center text-muted-foreground"
                        >
                          Keine Content-Gaps fuer die gewaehlten Filter gefunden.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Monthly screening info */}
          {nextAnalysisDate && (
            <p className="text-sm text-muted-foreground text-center">
              Naechste automatische Analyse: {formatDate(nextAnalysisDate)}
            </p>
          )}
        </>
      )}

      {/* ── Empty state (no gaps, no loading) ────────── */}
      {!loading && gaps.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">
              Noch keine Content-Gap-Analyse durchgefuehrt
            </p>
            <p>
              Waehlen Sie Wettbewerber aus und starten Sie die Analyse, um
              fehlende Themen zu identifizieren.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
