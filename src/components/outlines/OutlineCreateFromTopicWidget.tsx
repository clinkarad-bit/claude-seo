"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Sparkles, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface Topic {
  id: string;
  title: string;
  topicCluster: { name: string; customer: { companyName: string } };
}

interface Props {
  topics: Topic[];
  preselectedTopicId?: string;
}

export function OutlineCreateFromTopicWidget({
  topics,
  preselectedTopicId,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(!!preselectedTopicId);
  const [loading, setLoading] = useState(false);
  const [topicId, setTopicId] = useState(preselectedTopicId ?? "");
  const [tfidfFile, setTfidfFile] = useState<File | null>(null);

  useEffect(() => {
    if (preselectedTopicId) {
      setTopicId(preselectedTopicId);
      setOpen(true);
    }
  }, [preselectedTopicId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) return;

    setLoading(true);
    try {
      let tfidfCsv: string | undefined;
      if (tfidfFile) {
        tfidfCsv = await tfidfFile.text();
      }

      const res = await fetch("/api/outlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, tfidfCsv }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Fehler beim Erstellen der Outline");
      }

      const outline = await res.json();
      toast({ title: "Outline erstellt" });
      setOpen(false);
      router.push(`/outlines/${outline.id}`);
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Outline erstellen
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              SEO-Outline erstellen
            </DialogTitle>
            <DialogDescription>
              Die KI generiert eine strukturierte Outline mit Keywords und Links
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Thema *</Label>
              <Select value={topicId} onValueChange={setTopicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Thema auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="flex flex-col">
                        <span>{t.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {t.topicCluster.customer.companyName} ·{" "}
                          {t.topicCluster.name}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {topics.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Alle Themen haben bereits eine Outline. Erstelle zuerst neue
                  Themen in der Themenrecherche.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>TF*IDF Daten (CSV, optional)</Label>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Upload className="h-4 w-4" />
                {tfidfFile ? tfidfFile.name : "CSV hochladen (term, score)"}
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setTfidfFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Exportiere TF*IDF-Daten aus deinem SEO-Tool als CSV
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={!topicId || loading}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Outline wird erstellt...
                  </>
                ) : (
                  <>
                    <Sparkles /> Outline generieren
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
