"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GitCompare,
  ExternalLink,
  Loader2,
  RefreshCw,
  Plus,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface Project {
  id: string;
  name: string;
  domain: string;
}

interface Competitor {
  id: string;
  domain: string;
  domainRating: number | null;
  totalBacklinks: number | null;
  isAISuggested: boolean;
  gapData: string | null;
}

interface GapResult {
  domain: string;
  targetHasLink: boolean;
  competitors: Array<{ domain: string; hasLink: boolean }>;
  domainAuthority: number;
  totalBacklinks: number;
}

export default function GapAnalysePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [gaps, setGaps] = useState<GapResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/lb/projects")
      .then((res) => res.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }, []);

  const loadCompetitors = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lb/projects/${projectId}/gap-analyse`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompetitors(data.competitors ?? []);
    } catch {
      setCompetitors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    setGaps([]);
    loadCompetitors(value);
  };

  const handleAddCompetitor = async () => {
    if (!newDomain.trim() || !selectedProjectId) return;
    setAdding(true);
    try {
      const res = await fetch(
        `/api/lb/projects/${selectedProjectId}/gap-analyse`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: newDomain.trim() }),
        }
      );
      if (!res.ok) throw new Error();
      setNewDomain("");
      toast({ title: "Wettbewerber hinzugefügt" });
      await loadCompetitors(selectedProjectId);
    } catch {
      toast({
        title: "Fehler",
        description: "Wettbewerber konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleFetchGaps = async () => {
    if (!selectedProjectId) return;
    setFetching(true);
    try {
      const res = await fetch(
        `/api/lb/projects/${selectedProjectId}/gap-analyse/fetch`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGaps(data.gaps ?? []);
      toast({
        title: "Gap-Analyse abgeschlossen",
        description: `${data.gaps?.length ?? 0} Domains geprüft.`,
      });
      await loadCompetitors(selectedProjectId);
    } catch {
      toast({
        title: "Fehler",
        description: "Gap-Analyse fehlgeschlagen.",
        variant: "destructive",
      });
    } finally {
      setFetching(false);
    }
  };

  const opportunities = gaps.filter(
    (g) => !g.targetHasLink && g.competitors.some((c) => c.hasLink)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backlink Gap-Analyse"
        description="Finde Domains, die auf deine Wettbewerber verlinken, aber nicht auf dich"
      />

      <div className="flex items-center gap-4">
        <div className="w-80">
          <Select value={selectedProjectId} onValueChange={handleProjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Projekt auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.domain})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedProjectId && (
          <Button
            variant="outline"
            onClick={handleFetchGaps}
            disabled={fetching}
          >
            {fetching ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Gap-Analyse starten
          </Button>
        )}
      </div>

      {!selectedProjectId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GitCompare className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 font-semibold">Projekt auswählen</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Wähle ein Projekt, um die Gap-Analyse zu starten.
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Competitors */}
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 font-semibold">Wettbewerber</h3>
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="Domain eingeben (z.B. example.de)"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCompetitor();
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleAddCompetitor}
                  disabled={adding || !newDomain.trim()}
                >
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Hinzufügen
                </Button>
              </div>

              {competitors.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Keine Wettbewerber. Füge manuell welche hinzu oder starte die
                  Gap-Analyse für KI-Vorschläge.
                </p>
              ) : (
                <div className="space-y-2">
                  {competitors.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between rounded-lg border px-4 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{comp.domain}</span>
                        {comp.isAISuggested && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="mr-1 h-3 w-3" />
                            KI-Vorschlag
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {comp.domainRating != null && (
                          <span>DR {comp.domainRating.toFixed(0)}</span>
                        )}
                        {comp.totalBacklinks != null && (
                          <span>{comp.totalBacklinks.toLocaleString()} BL</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gap Results */}
          {gaps.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">Geprüfte Domains</p>
                    <p className="text-2xl font-bold">{gaps.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">Opportunities</p>
                    <p className="text-2xl font-bold text-primary">
                      {opportunities.length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">Ø DA</p>
                    <p className="text-2xl font-bold">
                      {gaps.length > 0
                        ? Math.round(
                            gaps.reduce((a, g) => a + g.domainAuthority, 0) / gaps.length
                          )
                        : 0}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left font-medium">Domain</th>
                          <th className="px-4 py-3 text-center font-medium">Du</th>
                          {competitors.slice(0, 5).map((comp) => (
                            <th key={comp.id} className="px-4 py-3 text-center font-medium">
                              {comp.domain.length > 15
                                ? comp.domain.slice(0, 12) + "..."
                                : comp.domain}
                            </th>
                          ))}
                          <th className="px-4 py-3 text-right font-medium">DA</th>
                          <th className="px-4 py-3 text-right font-medium">BL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {opportunities.map((gap, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="px-4 py-3">
                              <a
                                href={`https://${gap.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                {gap.domain}
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <X className="mx-auto h-4 w-4 text-red-400" />
                            </td>
                            {competitors.slice(0, 5).map((comp) => {
                              const cGap = gap.competitors.find(
                                (c) => c.domain === comp.domain
                              );
                              return (
                                <td key={comp.id} className="px-4 py-3 text-center">
                                  {cGap?.hasLink ? (
                                    <Check className="mx-auto h-4 w-4 text-green-500" />
                                  ) : (
                                    <X className="mx-auto h-4 w-4 text-muted-foreground/30" />
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-right font-medium">
                              {gap.domainAuthority}
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground">
                              {gap.totalBacklinks.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
