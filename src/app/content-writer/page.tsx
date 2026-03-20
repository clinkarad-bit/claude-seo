"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatDate } from "@/lib/utils";

interface Article {
  id: string;
  keyword: string;
  status: string;
  title: string | null;
  metaDescription: string | null;
  wordCount: number | null;
  createdAt: string;
  customer: { companyName: string };
}

interface Customer {
  id: string;
  companyName: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  outline: { label: "Outline", className: "bg-blue-100 text-blue-800" },
  outline_approved: { label: "Outline OK", className: "bg-indigo-100 text-indigo-800" },
  writing: { label: "Generierung...", className: "bg-yellow-100 text-yellow-800" },
  draft: { label: "Entwurf", className: "bg-gray-100 text-gray-700" },
  review: { label: "Review", className: "bg-orange-100 text-orange-800" },
  approved: { label: "Freigegeben", className: "bg-green-100 text-green-800" },
  published: { label: "Veröffentlicht", className: "bg-pink-100 text-pink-800" },
  refresh: { label: "Refresh nötig", className: "bg-red-100 text-red-800" },
};

const FILTER_TABS = [
  { value: "alle", label: "Alle" },
  { value: "outline", label: "Outline" },
  { value: "draft", label: "Entwurf" },
  { value: "review", label: "Review" },
  { value: "approved", label: "Freigegeben" },
  { value: "published", label: "Veröffentlicht" },
];

export default function ContentWriterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [articles, setArticles] = useState<Article[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("alle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [newKeyword, setNewKeyword] = useState(searchParams.get("keyword") || "");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const loadArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/articles");
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch {
      toast({ title: "Fehler beim Laden der Artikel", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
        if (data.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(data[0].id);
        }
      }
    } catch {
      // silent
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    loadArticles();
    loadCustomers();
  }, [loadArticles, loadCustomers]);

  const filteredArticles = articles.filter((a) => {
    if (filter === "alle") return true;
    if (filter === "outline") return a.status === "outline" || a.status === "outline_approved";
    return a.status === filter;
  });

  async function handleCreate() {
    if (!newKeyword.trim() || !selectedCustomerId) {
      toast({ title: "Bitte Keyword und Kunde auswählen", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKeyword.trim(), customerId: selectedCustomerId }),
      });

      if (res.ok) {
        const article = await res.json();
        toast({ title: "Artikel erstellt" });
        setDialogOpen(false);
        setNewKeyword("");
        router.push(`/content-writer/${article.id}`);
      } else {
        const err = await res.json();
        toast({ title: err.error || "Fehler beim Erstellen", variant: "destructive" });
      }
    } catch {
      toast({ title: "Fehler beim Erstellen", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content-Writer</h1>
          <p className="text-muted-foreground mt-1">
            Artikel erstellen und verwalten
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>+ Neuer Artikel</Button>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          {FILTER_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {tab.value !== "alle" && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {articles.filter((a) => {
                    if (tab.value === "outline") return a.status === "outline" || a.status === "outline_approved";
                    return a.status === tab.value;
                  }).length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Content area for all tabs is the same filtered list */}
        {FILTER_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {/* Rendered below outside tabs */}
          </TabsContent>
        ))}
      </Tabs>

      {/* Article List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p className="text-lg">Keine Artikel gefunden</p>
            <p className="text-sm mt-1">
              Erstellen Sie einen neuen Artikel mit dem Button oben rechts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredArticles.map((article) => {
            const statusInfo = STATUS_CONFIG[article.status] || {
              label: article.status,
              className: "bg-gray-100 text-gray-700",
            };
            return (
              <Card
                key={article.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/content-writer/${article.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold truncate">
                          {article.title || article.keyword}
                        </h3>
                        <Badge
                          className={cn(
                            "shrink-0 text-xs font-medium",
                            statusInfo.className
                          )}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{article.customer.companyName}</span>
                        <span className="text-xs">|</span>
                        <span>Keyword: {article.keyword}</span>
                        {article.wordCount && (
                          <>
                            <span className="text-xs">|</span>
                            <span>{article.wordCount} Wörter</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0">
                      {formatDate(article.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Artikel erstellen</DialogTitle>
            <DialogDescription>
              Geben Sie ein Keyword ein und wählen Sie den Kunden aus.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="keyword">Keyword *</Label>
              <Input
                id="keyword"
                placeholder="z.B. Hund humpelt"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer">Kunde *</Label>
              <select
                id="customer"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Kunde auswählen...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Erstelle..." : "Artikel erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
