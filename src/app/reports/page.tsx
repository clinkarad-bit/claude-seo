"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileBarChart,
  Send,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomer } from "@/components/providers/CustomerProvider";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatDateTime, parseJSON } from "@/lib/utils";

interface Report {
  id: string;
  customerId: string;
  type: string;
  title: string;
  data: string;
  emailSent: boolean;
  sentAt: string | null;
  createdAt: string;
  customer?: { companyName: string };
}

interface ReportConfig {
  id: string;
  customerId: string | null;
  reportType: string;
  recipientEmails: string;
  isActive: boolean;
  dayOfWeek: number;
  hourOfDay: number;
}

const TYPE_LABELS: Record<string, string> = {
  weekly_rank: "Ranking-Report",
  monthly_competitor: "Wettbewerber-Report",
  content_gap: "Content-Gap-Report",
};

const TYPE_BADGE_CLASSES: Record<string, string> = {
  weekly_rank: "bg-blue-100 text-blue-800 border-blue-200",
  monthly_competitor: "bg-purple-100 text-purple-800 border-purple-200",
  content_gap: "bg-amber-100 text-amber-800 border-amber-200",
};

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export default function ReportsPage() {
  const { activeCustomer } = useCustomer();
  const { toast } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [configs, setConfigs] = useState<ReportConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateType, setGenerateType] = useState<string>("weekly_rank");
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [savingConfig, setSavingConfig] = useState(false);

  // Config form state
  const [weeklyConfig, setWeeklyConfig] = useState({
    isActive: false,
    emails: [""],
    dayOfWeek: 1,
    hourOfDay: 9,
    id: "",
  });
  const [monthlyConfig, setMonthlyConfig] = useState({
    isActive: false,
    emails: [""],
    dayOfWeek: 1,
    hourOfDay: 9,
    id: "",
  });

  const fetchReports = useCallback(async () => {
    if (!activeCustomer) return;
    try {
      const res = await fetch(`/api/reports?customerId=${activeCustomer.id}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch {
      // ignore
    }
  }, [activeCustomer]);

  const fetchConfigs = useCallback(async () => {
    if (!activeCustomer) return;
    try {
      const res = await fetch(`/api/reports/config?customerId=${activeCustomer.id}`);
      if (res.ok) {
        const data: ReportConfig[] = await res.json();

        const weekly = data.find((c) => c.reportType === "weekly_rank");
        if (weekly) {
          setWeeklyConfig({
            isActive: weekly.isActive,
            emails: parseJSON<string[]>(weekly.recipientEmails, [""]),
            dayOfWeek: weekly.dayOfWeek,
            hourOfDay: weekly.hourOfDay,
            id: weekly.id,
          });
        }

        const monthly = data.find((c) => c.reportType === "monthly_competitor");
        if (monthly) {
          setMonthlyConfig({
            isActive: monthly.isActive,
            emails: parseJSON<string[]>(monthly.recipientEmails, [""]),
            dayOfWeek: monthly.dayOfWeek,
            hourOfDay: monthly.hourOfDay,
            id: monthly.id,
          });
        }

        setConfigs(data);
      }
    } catch {
      // ignore
    }
  }, [activeCustomer]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchReports(), fetchConfigs()]).finally(() => setLoading(false));
  }, [fetchReports, fetchConfigs]);

  const handleGenerate = async () => {
    if (!activeCustomer) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: activeCustomer.id,
          type: generateType,
        }),
      });
      if (res.ok) {
        toast({ title: "Report generiert", description: "Der Report wurde erfolgreich erstellt." });
        fetchReports();
      } else {
        toast({ title: "Fehler", description: "Report konnte nicht generiert werden.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Fehler", description: "Netzwerkfehler beim Generieren.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async (reportId: string) => {
    // Mock email sending
    toast({ title: "E-Mail gesendet", description: "Der Report wurde erfolgreich per Mail versendet." });
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, emailSent: true, sentAt: new Date().toISOString() } : r))
    );
  };

  const handleSaveConfig = async (type: "weekly_rank" | "monthly_competitor") => {
    if (!activeCustomer) return;
    setSavingConfig(true);

    const config = type === "weekly_rank" ? weeklyConfig : monthlyConfig;
    const validEmails = config.emails.filter((e) => e.trim().length > 0);

    try {
      if (config.id) {
        // Update existing
        const res = await fetch("/api/reports/config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: config.id,
            isActive: config.isActive,
            recipientEmails: validEmails,
            dayOfWeek: config.dayOfWeek,
            hourOfDay: config.hourOfDay,
          }),
        });
        if (res.ok) {
          toast({ title: "Gespeichert", description: "Report-Konfiguration aktualisiert." });
        }
      } else {
        // Create new
        const res = await fetch("/api/reports/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: activeCustomer.id,
            reportType: type,
            isActive: config.isActive,
            recipientEmails: validEmails,
            dayOfWeek: config.dayOfWeek,
            hourOfDay: config.hourOfDay,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (type === "weekly_rank") {
            setWeeklyConfig((prev) => ({ ...prev, id: data.id }));
          } else {
            setMonthlyConfig((prev) => ({ ...prev, id: data.id }));
          }
          toast({ title: "Gespeichert", description: "Report-Konfiguration erstellt." });
          fetchConfigs();
        }
      }
    } catch {
      toast({ title: "Fehler", description: "Konfiguration konnte nicht gespeichert werden.", variant: "destructive" });
    } finally {
      setSavingConfig(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (activeTab === "all") return true;
    return r.type === activeTab;
  });

  if (!activeCustomer) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Automatische Berichte und Auswertungen</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileBarChart className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Bitte waehlen Sie einen Kunden aus, um Reports anzuzeigen.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Automatische Berichte und Auswertungen</p>
        </div>

        {/* Generate Report */}
        <div className="flex items-center gap-2">
          <Select value={generateType} onValueChange={setGenerateType}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly_rank">Ranking-Report</SelectItem>
              <SelectItem value="monthly_competitor">Wettbewerber-Report</SelectItem>
              <SelectItem value="content_gap">Content-Gap-Report</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            Report jetzt generieren
          </Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="weekly_rank">Ranking-Reports</TabsTrigger>
          <TabsTrigger value="monthly_competitor">Wettbewerber-Reports</TabsTrigger>
          <TabsTrigger value="content_gap">Content-Gap-Reports</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : filteredReports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileBarChart className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Noch keine Reports vorhanden.</p>
                <p className="text-sm text-muted-foreground">Generieren Sie einen Report, um zu starten.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  expanded={expandedReport === report.id}
                  onToggle={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                  onSendEmail={() => handleSendEmail(report.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Report Config Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Report-Konfiguration</h2>

        {/* Weekly Ranking Report Config */}
        <ConfigCard
          title="Woechentlicher Ranking-Report"
          description="Automatischer Versand des Ranking-Reports an die konfigurierten Empfaenger."
          config={weeklyConfig}
          onChange={setWeeklyConfig}
          onSave={() => handleSaveConfig("weekly_rank")}
          saving={savingConfig}
        />

        {/* Monthly Competitor Report Config */}
        <ConfigCard
          title="Monatlicher Wettbewerber-Report"
          description="Automatischer Versand des Wettbewerber-Reports an die konfigurierten Empfaenger."
          config={monthlyConfig}
          onChange={setMonthlyConfig}
          onSave={() => handleSaveConfig("monthly_competitor")}
          saving={savingConfig}
        />
      </div>
    </div>
  );
}

// ---- Report Card Component ----

function ReportCard({
  report,
  expanded,
  onToggle,
  onSendEmail,
}: {
  report: Report;
  expanded: boolean;
  onToggle: () => void;
  onSendEmail: () => void;
}) {
  const data = parseJSON<Record<string, unknown>>(report.data, {});

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileBarChart className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="font-medium truncate">{report.title}</p>
              <p className="text-sm text-muted-foreground">{formatDateTime(report.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                TYPE_BADGE_CLASSES[report.type] || "bg-gray-100 text-gray-800"
              )}
            >
              {TYPE_LABELS[report.type] || report.type}
            </span>

            {report.emailSent ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Gesendet
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Nicht gesendet
              </span>
            )}

            <Button variant="outline" size="sm" onClick={onToggle}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Anzeigen
            </Button>

            {!report.emailSent && (
              <Button variant="outline" size="sm" onClick={onSendEmail}>
                <Send className="h-4 w-4" />
                Per Mail senden
              </Button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t">
            <ReportDataView type={report.type} data={data} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Report Data View ----

function ReportDataView({ type, data }: { type: string; data: Record<string, unknown> }) {
  if (type === "weekly_rank") {
    return <RankingReportView data={data} />;
  }
  if (type === "monthly_competitor") {
    return <CompetitorReportView data={data} />;
  }
  if (type === "content_gap") {
    return <ContentGapReportView data={data} />;
  }
  return <pre className="text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
}

function RankingReportView({ data }: { data: Record<string, unknown> }) {
  const summary = (data.summary || {}) as Record<string, number>;
  const topMovers = (data.topMovers || []) as Array<Record<string, unknown>>;
  const topDecliners = (data.topDecliners || []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Zeitraum: {data.period as string}</span>
        <span>|</span>
        <span>Domain: {data.domain as string}</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Keywords gesamt</p>
          <p className="text-xl font-bold">{summary.totalKeywords}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Verbessert</p>
          <p className="text-xl font-bold text-green-600">+{summary.improved}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Verschlechtert</p>
          <p className="text-xl font-bold text-red-600">-{summary.declined}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Durchschn. Position</p>
          <p className="text-xl font-bold">{summary.avgPosition}</p>
        </div>
      </div>

      {/* Top Movers */}
      {topMovers.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-600" /> Top Aufsteiger
          </h4>
          <div className="space-y-1">
            {topMovers.map((m, i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-green-50 dark:bg-green-950/20 px-3 py-2 text-sm">
                <span>{m.keyword as string}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Pos. {m.position as number}</span>
                  <span className="font-medium text-green-600">+{m.change as number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Decliners */}
      {topDecliners.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
            <TrendingDown className="h-4 w-4 text-red-600" /> Absteiger
          </h4>
          <div className="space-y-1">
            {topDecliners.map((m, i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-red-50 dark:bg-red-950/20 px-3 py-2 text-sm">
                <span>{m.keyword as string}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Pos. {m.position as number}</span>
                  <span className="font-medium text-red-600">{m.change as number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompetitorReportView({ data }: { data: Record<string, unknown> }) {
  const competitors = (data.competitors || []) as Array<Record<string, unknown>>;
  const opportunities = (data.opportunities || []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Zeitraum: {data.period as string}</span>
      </div>

      {/* Competitor Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 font-medium">Domain</th>
              <th className="pb-2 font-medium text-right">Traffic-Aenderung</th>
              <th className="pb-2 font-medium text-right">Neue Inhalte</th>
              <th className="pb-2 font-medium text-right">Neue Backlinks</th>
              <th className="pb-2 font-medium text-right">DR</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((c, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2 font-medium">{c.domain as string}</td>
                <td className="py-2 text-right">
                  <span className={cn(
                    "font-medium",
                    (c.trafficChange as number) > 0 ? "text-green-600" : (c.trafficChange as number) < 0 ? "text-red-600" : ""
                  )}>
                    {(c.trafficChange as number) > 0 ? "+" : ""}{c.trafficChange as number}%
                  </span>
                </td>
                <td className="py-2 text-right">{c.newContent as number}</td>
                <td className="py-2 text-right">{c.newBacklinks as number}</td>
                <td className="py-2 text-right">
                  {c.domainRating as number}
                  {(c.drChange as number) !== 0 && (
                    <span className={cn("ml-1 text-xs", (c.drChange as number) > 0 ? "text-green-600" : "text-red-600")}>
                      ({(c.drChange as number) > 0 ? "+" : ""}{c.drChange as number})
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Handlungsempfehlungen</h4>
          <ul className="space-y-1">
            {opportunities.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-sm rounded-md bg-amber-50 dark:bg-amber-950/20 px-3 py-2">
                <Minus className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                {o}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ContentGapReportView({ data }: { data: Record<string, unknown> }) {
  const summary = (data.summary || {}) as Record<string, number>;
  const topGaps = (data.topGaps || []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Zeitraum: {data.period as string}</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Content-Gaps gesamt</p>
          <p className="text-xl font-bold">{summary.totalGaps}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Hohe Prioritaet</p>
          <p className="text-xl font-bold text-red-600">{summary.highOpportunity}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Traffic-Potenzial</p>
          <p className="text-xl font-bold">{summary.estimatedTrafficPotential?.toLocaleString("de-DE")}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Abdeckung</p>
          <p className="text-xl font-bold">{summary.coveragePercent}%</p>
        </div>
      </div>

      {/* Top Gaps Table */}
      {topGaps.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Keyword</th>
                <th className="pb-2 font-medium text-right">Volumen</th>
                <th className="pb-2 font-medium text-right">Schwierigkeit</th>
                <th className="pb-2 font-medium">Wettbewerber</th>
                <th className="pb-2 font-medium">Prioritaet</th>
              </tr>
            </thead>
            <tbody>
              {topGaps.map((gap, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 font-medium">{gap.keyword as string}</td>
                  <td className="py-2 text-right">{(gap.volume as number).toLocaleString("de-DE")}</td>
                  <td className="py-2 text-right">{gap.difficulty as number}</td>
                  <td className="py-2 text-muted-foreground">{gap.competitor as string}</td>
                  <td className="py-2">
                    <Badge
                      variant={gap.opportunity === "high" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {gap.opportunity === "high" ? "Hoch" : gap.opportunity === "medium" ? "Mittel" : "Niedrig"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Config Card Component ----

function ConfigCard({
  title,
  description,
  config,
  onChange,
  onSave,
  saving,
}: {
  title: string;
  description: string;
  config: { isActive: boolean; emails: string[]; dayOfWeek: number; hourOfDay: number; id: string };
  onChange: (c: typeof config) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const addEmail = () => {
    onChange({ ...config, emails: [...config.emails, ""] });
  };

  const removeEmail = (index: number) => {
    onChange({ ...config, emails: config.emails.filter((_, i) => i !== index) });
  };

  const updateEmail = (index: number, value: string) => {
    const updated = [...config.emails];
    updated[index] = value;
    onChange({ ...config, emails: updated });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <button
            onClick={() => onChange({ ...config, isActive: !config.isActive })}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
              config.isActive ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                config.isActive ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {config.isActive && (
          <div className="space-y-4 pl-0">
            {/* Recipient Emails */}
            <div className="space-y-2">
              <Label>Empfaenger E-Mails</Label>
              {config.emails.map((email, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="email"
                    placeholder="name@firma.de"
                    value={email}
                    onChange={(e) => updateEmail(i, e.target.value)}
                    className="flex-1"
                  />
                  {config.emails.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeEmail(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addEmail}>
                <Plus className="h-3 w-3" />
                Empfaenger hinzufuegen
              </Button>
            </div>

            {/* Schedule */}
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label>Wochentag</Label>
                <Select
                  value={String(config.dayOfWeek)}
                  onValueChange={(v) => onChange({ ...config, dayOfWeek: parseInt(v) })}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((day, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Uhrzeit</Label>
                <Select
                  value={String(config.hourOfDay)}
                  onValueChange={(v) => onChange({ ...config, hourOfDay: parseInt(v) })}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {String(i).padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={onSave} disabled={saving} size="sm">
              {saving && <Loader2 className="animate-spin" />}
              Speichern
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
