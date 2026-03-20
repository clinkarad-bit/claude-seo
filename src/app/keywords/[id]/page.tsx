"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Loader2,
  PenLine,
  Filter,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatNumber } from "@/lib/utils";

// ---- Types ----

interface KeywordEntry {
  id: string;
  keyword: string;
  searchVolume: number;
  cpc: number;
  searchIntent: string;
  funnelLevel: string;
  difficulty: number | null;
  isCovered: boolean;
  coveredUrl: string | null;
  isMainVariant: boolean;
  parentKeywordId: string | null;
  articleId: string | null;
}

interface KeywordHub {
  id: string;
  name: string;
  totalVolume: number;
  keywordCount: number;
  coveredCount: number;
  coverageScore: number;
  keywords: KeywordEntry[];
}

interface KeywordMapDetail {
  id: string;
  name: string;
  seedKeywords: string;
  status: string;
  totalKeywords: number;
  coveredKeywords: number;
  coverageScore: number;
  customer: { companyName: string; domain: string | null };
  hubs: KeywordHub[];
}

// ---- Style helpers ----

const FUNNEL_CONFIG: Record<string, { label: string; className: string }> = {
  top: { label: "Top", className: "bg-blue-100 text-blue-700 border-blue-200" },
  middle: { label: "Middle", className: "bg-amber-100 text-amber-700 border-amber-200" },
  bottom: { label: "Bottom", className: "bg-green-100 text-green-700 border-green-200" },
};

