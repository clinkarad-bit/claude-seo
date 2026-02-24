"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Upload } from "lucide-react";
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
import { toast } from "@/components/ui/use-toast";

export function CustomerCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    description: "",
    domain: "",
  });
  const [guidelinesFile, setGuidelinesFile] = useState<File | null>(null);
  const [exampleFile, setExampleFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("companyName", form.companyName);
      formData.append("description", form.description);
      if (form.domain) formData.append("domain", form.domain);
      if (guidelinesFile) formData.append("guidelinesPdf", guidelinesFile);
      if (exampleFile) formData.append("exampleTextPdf", exampleFile);

      const res = await fetch("/api/customers", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Fehler beim Anlegen des Kunden");

      toast({ title: "Kunde angelegt", description: form.companyName });
      setOpen(false);
      setForm({ companyName: "", description: "", domain: "" });
      setGuidelinesFile(null);
      setExampleFile(null);
      router.refresh();
    } catch {
      toast({
        title: "Fehler",
        description: "Kunde konnte nicht angelegt werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Kunde anlegen
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neuen Kunden anlegen</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Firmenname *</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) =>
                  setForm({ ...form, companyName: e.target.value })
                }
                placeholder="z.B. Tiergesundheit GmbH"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Kurzbeschreibung *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Was macht das Unternehmen? Zielgruppe? Hauptprodukte?"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain / URL</Label>
              <Input
                id="domain"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                placeholder="https://example.com"
                type="url"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Guidelines (PDF)</Label>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                  <Upload className="h-4 w-4" />
                  {guidelinesFile ? guidelinesFile.name : "PDF hochladen"}
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) =>
                      setGuidelinesFile(e.target.files?.[0] ?? null)
                    }
                  />
                </label>
              </div>

              <div className="space-y-2">
                <Label>Beispieltext (PDF)</Label>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                  <Upload className="h-4 w-4" />
                  {exampleFile ? exampleFile.name : "PDF hochladen"}
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) =>
                      setExampleFile(e.target.files?.[0] ?? null)
                    }
                  />
                </label>
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
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="animate-spin" />}
                Kunde anlegen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
