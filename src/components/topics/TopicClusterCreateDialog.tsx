"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface Customer {
  id: string;
  companyName: string;
}

interface Props {
  customers: Customer[];
  preselectedCustomerId?: string;
}

export function TopicClusterCreateDialog({
  customers,
  preselectedCustomerId,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerId: preselectedCustomerId ?? "",
    name: "",
    keywordList: "",
    exampleConversion: "Produkt kaufen, Preisvergleich, Testsieger",
    exampleProduktnah: "Produktart erklärt, Vergleich Modelle",
    exampleEnger: "Ratgeber zum direkten Thema",
    exampleFerner: "Allgemeine Themen rund um das Interessensfeld",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || !form.name) return;

    setLoading(true);
    try {
      const res = await fetch("/api/topic-clusters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Fehler beim Erstellen");

      const cluster = await res.json();
      toast({
        title: "Themencluster erstellt",
        description: `${cluster._count?.topics ?? 0} Themen wurden generiert`,
      });
      setOpen(false);
      router.push(`/themenrecherche/${cluster.id}`);
    } catch {
      toast({
        title: "Fehler",
        description: "Themencluster konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Themencluster erstellen
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Neues Themencluster
            </DialogTitle>
            <DialogDescription>
              Die KI generiert automatisch 60 Themenvorschläge in 4 Kategorien
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kunde *</Label>
                <Select
                  value={form.customerId}
                  onValueChange={(v) => setForm({ ...form, customerId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kunde auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Themencluster *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="z.B. Hundgesundheit"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywordList">Keywords für Recherche</Label>
              <Input
                id="keywordList"
                value={form.keywordList}
                onChange={(e) =>
                  setForm({ ...form, keywordList: e.target.value })
                }
                placeholder="hund humpelt, hund lahmt, hund schmerzen, ..."
              />
              <p className="text-xs text-muted-foreground">
                Kommaseparierte Keywords als Basis für die KI-Recherche
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">
                Beispiele pro Kategorie (für bessere KI-Ergebnisse)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    key: "exampleConversion" as const,
                    label: "Conversionnahe Themen",
                  },
                  {
                    key: "exampleProduktnah" as const,
                    label: "Produktnahe Themen",
                  },
                  {
                    key: "exampleEnger" as const,
                    label: "Enger Themenbezug",
                  },
                  {
                    key: "exampleFerner" as const,
                    label: "Ferner Themenbezug",
                  },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                      className="text-xs"
                      placeholder="Beispielthema..."
                    />
                  </div>
                ))}
              </div>
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
              <Button
                type="submit"
                disabled={!form.customerId || !form.name || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    KI generiert Themen...
                  </>
                ) : (
                  <>
                    <Sparkles /> Themen generieren
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
