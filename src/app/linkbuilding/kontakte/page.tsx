"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Contact,
  ExternalLink,
  Loader2,
  RefreshCw,
  Download,
  Mail,
  Phone,
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

interface Project {
  id: string;
  name: string;
  domain: string;
}

interface ContactEntry {
  id: string;
  domain: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  source: string | null;
  outreachStatus: string;
  notes: string | null;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "Neu" },
  { value: "contacted", label: "Kontaktiert" },
  { value: "replied", label: "Geantwortet" },
  { value: "converted", label: "Konvertiert" },
  { value: "ignored", label: "Ignoriert" },
];

export default function KontaktePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetch("/api/lb/projects")
      .then((res) => res.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }, []);

  const loadContacts = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lb/projects/${projectId}/contacts`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setContacts(data.contacts ?? []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    loadContacts(value);
  };

  const handleFetchContacts = async () => {
    if (!selectedProjectId) return;
    setFetching(true);
    try {
      const res = await fetch(
        `/api/lb/projects/${selectedProjectId}/contacts/fetch`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast({
        title: "Kontakte gesucht",
        description: `${data.created} Kontakte von ${data.domains} Domains gefunden.`,
      });
      await loadContacts(selectedProjectId);
    } catch {
      toast({
        title: "Fehler",
        description: "Kontakte konnten nicht abgerufen werden.",
        variant: "destructive",
      });
    } finally {
      setFetching(false);
    }
  };

  const handleStatusChange = async (contactId: string, outreachStatus: string) => {
    try {
      const res = await fetch(
        `/api/lb/projects/${selectedProjectId}/contacts`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId, outreachStatus }),
        }
      );
      if (!res.ok) throw new Error();
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, outreachStatus } : c))
      );
    } catch {
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleExport = (format: "csv" | "vcf") => {
    if (!selectedProjectId) return;
    window.open(
      `/api/lb/projects/${selectedProjectId}/contacts/export?format=${format}`,
      "_blank"
    );
  };

  const filtered =
    filterStatus === "all"
      ? contacts
      : contacts.filter((c) => c.outreachStatus === filterStatus);

  const uniqueDomains = new Set(contacts.map((c) => c.domain)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kontaktverwaltung"
        description="Verwalte Outreach-Kontakte für deine Linkbuilding-Kampagnen"
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
          <>
            <Button
              variant="outline"
              onClick={handleFetchContacts}
              disabled={fetching}
            >
              {fetching ? (
                <Loader2 className="animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Kontakte suchen
            </Button>
            {contacts.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("csv")}
                >
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("vcf")}
                >
                  <Download className="h-4 w-4" />
                  VCF (Outlook)
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {!selectedProjectId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Contact className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 font-semibold">Projekt auswählen</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Wähle ein Projekt, um Kontakte zu verwalten.
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
                <p className="text-sm text-muted-foreground">Kontakte</p>
                <p className="text-2xl font-bold">{contacts.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Domains</p>
                <p className="text-2xl font-bold">{uniqueDomains}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Mit E-Mail</p>
                <p className="text-2xl font-bold text-green-600">
                  {contacts.filter((c) => c.email).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Konvertiert</p>
                <p className="text-2xl font-bold text-primary">
                  {contacts.filter((c) => c.outreachStatus === "converted").length}
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

          {/* Contacts Table */}
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Contact className="h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 font-semibold">Keine Kontakte</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Klicke auf &quot;Kontakte suchen&quot;, um Kontaktdaten zu finden.
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
                        <th className="px-4 py-3 text-left font-medium">Name</th>
                        <th className="px-4 py-3 text-left font-medium">E-Mail</th>
                        <th className="px-4 py-3 text-left font-medium">Position</th>
                        <th className="px-4 py-3 text-left font-medium">Domain</th>
                        <th className="px-4 py-3 text-left font-medium">Quelle</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((contact) => (
                        <tr key={contact.id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium">
                            {contact.name || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {contact.email ? (
                              <a
                                href={`mailto:${contact.email}`}
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <Mail className="h-3 w-3 shrink-0" />
                                {contact.email}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {contact.position || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={`https://${contact.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              {contact.domain}
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {contact.source || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={contact.outreachStatus}
                              onValueChange={(v) =>
                                handleStatusChange(contact.id, v)
                              }
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
