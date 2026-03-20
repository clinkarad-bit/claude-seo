"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plug,
  Globe,
  Users,
  Building2,
  Plus,
  Pencil,
  Check,
  Loader2,
  UserPlus,
  Shield,
  ShieldCheck,
  Eye,
  MoreVertical,
  UserX,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

// --------------- Types ---------------

interface APIConnection {
  id: string;
  service: string;
  label: string;
  description: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  isConnected: boolean;
  config: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WriterPersona {
  id: string;
  customerId: string;
  customer: { id: string; companyName: string };
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Agency {
  id: string;
  name: string;
  defaultLanguage: string;
  timezone: string;
  logoUrl: string | null;
}

interface Customer {
  id: string;
  companyName: string;
}

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  position: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  employee: "Mitarbeiter",
  viewer: "Betrachter",
};

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: ShieldCheck,
  employee: Shield,
  viewer: Eye,
};

const ROLE_BADGE_CLASSES: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  employee: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  viewer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

// --------------- Default API services ---------------

const DEFAULT_SERVICES: Omit<APIConnection, "id" | "createdAt" | "updatedAt">[] = [
  {
    service: "anthropic",
    label: "Anthropic Claude API",
    description: "KI-Textgenerierung und Analyse",
    apiKey: null,
    apiSecret: null,
    isConnected: false,
    config: null,
  },
  {
    service: "perplexity",
    label: "Perplexity API",
    description: "Recherche und Faktenprüfung",
    apiKey: null,
    apiSecret: null,
    isConnected: false,
    config: null,
  },
  {
    service: "dataforseo",
    label: "DataForSEO",
    description: "Keyword-Daten und SERP-Analyse",
    apiKey: null,
    apiSecret: null,
    isConnected: false,
    config: null,
  },
  {
    service: "n8n",
    label: "n8n Webhook",
    description: "Workflow-Automatisierung",
    apiKey: null,
    apiSecret: null,
    isConnected: false,
    config: null,
  },
  {
    service: "gsc",
    label: "Google Search Console",
    description: "Performance-Daten und Indexierung",
    apiKey: null,
    apiSecret: null,
    isConnected: false,
    config: null,
  },
];

// --------------- Component ---------------

