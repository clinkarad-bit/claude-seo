"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AtSign,
  ExternalLink,
  Loader2,
  RefreshCw,
  Link as LinkIcon,
  Link2Off,
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

interface Mention {
  id: string;
  sourceUrl: string;
  sourceDomain: string;
  title: string | null;
  snippet: string | null;
  hasLink: boolean;
  mentionDate: string | null;
  status: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "Neu", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "contacted", label: "Kontaktiert", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "converted", label: "Umgewandelt", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "ignored", label: "Ignoriert", color: "bg-gray-100 text-gray-700 border-gray-200" },
];

export default function MentionsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetch("/api/lb/projects")
      .then((res) => res.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }, []);

  const loadMentions = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lb/projects/${projectId}/mentions`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMentions(data.mentions ?? []);
    } catch {
      setMentions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    loadMentions(value);
  };

  const handleFetchMentions = async () => {
    if (!selectedProjectId) return;
    setFetching(true);
    try {
      const res = await fetch(
        `/api/lb/projects/${selectedProjectId}/mentions/fetch`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast({
        title: "Mentions abgerufen",
        description: `${data.found} Erwähnungen gefunden.`,
      });
      await loadMentions(selectedProjectId);
    } catch {
      toast({
        title: "Fehler",
        description: "Mentions konnten nicht abgerufen werden.",
        variant: "destructive",
      });
    } finally {
      setFetching(false);
    }
  };

  const handleStatusChange = async (mentionId: string, status: string) => {
    try {
      const res = await fetch(
        `/api/lb/projects/${selectedProjectId}/mentions`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mentionId, status }),
        }
      );
      if (!res.ok) throw new Error();
      setMentions((prev) =>
        prev.map((m) => (m.id === mentionId ? { ...m, status } : m))
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
      ? mentions
      : mentions.filter((m) => m.status === filterStatus);

  const withLink = mentions.filter((m) => m.hasLink).length;
  const withoutLink = mentions.length - withLink;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Mentions"
        description="Finde Erwähnungen deiner Marke und wandle sie in Backlinks um"
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
            onClick={handleFetchMentions}
            disabled={fetching}
          >
            {fetching ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Mentions suchen
          </Button>
        )}
      </div>

      {!selectedProjectId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AtSign className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 font-semibold">Projekt auswählen</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Wähle ein Projekt, um Brand Mentions zu durchsuchen.
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
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Gesamt</p>
                <p className="text-2xl font-bold">{mentions.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Mit Link</p>
                <p className="text-2xl font-bold text-green-600">{withLink}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Ohne Link</p>
                <p className="text-2xl font-bold text-primary">{withoutLink}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Neu</p>
                <p className="text-2xl font-bold">
                  {mentions.filter((m) => m.status === "new").length}
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

          {/* Mentions List */}
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <AtSign className="h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 font-semibold">Keine Mentions</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Klicke auf &quot;Mentions suchen&quot;, um Erwähnungen zu finden.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((mention) => {
                const statusInfo = STATUS_OPTIONS.find((s) => s.value === mention.status);
                return (
                  <Card key={mention.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <a
                              href={mention.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline"
                            >
                              {mention.title ?? mention.sourceDomain}
                              <ExternalLink className="ml-1 inline h-3 w-3" />
                            </a>
                            {mention.hasLink ? (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                <LinkIcon className="mr-1 h-3 w-3" />
                                Verlinkt
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                <Link2Off className="mr-1 h-3 w-3" />
                                Ohne Link
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {mention.sourceDomain}
                          </p>
                          {mention.snippet && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {mention.snippet}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={mention.status}
                            onValueChange={(v) => handleStatusChange(mention.id, v)}
                          >
                            <SelectTrigger className="w-[140px]">
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
