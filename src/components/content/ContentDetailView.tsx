"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Globe,
  Copy,
  Check,
  Loader2,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FeedbackDialog } from "@/components/shared/FeedbackDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { formatDate, getStatusLabel } from "@/lib/utils";
import { getScoreBadgeClass, getRankingColor } from "@/lib/seo";

interface ContentDetailProps {
  piece: {
    id: string;
    status: string;
    title: string;
    introduction: string | null;
    content: string | null;
    metaDescription: string | null;
    urlSlug: string | null;
    urlLive: string | null;
    createdAt: Date;
    publishedAt: Date | null;
    outline: {
      id: string;
      topic: {
        title: string;
        topicCluster: { customer: { companyName: string } };
      };
    };
    performanceHistory: Array<{ performanceScore: number; measuredAt: Date }>;
    performanceTracking: Array<{
      keyword: { keyword: string };
      position: number;
      clicks: number;
      impressions: number;
      ctr: number;
      measuredAt: Date;
    }>;
  };
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Entwurf" },
  { value: "approved", label: "Freigegeben" },
  { value: "published", label: "Veröffentlicht" },
  { value: "refresh", label: "Refresh nötig" },
];

export function ContentDetailView({ piece }: ContentDetailProps) {
  const router = useRouter();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [measuringPerf, setMeasuringPerf] = useState(false);

  const latestScore =
    piece.performanceHistory[0]?.performanceScore ?? null;

  const handleStatusChange = async (status: string) => {
    const res = await fetch(`/api/content/${piece.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast({ title: "Status aktualisiert", description: getStatusLabel(status) });
      router.refresh();
    }
  };

  const handleFeedback = async (feedback: string) => {
    const res = await fetch(`/api/content/${piece.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback }),
    });
    if (!res.ok) throw new Error("Fehler beim Verarbeiten");
    toast({ title: "Content überarbeitet" });
    router.refresh();
  };

  const copyContent = async () => {
    await navigator.clipboard.writeText(piece.content ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const measurePerformance = async () => {
    setMeasuringPerf(true);
    try {
      const res = await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentPieceId: piece.id }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast({
        title: "Performance gemessen",
        description: `Score: ${data.score}/100`,
      });
      router.refresh();
    } catch {
      toast({
        title: "Fehler",
        description: "Performance konnte nicht gemessen werden.",
        variant: "destructive",
      });
    } finally {
      setMeasuringPerf(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={piece.title}
        description={`${piece.outline.topic.topicCluster.customer.companyName} · Erstellt ${formatDate(piece.createdAt)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {latestScore !== null && (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold ${getScoreBadgeClass(latestScore)}`}
              >
                Score: {latestScore}
              </span>
            )}
            <Select value={piece.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setFeedbackOpen(true)}>
              <MessageSquare /> Feedback
            </Button>
            <Button variant="outline" onClick={copyContent}>
              {copied ? <Check /> : <Copy />}
              Kopieren
            </Button>
            <Button
              variant="outline"
              onClick={measurePerformance}
              disabled={measuringPerf}
            >
              {measuringPerf ? (
                <Loader2 className="animate-spin" />
              ) : (
                <BarChart3 />
              )}
              Performance messen
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Meta info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {piece.metaDescription && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Meta Description
                  </p>
                  <p className="mt-1 text-sm">{piece.metaDescription}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-4">
                {piece.urlSlug && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      URL Slug
                    </p>
                    <p className="mt-1 font-mono text-sm">/{piece.urlSlug}</p>
                  </div>
                )}
                {piece.urlLive && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Live URL
                    </p>
                    <a
                      href={piece.urlLive}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-3 w-3" />
                      {piece.urlLive}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Introduction */}
          {piece.introduction && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Einleitung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{piece.introduction}</p>
              </CardContent>
            </Card>
          )}

          {/* Main content */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose-content text-sm">
                <ReactMarkdown>{piece.content ?? ""}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Performance history */}
          {piece.performanceHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {piece.performanceHistory.slice(0, 5).map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {formatDate(h.measuredAt)}
                      </span>
                      <span
                        className={`font-medium ${getScoreBadgeClass(h.performanceScore).includes("green") ? "text-green-700" : h.performanceScore >= 30 ? "text-yellow-700" : "text-red-700"}`}
                      >
                        {h.performanceScore}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Keyword rankings */}
          {piece.performanceTracking.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Keyword Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {piece.performanceTracking.slice(0, 10).map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate text-muted-foreground max-w-[140px]">
                        {t.keyword.keyword}
                      </span>
                      <div className="flex items-center gap-2 text-right">
                        <span
                          className={`font-mono font-medium ${getRankingColor(t.position)}`}
                        >
                          #{Math.round(t.position)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <FeedbackDialog
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSubmit={handleFeedback}
        title="Content überarbeiten"
      />
    </div>
  );
}
