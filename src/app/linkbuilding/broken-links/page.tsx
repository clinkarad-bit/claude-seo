"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Link as LinkIcon,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertTriangle,
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

interface BrokenLink {
  id: string;
  sourceUrl: string;
  sourceDomain: string;
  brokenUrl: string;
  anchorText: string | null;
  httpStatus: number | null;
  domainRating: number | null;
  topicRelevance: number | null;
  suggestedUrl: string | null;
  status: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "found", label: "Gefunden", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "contacted", label: "Kontaktiert", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "replaced", label: "Ersetzt", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "ignored", label: "Ignoriert", color: "bg-gray-100 text-gray-700 border-gray-200" },
];

export default function BrokenLinksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [brokenLinks, setBrokenLinks] = useState<BrokenLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetch("/api/lb/projects")
      .then((res) => res.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }, []);

  const loadBrokenLinks = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lb/projects/${projectId}/broken-links`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBrokenLinks(data.brokenLinks ?? []);
    } catch {
      setBrokenLinks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    loadBrokenLinks(value);
  };

  const handleFetchBrokenLinks = async () => {
    if (!selectedProjectId) return;
    setFetching(true);
    try {
      const res = await fetch(
        `/api/lb/projects/${selectedProjectId}/broken-links/fetch`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast({
        title: "Broken Links geprüft",
        description: `${data.found} kaputte Links gefunden.`,
      });
      await loadBrokenLinks(selectedProjectId);
    } catch {
      toast({
        title: "Fehler",
        description: "Broken Links konnten nicht geprüft werden.",
        variant: "destructive",
      });
    } finally {
      setFetching(false);
    }
  };

  const handleStatusChange = async (brokenLinkId: string, status: string) => {
    try {
      const res = await fetch(
        `/api/lb/projects/${selectedProjectId}/broken-links`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brokenLinkId, status }),
        }
      );
      if (!res.ok) throw new Error();
      setBrokenLinks((prev) =>
        prev.map((bl) => (bl.id === brokenLinkId ? { ...bl, status } : bl))
      );
    } catch {
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const filtered =
    filterStatus === "all"
      ? brokenLinks
      : brokenLinks.filter((bl) => bl.status === filterStatus);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broken Link Building"
        description="Finde kaputte Links und schlage deinen Content als Ersatz vor"
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
            onClick={handleFetchBrokenLinks}
            disabled={fetching}
          >
            {fetching ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Broken Links prüfen
          </Button>
        )}
      </div>

      {!selectedProjectId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <LinkIcon className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 font-semibold">Projekt auswählen</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Wähle ein Projekt, um kaputte Links zu finden.
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Gesamt</p>
                <p className="text-2xl font-bold">{brokenLinks.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Offen</p>
                <p className="text-2xl font-bold text-primary">
                  {brokenLinks.filter((bl) => bl.status === "found").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Kontaktiert</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {brokenLinks.filter((bl) => bl.status === "contacted").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Ersetzt</p>
                <p className="text-2xl font-bold text-green-600">
                  {brokenLinks.filter((bl) => bl.status === "replaced").length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {[
              { value: "all", label: "Alle" },
              ...STATUS_OPTIONS,
            ].map((opt) => (
              <Button
                key={opt.value}
                variant={filterStatus === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {/* Broken Links Table */}
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <LinkIcon className="h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 font-semibold">Keine Broken Links</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Klicke auf &quot;Broken Links prüfen&quot;, um kaputte Links zu finden.
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
                        <th className="px-4 py-3 text-left font-medium">Quell-Domain</th>
                        <th className="px-4 py-3 text-left font-medium">Broken URL</th>
                        <th className="px-4 py-3 text-left font-medium">Anchor</th>
                        <th className="px-4 py-3 text-center font-medium">HTTP</th>
                        <th className="px-4 py-3 text-right font-medium">DR</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((bl) => (
                        <tr key={bl.id} className="border-b last:border-0">
                          <td className="px-4 py-3">
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
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0 text-red-400" />
                              {bl.brokenUrl}
                            </span>
                          </td>
                          <td className="max-w-[150px] truncate px-4 py-3 text-muted-foreground">
                            {bl.anchorText || "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="destructive" className="text-xs">
                              {bl.httpStatus ?? "?"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {bl.domainRating != null ? bl.domainRating.toFixed(0) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={bl.status}
                              onValueChange={(v) => handleStatusChange(bl.id, v)}
                            >
                              <SelectTrigger className="h-8 w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
