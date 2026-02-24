"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  PenLine,
  ExternalLink,
  Link as LinkIcon,
  Tag,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FeedbackDialog } from "@/components/shared/FeedbackDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface OutlineSection {
  h2: string;
  bullets: string[];
  keywords: string[];
  internalLinks: Array<{ url: string; anchor: string }>;
  externalLinks: Array<{ url: string; anchor: string }>;
}

interface OutlineDetailProps {
  outline: {
    id: string;
    status: string;
    mainKeyword: string;
    secondaryKeywords: string[];
    internalLinks: Array<{ url: string; anchor: string }>;
    externalLinks: Array<{ url: string; anchor: string }>;
    content: { suggestedTitle?: string; sections?: OutlineSection[] };
    createdAt: Date;
    topic: {
      title: string;
      topicCluster: { customer: { companyName: string } };
    };
    contentPiece: { id: string; status: string } | null;
  };
}

export function OutlineDetailView({ outline }: OutlineDetailProps) {
  const router = useRouter();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [creatingContent, setCreatingContent] = useState(false);

  const sections = outline.content.sections ?? [];

  const handleFeedback = async (feedback: string) => {
    const res = await fetch(`/api/outlines/${outline.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback }),
    });
    if (!res.ok) throw new Error("Fehler beim Verarbeiten des Feedbacks");
    toast({ title: "Outline überarbeitet" });
    router.refresh();
  };

  const createContentPiece = async () => {
    setCreatingContent(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outlineId: outline.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Fehler");
      }
      const piece = await res.json();
      toast({ title: "Content Piece erstellt" });
      router.push(`/content/${piece.id}`);
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setCreatingContent(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={outline.topic.title}
        description={`${outline.topic.topicCluster.customer.companyName} · Erstellt ${formatDate(outline.createdAt)}`}
        actions={
          <div className="flex gap-2">
            <StatusBadge status={outline.status} />
            <Button variant="outline" onClick={() => setFeedbackOpen(true)}>
              <MessageSquare /> Feedback
            </Button>
            {outline.contentPiece ? (
              <Button variant="outline" asChild>
                <Link href={`/content/${outline.contentPiece.id}`}>
                  <PenLine /> Content ansehen
                </Link>
              </Button>
            ) : (
              <Button onClick={createContentPiece} disabled={creatingContent}>
                {creatingContent ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <PenLine />
                )}
                Content erstellen
              </Button>
            )}
          </div>
        }
      />

      {/* Meta info */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Main Keyword</p>
          <Badge className="mt-1">{outline.mainKeyword}</Badge>
        </div>
        {outline.secondaryKeywords.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground">Secondary Keywords</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {outline.secondaryKeywords.map((kw) => (
                <Badge key={kw} variant="secondary">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggested title */}
      {outline.content.suggestedTitle && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-primary/70">
              Vorgeschlagener Titel
            </p>
            <p className="mt-1 font-semibold">{outline.content.suggestedTitle}</p>
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                H2: {section.h2}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bullets */}
              {section.bullets.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Stichpunkte
                  </p>
                  <ul className="space-y-1">
                    {section.bullets.map((b, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                {/* Keywords */}
                {section.keywords.length > 0 && (
                  <div className="flex-1 min-w-0">
                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Tag className="h-3 w-3" /> Keywords
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {section.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700 border border-blue-200"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Internal Links */}
                {(section.internalLinks ?? []).length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <LinkIcon className="h-3 w-3" /> Interne Links
                    </p>
                    <div className="space-y-1">
                      {section.internalLinks.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <LinkIcon className="h-3 w-3" />
                          {link.anchor}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Links */}
                {(section.externalLinks ?? []).length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <ExternalLink className="h-3 w-3" /> Externe Links
                    </p>
                    <div className="space-y-1">
                      {section.externalLinks.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {link.anchor}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <FeedbackDialog
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSubmit={handleFeedback}
        title="Outline überarbeiten"
      />
    </div>
  );
}
