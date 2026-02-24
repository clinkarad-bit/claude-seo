"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Loader2,
  TrendingUp,
  FileText,
  BarChart2,
  DollarSign,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "@/components/ui/use-toast";
import {
  formatDate,
  formatNumber,
  formatCurrency,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/lib/utils";

type TopicCategory = "conversion" | "produktnah" | "enger" | "ferner";

interface Topic {
  id: string;
  title: string;
  category: string;
  searchVolumeTotal: number;
  keywordCount: number;
  avgCpc: number;
  outline: { id: string } | null;
  _count: { keywords: number };
}

interface Cluster {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
  customer: { companyName: string; id: string };
  topics: Topic[];
}

interface Props {
  cluster: Cluster;
}

const CATEGORIES: TopicCategory[] = [
  "conversion",
  "produktnah",
  "enger",
  "ferner",
];

export function TopicClusterView({ cluster }: Props) {
  const router = useRouter();
  const [loadingKeywords, setLoadingKeywords] = useState<string | null>(null);

  const topicsByCategory = CATEGORIES.reduce<Record<string, Topic[]>>(
    (acc, cat) => {
      acc[cat] = cluster.topics.filter((t) => t.category === cat);
      return acc;
    },
    {}
  );

  const fetchKeywords = async (topicId: string) => {
    setLoadingKeywords(topicId);
    try {
      const res = await fetch(`/api/topics/${topicId}/keywords`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const keywords = await res.json();
      toast({
        title: "Keywords abgerufen",
        description: `${keywords.length} Keywords gespeichert`,
      });
      router.refresh();
    } catch {
      toast({
        title: "Fehler",
        description: "Keywords konnten nicht abgerufen werden.",
        variant: "destructive",
      });
    } finally {
      setLoadingKeywords(null);
    }
  };

  const fetchAllKeywords = async () => {
    for (const topic of cluster.topics) {
      if (topic._count.keywords === 0) {
        await fetchKeywords(topic.id);
      }
    }
  };

  return (
    <div>
      <PageHeader
        title={cluster.name}
        description={`Kunde: ${cluster.customer.companyName} · ${cluster.topics.length} Themen · Erstellt ${formatDate(cluster.createdAt)}`}
        actions={
          <div className="flex gap-2">
            <StatusBadge status={cluster.status} />
            <Button variant="outline" size="sm" onClick={fetchAllKeywords}>
              <Search className="h-4 w-4" /> Alle Keywords abrufen
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="conversion">
        <TabsList className="mb-6">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
              <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs">
                {topicsByCategory[cat]?.length ?? 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((cat) => (
          <TabsContent key={cat} value={cat}>
            <div className="space-y-2">
              {(topicsByCategory[cat] ?? []).map((topic) => (
                <Card key={topic.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{topic.title}</p>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0 text-xs ${CATEGORY_COLORS[cat]}`}
                        >
                          {CATEGORY_LABELS[cat]}
                        </span>
                        {topic.outline && (
                          <span className="inline-flex items-center rounded-full border bg-green-50 px-2 py-0 text-xs text-green-700 border-green-200">
                            Outline vorhanden
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        {topic.searchVolumeTotal > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {formatNumber(topic.searchVolumeTotal)}/Monat
                          </span>
                        )}
                        {topic._count.keywords > 0 && (
                          <span className="flex items-center gap-1">
                            <BarChart2 className="h-3 w-3" />
                            {topic._count.keywords} Keywords
                          </span>
                        )}
                        {topic.avgCpc > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Ø {formatCurrency(topic.avgCpc)} CPC
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      {topic._count.keywords === 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchKeywords(topic.id)}
                          disabled={loadingKeywords === topic.id}
                        >
                          {loadingKeywords === topic.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Search className="h-3 w-3" />
                          )}
                          Keywords
                        </Button>
                      ) : null}

                      {topic.outline ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/outlines/${topic.outline.id}`}>
                            <FileText className="h-3 w-3" /> Outline
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" asChild>
                          <Link
                            href={`/outlines?topicId=${topic.id}`}
                          >
                            <FileText className="h-3 w-3" /> Outline erstellen
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(topicsByCategory[cat] ?? []).length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  Keine Themen in dieser Kategorie
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
