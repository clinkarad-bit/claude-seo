"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Globe, Trash2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCustomer } from "@/components/providers/CustomerProvider";
import { cn, formatDate, formatNumber } from "@/lib/utils";

interface CompetitorItem {
  id: string;
  domain: string;
  domainRating: number | null;
  totalBacklinks: number | null;
  organicTraffic: number | null;
  isAISuggested: boolean;
  isManuallyAdded: boolean;
  isActive: boolean;
  lastScreenedAt: string | null;
  createdAt: string;
}

export default function WettbewerberPage() {
  const router = useRouter();
  const { activeCustomer } = useCustomer();
  const [competitors, setCompetitors] = useState<CompetitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [creating, setCreating] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchCompetitors = useCallback(async () => {
    if (!activeCustomer) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/competitors?customerId=${activeCustomer.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setCompetitors(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeCustomer]);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  async function handleCreate() {
    if (!activeCustomer || !domain.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: activeCustomer.id,
          domain: domain.trim().replace(/^https?:\/\//, "").replace(/\/+$/, ""),
        }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setDomain("");
        fetchCompetitors();
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function handleRemove(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setRemovingId(id);
    try {
      await fetch(`/api/competitors/${id}`, { method: "DELETE" });
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    } finally {
      setRemovingId(null);
    }
  }

  if (!activeCustomer) {
    return (
      <div className="p-8">
        <PageHeader
          title="Wettbewerber"
          description="Wettbewerbsanalyse und Monitoring"
        />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Bitte wählen Sie zuerst einen Kunden aus.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Wettbewerber"
        description="Wettbewerbsanalyse und Monitoring"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Wettbewerber hinzufügen
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-40 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : competitors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Globe className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p className="text-lg font-medium">Keine Wettbewerber vorhanden</p>
            <p className="mt-1 text-sm">
              Fügen Sie Wettbewerber hinzu, um deren SEO-Strategie zu
              analysieren.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {competitors.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/wettbewerber/${c.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{c.domain}</CardTitle>
                  <div className="flex items-center gap-1">
                    {c.isAISuggested && (
                      <Badge
                        variant="secondary"
                        className="bg-violet-100 text-violet-700"
                      >
                        <Sparkles className="mr-1 h-3 w-3" />
                        KI-Vorschlag
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleRemove(c.id, e)}
                      disabled={removingId === c.id}
                    >
                      {removingId === c.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <MetricItem
                    label="Domain Rating"
                    value={c.domainRating != null ? c.domainRating.toFixed(1) : "--"}
                    color="text-blue-600"
                  />
                  <MetricItem
                    label="Backlinks"
                    value={
                      c.totalBacklinks != null
                        ? formatNumber(c.totalBacklinks)
                        : "--"
                    }
                    color="text-amber-600"
                  />
                  <MetricItem
                    label="Traffic"
                    value={
                      c.organicTraffic != null
                        ? formatNumber(c.organicTraffic)
                        : "--"
                    }
                    color="text-green-600"
                  />
                </div>
                {c.lastScreenedAt && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Zuletzt analysiert: {formatDate(c.lastScreenedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Competitor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wettbewerber hinzufügen</DialogTitle>
            <DialogDescription>
              Geben Sie die Domain des Wettbewerbers ein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="z.B. check24.de"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={creating}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!domain.trim() || creating}
            >
              {creating ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold", color)}>{value}</p>
    </div>
  );
}