export default function EinstellungenPage() {
  const { toast } = useToast();

  // State
  const [connections, setConnections] = useState<APIConnection[]>([]);
  const [personas, setPersonas] = useState<WriterPersona[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agency, setAgency] = useState<Agency>({
    id: "",
    name: "",
    defaultLanguage: "de-DE",
    timezone: "Europe/Berlin",
    logoUrl: null,
  });
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [tempPasswordInfo, setTempPasswordInfo] = useState<{ email: string; password: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAgency, setSavingAgency] = useState(false);
  const [personaDialogOpen, setPersonaDialogOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<WriterPersona | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [connRes, personaRes, agencyRes, customerRes, usersRes] = await Promise.all([
        fetch("/api/settings/connections"),
        fetch("/api/settings/personas"),
        fetch("/api/settings/agency"),
        fetch("/api/customers"),
        fetch("/api/users"),
      ]);

      const [connData, personaData, agencyData, customerData, usersData] =
        await Promise.all([
          connRes.json(),
          personaRes.json(),
          agencyRes.json(),
          customerRes.json(),
          usersRes.ok ? usersRes.json() : [],
        ]);

      // Merge default services with saved connections
      const savedMap = new Map(
        (connData as APIConnection[]).map((c) => [c.service, c])
      );
      const mergedConnections = DEFAULT_SERVICES.map((svc) => {
        const saved = savedMap.get(svc.service);
        return saved ?? { ...svc, id: svc.service, createdAt: "", updatedAt: "" };
      }) as APIConnection[];

      setConnections(mergedConnections);
      setPersonas(Array.isArray(personaData) ? personaData : []);
      if (agencyData && agencyData.id) setAgency(agencyData);
      setCustomers(Array.isArray(customerData) ? customerData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create user
  const handleCreateUser = async (formData: {
    email: string;
    firstName: string;
    lastName: string;
    position: string;
    role: string;
  }) => {
    setSavingUser(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Benutzer konnte nicht erstellt werden");
      }
      const data = await res.json();
      setTempPasswordInfo({ email: data.user.email, password: data.tempPassword });
      toast({
        title: "Benutzer erstellt",
        description: `Einladung fuer ${data.user.email} wurde erstellt.`,
      });
      setUserDialogOpen(false);
      fetchData();
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Benutzer konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setSavingUser(false);
    }
  };

  // Toggle user active status
  const handleToggleUserActive = async (user: UserInfo) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast({
        title: user.isActive ? "Deaktiviert" : "Aktiviert",
        description: `${user.name} wurde ${user.isActive ? "deaktiviert" : "aktiviert"}.`,
      });
      fetchData();
    } catch {
      toast({
        title: "Fehler",
        description: "Status konnte nicht geaendert werden.",
        variant: "destructive",
      });
    }
  };

  // Update user role
  const handleUpdateUserRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast({
        title: "Rolle aktualisiert",
        description: `Benutzerrolle wurde auf ${ROLE_LABELS[role] || role} geaendert.`,
      });
      fetchData();
    } catch {
      toast({
        title: "Fehler",
        description: "Rolle konnte nicht geaendert werden.",
        variant: "destructive",
      });
    }
  };

  // Save agency settings
  const handleSaveAgency = async () => {
    setSavingAgency(true);
    try {
      const res = await fetch("/api/settings/agency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agency.name,
          defaultLanguage: agency.defaultLanguage,
          timezone: agency.timezone,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setAgency(data);
      toast({
        title: "Gespeichert",
        description: "Agentur-Einstellungen wurden aktualisiert.",
      });
    } catch {
      toast({
        title: "Fehler",
        description: "Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setSavingAgency(false);
    }
  };

  // Toggle connection
  const handleToggleConnection = async (conn: APIConnection) => {
    try {
      const res = await fetch("/api/settings/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: conn.id !== conn.service ? conn.id : undefined,
          service: conn.service,
          label: conn.label,
          description: conn.description,
          isConnected: !conn.isConnected,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast({
        title: conn.isConnected ? "Getrennt" : "Verbunden",
        description: `${conn.label} wurde ${conn.isConnected ? "getrennt" : "verbunden"}.`,
      });
      fetchData();
    } catch {
      toast({
        title: "Fehler",
        description: "Verbindung konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  // Save persona
  const handleSavePersona = async (formData: {
    name: string;
    customerId: string;
    description: string;
    isDefault: boolean;
  }) => {
    try {
      const body = editingPersona
        ? { ...formData, id: editingPersona.id }
        : formData;

      const res = await fetch("/api/settings/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({
        title: editingPersona ? "Aktualisiert" : "Erstellt",
        description: `Persona "${formData.name}" wurde ${editingPersona ? "aktualisiert" : "erstellt"}.`,
      });
      setPersonaDialogOpen(false);
      setEditingPersona(null);
      fetchData();
    } catch {
      toast({
        title: "Fehler",
        description: "Persona konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  // Connection status badge
  const ConnectionBadge = ({
    conn,
  }: {
    conn: APIConnection;
  }) => {
    if (conn.isConnected) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
          <Check className="h-3 w-3" />
          Verbunden
        </span>
      );
    }
    if (conn.apiKey) {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          Konfigurieren
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
        Verbinden
      </span>
    );
  };

  // WordPress sites from customers
  const wpSites = customers.filter(
    (c) => c as unknown as { wpSiteUrl?: string; wpConnected?: boolean }
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Einstellungen"
        description="API-Verbindungen, Personas und Kundenverwaltung"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* API Connections */}
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plug className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">API-Verbindungen</CardTitle>
              </div>
              <CardDescription>
                Externe Dienste und API-Schlüssel verwalten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {connections.map((conn) => (
                  <div
                    key={conn.service}
                    className="flex items-center justify-between rounded-lg border border-border/60 p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{conn.label}</p>
                      {conn.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {conn.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <ConnectionBadge conn={conn} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleConnection(conn)}
                        className="text-xs"
                      >
                        {conn.isConnected ? "Trennen" : "Verbinden"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* WordPress Connections */}
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">WordPress-Verbindungen</CardTitle>
              </div>
              <CardDescription>
                Verbundene WordPress-Seiten verwalten
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wpSites.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                  <Globe className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Noch keine WordPress-Seiten verbunden.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    WordPress-Verbindungen werden pro Kunde konfiguriert.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {wpSites.map((site) => {
                    const s = site as unknown as {
                      id: string;
                      companyName: string;
                      wpSiteUrl?: string;
                      wpConnected?: boolean;
                    };
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-lg border border-border/60 p-4"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {s.companyName}
                          </p>
                          {s.wpSiteUrl && (
                            <p className="text-xs text-muted-foreground">
                              {s.wpSiteUrl}
                            </p>
                          )}
                        </div>
                        <div>
                          {s.wpConnected ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                              <Check className="h-3 w-3" />
                              Aktiv
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                              Verbinden
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Writer Personas */}
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Schreiber-Personas</CardTitle>
                </div>
                <Dialog
                  open={personaDialogOpen}
                  onOpenChange={(open) => {
                    setPersonaDialogOpen(open);
                    if (!open) setEditingPersona(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      Neue Persona
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingPersona
                          ? "Persona bearbeiten"
                          : "Neue Persona erstellen"}
                      </DialogTitle>
                    </DialogHeader>
                    <PersonaForm
                      customers={customers}
                      persona={editingPersona}
                      onSave={handleSavePersona}
                      onCancel={() => {
                        setPersonaDialogOpen(false);
                        setEditingPersona(null);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>
                Schreibstile und Tonalitäten für Content-Erstellung
              </CardDescription>
            </CardHeader>
            <CardContent>
              {personas.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                  <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Noch keine Personas erstellt.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Erstelle eine Persona, um den Schreibstil zu definieren.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {personas.map((persona) => (
                    <div
                      key={persona.id}
                      className="rounded-lg border border-border/60 p-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {persona.name}
                            </p>
                            {persona.isDefault && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                Standard
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {persona.customer.companyName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {persona.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 gap-1 text-xs"
                          onClick={() => {
                            setEditingPersona(persona);
                            setPersonaDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                          Bearbeiten
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agency Settings */}
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Agentur-Einstellungen</CardTitle>
              </div>
              <CardDescription>
                Allgemeine Einstellungen deiner Agentur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agency-name">Agenturname</Label>
                  <Input
                    id="agency-name"
                    value={agency.name}
                    onChange={(e) =>
                      setAgency({ ...agency, name: e.target.value })
                    }
                    placeholder="Name deiner Agentur"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agency-language">Standardsprache</Label>
                  <Select
                    value={agency.defaultLanguage}
                    onValueChange={(val) =>
                      setAgency({ ...agency, defaultLanguage: val })
                    }
                  >
                    <SelectTrigger id="agency-language">
                      <SelectValue placeholder="Sprache wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="de-DE">Deutsch</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="fr-FR">Français</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                      <SelectItem value="it-IT">Italiano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agency-timezone">Zeitzone</Label>
                  <Select
                    value={agency.timezone}
                    onValueChange={(val) =>
                      setAgency({ ...agency, timezone: val })
                    }
                  >
                    <SelectTrigger id="agency-timezone">
                      <SelectValue placeholder="Zeitzone wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Berlin">
                        Europe/Berlin (CET)
                      </SelectItem>
                      <SelectItem value="Europe/Vienna">
                        Europe/Vienna (CET)
                      </SelectItem>
                      <SelectItem value="Europe/Zurich">
                        Europe/Zurich (CET)
                      </SelectItem>
                      <SelectItem value="Europe/London">
                        Europe/London (GMT)
                      </SelectItem>
                      <SelectItem value="America/New_York">
                        America/New_York (EST)
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        America/Los_Angeles (PST)
                      </SelectItem>
                      <SelectItem value="Asia/Tokyo">
                        Asia/Tokyo (JST)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleSaveAgency}
                    disabled={savingAgency}
                    className="w-full sm:w-auto"
                  >
                    {savingAgency && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Speichern
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --------------- Persona Form ---------------

function PersonaForm({
  customers,
  persona,
  onSave,
  onCancel,
}: {
  customers: Customer[];
  persona: WriterPersona | null;
  onSave: (data: {
    name: string;
    customerId: string;
    description: string;
    isDefault: boolean;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(persona?.name ?? "");
  const [customerId, setCustomerId] = useState(
    persona?.customerId ?? (customers[0]?.id ?? "")
  );
  const [description, setDescription] = useState(persona?.description ?? "");
  const [isDefault, setIsDefault] = useState(persona?.isDefault ?? false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !customerId || !description) return;
    setSaving(true);
    await onSave({ name, customerId, description, isDefault });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="persona-name">Name</Label>
        <Input
          id="persona-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Technischer Redakteur"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="persona-customer">Kunde</Label>
        <Select value={customerId} onValueChange={setCustomerId}>
          <SelectTrigger id="persona-customer">
            <SelectValue placeholder="Kunde wählen" />
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
        <Label htmlFor="persona-desc">Beschreibung</Label>
        <Textarea
          id="persona-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tonalität, Schreibstil, Regeln..."
          rows={4}
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="persona-default"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="persona-default" className="font-normal">
          Als Standard-Persona setzen
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={saving || !name || !description}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {persona ? "Aktualisieren" : "Erstellen"}
        </Button>
      </div>
    </form>
  );
}