const INTENT_CONFIG: Record<string, { label: string; className: string }> = {
  informational: { label: "Informational", className: "bg-sky-100 text-sky-700 border-sky-200" },
  navigational: { label: "Navigational", className: "bg-violet-100 text-violet-700 border-violet-200" },
  commercial: { label: "Commercial", className: "bg-orange-100 text-orange-700 border-orange-200" },
  transactional: { label: "Transactional", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

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

function getDifficultyColor(d: number) {
  if (d >= 70) return "text-red-600";
  if (d >= 40) return "text-amber-600";
  return "text-green-600";
}

// ---- Grouped keyword structure ----

interface KeywordGroup {
  main: KeywordEntry;
  variants: KeywordEntry[];
}

function groupKeywords(keywords: KeywordEntry[]): KeywordGroup[] {
  const mainMap = new Map<string, KeywordGroup>();
  const ungrouped: KeywordGroup[] = [];

  // First pass: collect main variants
  for (const kw of keywords) {
    if (kw.isMainVariant) {
      mainMap.set(kw.id, { main: kw, variants: [] });
    }
  }

  // Second pass: attach sub-variants to their parents
  for (const kw of keywords) {
    if (!kw.isMainVariant && kw.parentKeywordId) {
      const parent = mainMap.get(kw.parentKeywordId);
      if (parent) {
        parent.variants.push(kw);
        continue;
      }
    }
    if (!kw.isMainVariant) {
      ungrouped.push({ main: kw, variants: [] });
    }
  }

  // Sort by search volume (highest first)
  const groups = (Array.from(mainMap.values()) as KeywordGroup[]).concat(ungrouped);
  groups.sort((a, b) => b.main.searchVolume - a.main.searchVolume);

  return groups;
}

// ---- Component ----

export default function KeywordMapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [mapData, setMapData] = useState<KeywordMapDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHub, setFilterHub] = useState("all");
  const [filterFunnel, setFilterFunnel] = useState("all");
  const [filterIntent, setFilterIntent] = useState("all");
  const [filterCovered, setFilterCovered] = useState("all");

  // Expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const fetchMap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/keywords/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMapData(data);
      } else {
        toast({ title: "Fehler", description: "Keyword-Map nicht gefunden.", variant: "destructive" });
        router.push("/keywords");
      }
    } catch {
      toast({ title: "Fehler", description: "Fehler beim Laden der Keyword-Map.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    fetchMap();
  }, [fetchMap]);

  // Compute filtered hubs and keywords
  const filteredHubs = useMemo(() => {
    if (!mapData) return [];

    let hubs = mapData.hubs;

    // Filter by hub
    if (filterHub !== "all") {
      hubs = hubs.filter((h) => h.id === filterHub);
    }

    return hubs.map((hub) => {
      let keywords = hub.keywords;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        keywords = keywords.filter((kw) => kw.keyword.toLowerCase().includes(q));
      }

      // Funnel filter
      if (filterFunnel !== "all") {
        keywords = keywords.filter((kw) => kw.funnelLevel === filterFunnel);
      }

      // Intent filter
      if (filterIntent !== "all") {
        keywords = keywords.filter((kw) => kw.searchIntent === filterIntent);
      }

      // Covered filter
      if (filterCovered === "covered") {
        keywords = keywords.filter((kw) => kw.isCovered);
      } else if (filterCovered === "uncovered") {
        keywords = keywords.filter((kw) => !kw.isCovered);
      }

      return { ...hub, keywords };
    }).filter((hub) => hub.keywords.length > 0);
  }, [mapData, searchQuery, filterHub, filterFunnel, filterIntent, filterCovered]);

  function toggleGroup(id: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!mapData) return null;

  const activeFilters = [filterFunnel, filterIntent, filterCovered, filterHub].filter((f) => f !== "all").length
    + (searchQuery.trim() ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/keywords")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <PageHeader
            title={mapData.name}
            description={`${mapData.customer.companyName} | ${formatNumber(mapData.totalKeywords)} Keywords in ${mapData.hubs.length} Hubs`}
          />
        </div>
      </div>

      {/* Overall coverage card */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Gesamt-Abdeckung</div>
            <div className={cn("text-3xl font-bold", getCoverageColor(mapData.coverageScore))}>
              {mapData.coverageScore}%
            </div>
            <Progress
              value={mapData.coverageScore}
              className={cn("h-2 mt-2", getProgressColor(mapData.coverageScore))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Keywords gesamt</div>
            <div className="text-3xl font-bold">{formatNumber(mapData.totalKeywords)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Abgedeckt</div>
            <div className="text-3xl font-bold text-green-600">
              {formatNumber(mapData.coveredKeywords)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Offen</div>
            <div className="text-3xl font-bold text-red-500">
              {formatNumber(mapData.totalKeywords - mapData.coveredKeywords)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Keywords durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={filterHub} onValueChange={setFilterHub}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Hub filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Hubs</SelectItem>
                {mapData.hubs.map((hub) => (
                  <SelectItem key={hub.id} value={hub.id}>
                    {hub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterFunnel} onValueChange={setFilterFunnel}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Funnel Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Level</SelectItem>
                <SelectItem value="top">Top of Funnel</SelectItem>
                <SelectItem value="middle">Middle of Funnel</SelectItem>
                <SelectItem value="bottom">Bottom of Funnel</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterIntent} onValueChange={setFilterIntent}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Search Intent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Intents</SelectItem>
                <SelectItem value="informational">Informational</SelectItem>
                <SelectItem value="navigational">Navigational</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="transactional">Transactional</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCovered} onValueChange={setFilterCovered}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Abdeckung" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="covered">Abgedeckt</SelectItem>
                <SelectItem value="uncovered">Nicht abgedeckt</SelectItem>
              </SelectContent>
            </Select>

            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterHub("all");
                  setFilterFunnel("all");
                  setFilterIntent("all");
                  setFilterCovered("all");
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Filter zurücksetzen ({activeFilters})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hub tabs + keyword tables */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="text-xs">
            Alle ({mapData.totalKeywords})
          </TabsTrigger>
          {mapData.hubs.map((hub) => (
            <TabsTrigger key={hub.id} value={hub.id} className="text-xs">
              {hub.name} ({hub.keywordCount})
            </TabsTrigger>
          ))}
        </TabsList>

        {/* All hubs view */}
        <TabsContent value="all" className="space-y-6">
          {filteredHubs.map((hub) => (
            <HubSection
              key={hub.id}
              hub={hub}
              expandedGroups={expandedGroups}
              onToggleGroup={toggleGroup}
            />
          ))}
          {filteredHubs.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Keine Keywords gefunden.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Individual hub views */}
        {mapData.hubs.map((hub) => {
          const filtered = filteredHubs.find((h) => h.id === hub.id);
          return (
            <TabsContent key={hub.id} value={hub.id} className="space-y-6">
              {filtered ? (
                <HubSection
                  hub={filtered}
                  expandedGroups={expandedGroups}
                  onToggleGroup={toggleGroup}
                />
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Keine Keywords in diesem Hub gefunden.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

// ---- Hub section with summary + table ----

function HubSection({
  hub,
  expandedGroups,
  onToggleGroup,
}: {
  hub: KeywordHub;
  expandedGroups: Set<string>;
  onToggleGroup: (id: string) => void;
}) {
  const groups = useMemo(() => groupKeywords(hub.keywords), [hub.keywords]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{hub.name}</CardTitle>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span>{hub.keywordCount} Keywords</span>
              <span>Vol: {formatNumber(hub.totalVolume)}</span>
              <span>
                Abdeckung:{" "}
                <span className={cn("font-semibold", getCoverageColor(hub.coverageScore))}>
                  {hub.coverageScore}%
                </span>
              </span>
            </div>
          </div>
          <div className="w-32">
            <Progress
              value={hub.coverageScore}
              className={cn("h-2", getProgressColor(hub.coverageScore))}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t bg-muted/30">
                <th className="text-left font-medium px-4 py-3 w-8"></th>
                <th className="text-left font-medium px-4 py-3">Keyword</th>
                <th className="text-right font-medium px-4 py-3">Suchvolumen</th>
                <th className="text-right font-medium px-4 py-3">CPC</th>
                <th className="text-center font-medium px-4 py-3">Intent</th>
                <th className="text-center font-medium px-4 py-3">Funnel</th>
                <th className="text-right font-medium px-4 py-3">Difficulty</th>
                <th className="text-center font-medium px-4 py-3">Abgedeckt</th>
                <th className="text-right font-medium px-4 py-3">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <KeywordGroupRow
                  key={group.main.id}
                  group={group}
                  isExpanded={expandedGroups.has(group.main.id)}
                  onToggle={() => onToggleGroup(group.main.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Keyword row with expandable variants ----

function KeywordGroupRow({
  group,
  isExpanded,
  onToggle,
}: {
  group: KeywordGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { main, variants } = group;
  const hasVariants = variants.length > 0;
  const funnel = FUNNEL_CONFIG[main.funnelLevel] || FUNNEL_CONFIG.top;
  const intent = INTENT_CONFIG[main.searchIntent] || INTENT_CONFIG.informational;

  return (
    <>
      <tr className="border-t hover:bg-muted/20 transition-colors">
        <td className="px-4 py-2.5">
          {hasVariants && (
            <button
              onClick={onToggle}
              className="p-0.5 rounded hover:bg-muted transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          )}
        </td>
        <td className="px-4 py-2.5">
          <span className="font-medium">{main.keyword}</span>
          {hasVariants && (
            <span className="ml-2 text-xs text-muted-foreground">
              +{variants.length} Varianten
            </span>
          )}
        </td>
        <td className="px-4 py-2.5 text-right tabular-nums">
          {formatNumber(main.searchVolume)}
        </td>
        <td className="px-4 py-2.5 text-right tabular-nums">
          {main.cpc.toFixed(2)} &euro;
        </td>
        <td className="px-4 py-2.5 text-center">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
              intent.className
            )}
          >
            {intent.label}
          </span>
        </td>
        <td className="px-4 py-2.5 text-center">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
              funnel.className
            )}
          >
            {funnel.label}
          </span>
        </td>
        <td className="px-4 py-2.5 text-right">
          {main.difficulty !== null && (
            <span className={cn("font-medium tabular-nums", getDifficultyColor(main.difficulty))}>
              {main.difficulty.toFixed(0)}
            </span>
          )}
        </td>
        <td className="px-4 py-2.5 text-center">
          {main.isCovered ? (
            <div className="flex items-center justify-center gap-1">
              <Check className="h-4 w-4 text-green-600" />
              {main.coveredUrl && (
                <a
                  href={main.coveredUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground/40">--</span>
          )}
        </td>
        <td className="px-4 py-2.5 text-right">
          {!main.isCovered && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/content-writer?keyword=${encodeURIComponent(main.keyword)}`;
              }}
            >
              <PenLine className="h-3 w-3 mr-1" />
              Artikel generieren
            </Button>
          )}
        </td>
      </tr>

      {/* Expanded variants */}
      {isExpanded &&
        variants.map((variant) => {
          const vFunnel = FUNNEL_CONFIG[variant.funnelLevel] || FUNNEL_CONFIG.top;
          const vIntent = INTENT_CONFIG[variant.searchIntent] || INTENT_CONFIG.informational;

          return (
            <tr
              key={variant.id}
              className="border-t border-dashed bg-muted/10 hover:bg-muted/20 transition-colors"
            >
              <td className="px-4 py-2" />
              <td className="px-4 py-2 pl-10">
                <span className="text-muted-foreground">{variant.keyword}</span>
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                {formatNumber(variant.searchVolume)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                {variant.cpc.toFixed(2)} &euro;
              </td>
              <td className="px-4 py-2 text-center">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                    vIntent.className
                  )}
                >
                  {vIntent.label}
                </span>
              </td>
              <td className="px-4 py-2 text-center">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                    vFunnel.className
                  )}
                >
                  {vFunnel.label}
                </span>
              </td>
              <td className="px-4 py-2 text-right">
                {variant.difficulty !== null && (
                  <span
                    className={cn(
                      "tabular-nums text-muted-foreground",
                      getDifficultyColor(variant.difficulty)
                    )}
                  >
                    {variant.difficulty.toFixed(0)}
                  </span>
                )}
              </td>
              <td className="px-4 py-2 text-center">
                {variant.isCovered ? (
                  <div className="flex items-center justify-center gap-1">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    {variant.coveredUrl && (
                      <a
                        href={variant.coveredUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground/40">--</span>
                )}
              </td>
              <td className="px-4 py-2 text-right">
                {!variant.isCovered && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/content-writer?keyword=${encodeURIComponent(variant.keyword)}`;
                    }}
                  >
                    <PenLine className="h-3 w-3 mr-1" />
                    Artikel
                  </Button>
                )}
              </td>
            </tr>
          );
        })}
    </>
  );
}
