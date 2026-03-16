"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowUpRight,
  ExternalLink,
  Loader2,
  RefreshCw,
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
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  domain: string;
}

interface Backlink {
  id: string;
  sourceUrl: string;
  sourceDomain: string;
  targetUrl: string;
  anchorText: string | null;
  linkType: string;
  category: string | null;
  domainRating: number | null;
  firstSeen: string;
}

interface BacklinkStats {
  total: number;
  dofollow: number;
  nofollow: number;
  avgDR: number;
}

export default function BacklinksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [stats, setStats] = useState<BacklinkStats>({
    total: 0,
    dofollow: 0,
    nofollow: 0,
    avgDR: 0,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetch("/api/lb/projects")
      .then((res) => res.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }, []);

  const loadBacklinks = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lb/projects/${projectId}/backlinks`);
      if (!res.ok) throw new Error();
      const data: Backlink[] = await res.json();
      setBacklinks(data);

      const dofollow = data.filter((b) => b.linkType === "dofollow").length;
      const nofollow = data.length - dofollow;
      const drValues = data
        .map((b) => b.domainRating)
        .filter((v): v is number => v !== null);
      const avgDR =
        drValues.length > 0
          ? Math.round(drValues.reduce((a, b) => a + b, 0) / drValues.length)
          : 0;

      setStats({ total: data.length, dofollow, nofollow, avgDR });
    } catch {
      setBacklinks([]);
      setStats({ total: 0, dofollow: 0, nofollow: 0, avgDR: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    loadBacklinks(value);
  };

  const handleFetchBacklinks = async () => {
    if (!selectedProjectId) return;
    setFetching(true);
    try {
      const res = await fetch(
        `/api/lb/projects/${selectedProjectId}/backlinks/fetch`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error();
      toast({
        title: "Backlinks abgerufen",
        description: "Die Backlinks wurden aktualisiert.",
      });
      await loadBacklinks(selectedProjectId);
    } catch {
      toast({
        title: "Fehler",
        description: "Backlinks konnten nicht abgerufen werden.",
        variant: "destructive",
      });
    } finally {
      setFetching(false);
    }
  };

  const summaryCards = [
    { label: "Gesamt", value: stats.total },
    { label: "Dofollow", value: stats.dofollow },
    { label: "Nofollow", value: stats.nofollow },
    { label: "Ø DR", value: stats.avgDR },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backlinks"
        description="Backlink-Profil deiner Projekte analysieren und verwalten"
      />

      {/* Project Selector */}
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
            onClick={handleFetchBacklinks}
            disabled={fetching}
          >
            {fetching ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Backlinks abrufen
          </Button>
        )}
      </div>

      {!selectedProjectId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ArrowUpRight className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 font-semibold">Projekt auswählen</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Wähle ein Projekt aus, um die Backlinks zu sehen.
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.label}>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Backlinks Table */}
          {backlinks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <ArrowUpRight className="h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 font-semibold">Keine Backlinks</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Klicke auf &quot;Backlinks abrufen&quot;, um Backlinks zu laden.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">
                          Quell-URL
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Anchor
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Typ
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Kategorie
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          DR
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Entdeckt
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {backlinks.map((bl) => (
                        <tr key={bl.id} className="border-b last:border-0">
                          <td className="max-w-xs truncate px-4 py-3">
                            <a
                              href={bl.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              {bl.sourceDomain}
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                            {bl.anchorText || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                                bl.linkType === "dofollow"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              )}
                            >
                              {bl.linkType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {bl.category || "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {bl.domainRating != null
                              ? bl.domainRating.toFixed(0)
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(bl.firstSeen).toLocaleDateString("de-DE")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
