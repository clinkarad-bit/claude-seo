"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Loader2, MapPin, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useCustomer } from "@/components/providers/CustomerProvider";
import { cn, formatDate, formatNumber } from "@/lib/utils";

interface KeywordMapItem {
  id: string;
  name: string;
  seedKeywords: string;
  status: string;
  totalKeywords: number;
  coveredKeywords: number;
  coverageScore: number;
  createdAt: string;
  customer: { companyName: string };
  _count: { hubs: number };
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  generating: { label: "Generierung...", variant: "warning" },
  ready: { label: "Bereit", variant: "success" },
  error: { label: "Fehler", variant: "destructive" },
};

export default function KeywordsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeCustomer } = useCustomer();

  const [maps, setMaps] = useState<KeywordMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSeeds, setFormSeeds] = useState("");

  const fetchMaps = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeCustomer ? `?customerId=${activeCustomer.id}` : "";
      const res = await fetch(`/api/keywords${params}`);
      if (res.ok) {
        const data = await res.json();
        setMaps(data);
      }
    } catch {
      toast({ title: "Fehler", description: "Keyword-Maps konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [activeCustomer, toast]);

  useEffect(() => {
    fetchMaps();
  }, [fetchMaps]);

  async function handleCreate() {
    if (!formName.trim()) {
      toast({ title: "Fehler", description: "Bitte geben Sie einen Namen ein.", variant: "destructive" });
      return;
    }
    if (!activeCustomer) {
      toast({ title: "Fehler", description: "Bitte wählen Sie zuerst einen Kunden aus.", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          customerId: activeCustomer.id,
          seedKeywords: formSeeds.trim(),
        }),
      });

      if (res.ok) {
        toast({ title: "Erstellt", description: "Keyword-Map wurde erfolgreich generiert." });
        setDialogOpen(false);
        setFormName("");
        setFormSeeds("");
        fetchMaps();
      } else {
        const err = await res.json();
        toast({ title: "Fehler", description: err.error?.toString() || "Erstellung fehlgeschlagen.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Fehler", description: "Netzwerkfehler beim Erstellen.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  function getCoverageColor(score: number) {
    if (score >= 60) return "text-green-600";
    if (score >= 30) return "text-amber-600";
    return "text-red-600";
  }

  function getProgressColor(score: number) {
    if (score >= 60) return "[&>div]:bg-green-500";
    if (score >= 30) return "[&>div]:bg-amber-500";
    return "[&>div]:bg-red-500";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Keywords"
        description="Keyword-Maps und Themen-Cluster"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Neue Keyword-Map
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neue Keyword-Map erstellen</DialogTitle>
                <DialogDescription>
                  Generieren Sie eine Keyword-Map mit Themen-Hubs und Keyword-Vorschlägen.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="map-name">Name</Label>
                  <Input
                    id="map-name"
                    placeholder="z.B. SEO Strategie Q1 2026"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                {activeCustomer && (
                  <div className="space-y-2">
                    <Label>Kunde</Label>
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-muted/50">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {activeCustomer.companyName}
                    </div>
                  </div>
                )}
                {!activeCustomer && (
                  <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    Bitte wählen Sie zuerst einen Kunden in der Sidebar aus.
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="seed-keywords">Seed-Keywords</Label>
                  <Textarea
                    id="seed-keywords"
                    placeholder="seo optimierung, content marketing, keyword recherche..."
                    value={formSeeds}
                    onChange={(e) => setFormSeeds(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Kommagetrennte Keywords als Ausgangsbasis für die Recherche.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreate} disabled={creating || !activeCustomer}>
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {creating ? "Generiere..." : "Erstellen"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : maps.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Keine Keyword-Maps vorhanden</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Erstellen Sie Ihre erste Keyword-Map, um mit der Recherche zu beginnen.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Erste Keyword-Map erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {maps.map((map) => {
            const status = STATUS_CONFIG[map.status] || STATUS_CONFIG.ready;
            const uncovered = map.totalKeywords - map.coveredKeywords;

            return (
              <Card
                key={map.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
                onClick={() => router.push(`/keywords/${map.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold leading-snug">
                      {map.name}
                    </CardTitle>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{map.customer.companyName}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Keywords</span>
                    <span className="font-medium">{formatNumber(map.totalKeywords)}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Abdeckung</span>
                      <span className={cn("font-semibold", getCoverageColor(map.coverageScore))}>
                        {map.coverageScore}%
                      </span>
                    </div>
                    <Progress
                      value={map.coverageScore}
                      className={cn("h-2", getProgressColor(map.coverageScore))}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                      {map.coveredKeywords} abgedeckt
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                      {uncovered} offen
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <span>{map._count.hubs} Hubs</span>
                    <span>{formatDate(map.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
