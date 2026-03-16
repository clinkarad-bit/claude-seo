"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

export function ProjectCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({
    name: "",
    domain: "",
    url: "",
    brandKeywords: "",
    customerId: "",
  });

  useEffect(() => {
    if (open) {
      fetch("/api/customers")
        .then((res) => res.json())
        .then((data) => setCustomers(data))
        .catch(() => setCustomers([]));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/lb/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          domain: form.domain,
          url: form.url,
          brandKeywords: form.brandKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          customerId: form.customerId || undefined,
        }),
      });

      if (!res.ok) throw new Error("Fehler beim Anlegen des Projekts");

      toast({ title: "Projekt angelegt", description: form.name });
      setOpen(false);
      setForm({ name: "", domain: "", url: "", brandKeywords: "", customerId: "" });
      router.refresh();
    } catch {
      toast({
        title: "Fehler",
        description: "Projekt konnte nicht angelegt werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Neues Projekt
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neues Linkbuilding-Projekt</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lb-name">Projektname *</Label>
              <Input
                id="lb-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="z.B. Linkbuilding Kampagne Q1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lb-domain">Domain *</Label>
                <Input
                  id="lb-domain"
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  placeholder="example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lb-url">URL *</Label>
                <Input
                  id="lb-url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://example.com"
                  type="url"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lb-keywords">Brand Keywords</Label>
              <Textarea
                id="lb-keywords"
                value={form.brandKeywords}
                onChange={(e) =>
                  setForm({ ...form, brandKeywords: e.target.value })
                }
                placeholder="Kommagetrennt, z.B. Marke, Brand Name, brand.com"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Kunde (optional)</Label>
              <Select
                value={form.customerId}
                onValueChange={(value) =>
                  setForm({ ...form, customerId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kunde auswählen..." />
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="animate-spin" />}
                Projekt anlegen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
