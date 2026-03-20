"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatDate, parseJSON } from "@/lib/utils";

// ---------- Types ----------

interface OutlineSection {
  h2: string;
  bullets: string[];
  keywords: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface SerpResult {
  position: number;
  title: string;
  url: string;
  description: string;
}

interface InlineComment {
  id: string;
  selection: string;
  comment: string;
  resolved: boolean;
  createdAt: number;
}

interface ArticleData {
  id: string;
  keyword: string;
  status: string;
  title: string | null;
  metaDescription: string | null;
  permalink: string | null;
  outlineContent: string | null;
  outlineFeedback: string | null;
  content: string | null;
  contentFeedback: string | null;
  comments: string | null;
  serpAnalysis: string | null;
  paaQuestions: string | null;
  wordCount: number | null;
  publishedUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  customer: { companyName: string; domain: string | null };
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  outline: { label: "Outline", className: "bg-blue-100 text-blue-800" },
  outline_approved: { label: "Outline OK", className: "bg-indigo-100 text-indigo-800" },
  writing: { label: "Generierung...", className: "bg-yellow-100 text-yellow-800 animate-pulse" },
  draft: { label: "Entwurf", className: "bg-gray-100 text-gray-700" },
  review: { label: "Review", className: "bg-orange-100 text-orange-800" },
  approved: { label: "Freigegeben", className: "bg-green-100 text-green-800" },
  published: { label: "Veröffentlicht", className: "bg-pink-100 text-pink-800" },
  refresh: { label: "Refresh nötig", className: "bg-red-100 text-red-800" },
};

// ---------- Component ----------

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const articleId = params.id as string;

  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);

  // Editable fields
  const [title, setTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [permalink, setPermalink] = useState("");
  const [outlineSections, setOutlineSections] = useState<OutlineSection[]>([]);
  const [articleContent, setArticleContent] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [comments, setComments] = useState<InlineComment[]>([]);
  const [newCommentSelection, setNewCommentSelection] = useState("");
  const [newCommentText, setNewCommentText] = useState("");

  // Parsed data
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [serpResults, setSerpResults] = useState<SerpResult[]>([]);
  const [paaQuestions, setPaaQuestions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("editor");

  // ---------- Data Loading ----------

  const loadArticle = useCallback(async () => {
    try {
      const res = await fetch(`/api/articles/${articleId}`);
      if (!res.ok) {
        toast({ title: "Artikel nicht gefunden", variant: "destructive" });
        router.push("/content-writer");
        return;
      }
      const data: ArticleData = await res.json();
      setArticle(data);

      // Set editable fields
      setTitle(data.title || "");
      setMetaDescription(data.metaDescription || "");
      setPermalink(data.permalink || "");

      // Parse outline
      const outline = parseJSON<{ sections: OutlineSection[] }>(
        data.outlineContent,
        { sections: [] }
      );
      setOutlineSections(outline.sections);

      // Parse content
      setArticleContent(data.content || "");

      // Parse chat
      const phase = data.status === "outline" || data.status === "outline_approved"
        ? "outlineFeedback"
        : "contentFeedback";
      const feedback = parseJSON<ChatMessage[]>(data[phase], []);
      setChatMessages(feedback);

      // Parse SERP data
      setSerpResults(parseJSON<SerpResult[]>(data.serpAnalysis, []));
      setPaaQuestions(parseJSON<string[]>(data.paaQuestions, []));

      // Parse comments
      setComments(parseJSON<InlineComment[]>(data.comments, []));
    } catch {
      toast({ title: "Fehler beim Laden", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [articleId, router, toast]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ---------- Helpers ----------

  const currentPhase = (): "outline" | "content" => {
    if (!article) return "outline";
    if (article.status === "outline" || article.status === "outline_approved") return "outline";
    return "content";
  };

  const isOutlinePhase = article?.status === "outline";
  const isOutlineApproved = article?.status === "outline_approved";
  const isWriting = article?.status === "writing";
  const isDraftOrReview = article?.status === "draft" || article?.status === "review";
  const isApproved = article?.status === "approved";
  const isPublished = article?.status === "published";

  // ---------- Actions ----------

  async function saveMetaData() {
    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, metaDescription, permalink }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticle(updated);
        toast({ title: "Metadaten gespeichert" });
      }
    } catch {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function saveOutline() {
    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outlineContent: JSON.stringify({ sections: outlineSections }),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticle(updated);
        toast({ title: "Outline gespeichert" });
      }
    } catch {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function approveOutline() {
    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "outline_approved",
          outlineContent: JSON.stringify({ sections: outlineSections }),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticle(updated);
        toast({ title: "Outline abgenommen" });
      }
    } catch {
      toast({ title: "Fehler", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function generateArticle() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/articles/${articleId}/generate`, {
        method: "POST",
      });
      if (res.ok) {
        const updated = await res.json();
        setArticle(updated);
        setArticleContent(updated.content || "");
        toast({ title: "Artikel generiert!" });
      } else {
        const err = await res.json();
        toast({ title: err.error || "Fehler bei der Generierung", variant: "destructive" });
      }
    } catch {
      toast({ title: "Fehler bei der Generierung", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function saveContent() {
    setSaving(true);
    const wordCount = articleContent
      .replace(/[#*>\-_|`]/g, "")
      .split(/\s+/)
      .filter(Boolean).length;

    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: articleContent,
          wordCount,
          comments: JSON.stringify(comments),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticle(updated);
        toast({ title: "Inhalt gespeichert" });
      }
    } catch {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(status: string) {
    setSaving(true);
    try {
      const data: Record<string, unknown> = { status };
      if (status === "published") {
        data.publishedAt = new Date().toISOString();
        data.publishedUrl = `https://${article?.customer?.domain || "example.de"}/${permalink}`;
      }
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticle(updated);
        toast({ title: `Status auf "${STATUS_CONFIG[status]?.label || status}" gesetzt` });
      }
    } catch {
      toast({ title: "Fehler", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function sendChatMessage() {
    if (!chatInput.trim()) return;
    setSendingChat(true);

    try {
      const res = await fetch(`/api/articles/${articleId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatInput.trim(), phase: currentPhase() }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.feedback);
        setChatInput("");
      }
    } catch {
      toast({ title: "Fehler beim Senden", variant: "destructive" });
    } finally {
      setSendingChat(false);
    }
  }

  function addComment() {
    if (!newCommentText.trim()) return;
    const comment: InlineComment = {
      id: `c_${Date.now()}`,
      selection: newCommentSelection,
      comment: newCommentText.trim(),
      resolved: false,
      createdAt: Date.now(),
    };
    setComments([...comments, comment]);
    setNewCommentSelection("");
    setNewCommentText("");
  }

  function toggleCommentResolved(commentId: string) {
    setComments(
      comments.map((c) =>
        c.id === commentId ? { ...c, resolved: !c.resolved } : c
      )
    );
  }

  // ---------- Outline editing ----------

  function updateSectionH2(index: number, value: string) {
    const updated = [...outlineSections];
    updated[index] = { ...updated[index], h2: value };
    setOutlineSections(updated);
  }

  function updateSectionBullet(sectionIndex: number, bulletIndex: number, value: string) {
    const updated = [...outlineSections];
    const bullets = [...updated[sectionIndex].bullets];
    bullets[bulletIndex] = value;
    updated[sectionIndex] = { ...updated[sectionIndex], bullets };
    setOutlineSections(updated);
  }

  function addBullet(sectionIndex: number) {
    const updated = [...outlineSections];
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      bullets: [...updated[sectionIndex].bullets, ""],
    };
    setOutlineSections(updated);
  }

  function removeBullet(sectionIndex: number, bulletIndex: number) {
    const updated = [...outlineSections];
    const bullets = updated[sectionIndex].bullets.filter((_, i) => i !== bulletIndex);
    updated[sectionIndex] = { ...updated[sectionIndex], bullets };
    setOutlineSections(updated);
  }

  function addSection() {
    setOutlineSections([
      ...outlineSections,
      { h2: "Neuer Abschnitt", bullets: [""], keywords: [] },
    ]);
  }

  function removeSection(index: number) {
    setOutlineSections(outlineSections.filter((_, i) => i !== index));
  }

  // ---------- Simple Markdown Preview ----------

  function renderMarkdown(md: string): string {
    return md
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-3">$1</blockquote>')
      .replace(/^---$/gm, '<hr class="my-6 border-border" />')
      .replace(/\n\n/g, '</p><p class="mb-3 leading-relaxed">')
      .replace(/^/, '<p class="mb-3 leading-relaxed">')
      .concat("</p>");
  }

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!article) return null;

  const statusInfo = STATUS_CONFIG[article.status] || {
    label: article.status,
    className: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/content-writer")}
              >
                &larr; Zurück
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="font-semibold truncate max-w-md">
                {title || article.keyword}
              </h1>
              <Badge className={cn("text-xs", statusInfo.className)}>
                {statusInfo.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {article.customer.companyName}
              </span>
              {article.wordCount && (
                <span className="text-sm text-muted-foreground">
                  | {article.wordCount} Wörter
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meta Data Bar */}
      <div className="border-b bg-muted/30">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Titel</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="SEO-Titel eingeben..."
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Meta Description</Label>
              <Input
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Meta-Beschreibung..."
                className="h-8 text-sm"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Permalink</Label>
                <Input
                  value={permalink}
                  onChange={(e) => setPermalink(e.target.value)}
                  placeholder="url-slug"
                  className="h-8 text-sm"
                />
              </div>
              <Button size="sm" variant="outline" onClick={saveMetaData} disabled={saving}>
                {saving ? "..." : "Speichern"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Editor Panel (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            {/* ===== STEP 1: Outline Phase ===== */}
            {(isOutlinePhase || isOutlineApproved) && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Outline bearbeiten</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={saveOutline}
                          disabled={saving}
                        >
                          Speichern
                        </Button>
                        {isOutlinePhase && (
                          <Button size="sm" onClick={approveOutline} disabled={saving}>
                            Outline abnehmen
                          </Button>
                        )}
                        {isOutlineApproved && (
                          <Button
                            size="sm"
                            onClick={generateArticle}
                            disabled={generating}
                          >
                            {generating ? "Generiere..." : "Artikel generieren"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {outlineSections.map((section, si) => (
                      <div
                        key={si}
                        className="border rounded-lg p-4 space-y-3 bg-muted/20"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            H2
                          </span>
                          <Input
                            value={section.h2}
                            onChange={(e) => updateSectionH2(si, e.target.value)}
                            className="font-semibold"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive shrink-0"
                            onClick={() => removeSection(si)}
                          >
                            &times;
                          </Button>
                        </div>

                        <div className="pl-6 space-y-2">
                          {section.bullets.map((bullet, bi) => (
                            <div key={bi} className="flex items-center gap-2">
                              <span className="text-muted-foreground text-xs">
                                &bull;
                              </span>
                              <Input
                                value={bullet}
                                onChange={(e) =>
                                  updateSectionBullet(si, bi, e.target.value)
                                }
                                className="text-sm"
                                placeholder="Stichpunkt..."
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground shrink-0 h-8 w-8 p-0"
                                onClick={() => removeBullet(si, bi)}
                              >
                                &times;
                              </Button>
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => addBullet(si)}
                          >
                            + Stichpunkt
                          </Button>
                        </div>

                        {section.keywords.length > 0 && (
                          <div className="pl-6 flex flex-wrap gap-1.5">
                            {section.keywords.map((kw, ki) => (
                              <Badge
                                key={ki}
                                variant="secondary"
                                className="text-xs"
                              >
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={addSection}
                    >
                      + Abschnitt hinzufügen
                    </Button>
                  </CardContent>
                </Card>

                {/* SERP Analysis */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">SERP-Analyse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-3">
                        <TabsTrigger value="serp">Top 10 Ergebnisse</TabsTrigger>
                        <TabsTrigger value="paa">
                          PAA Fragen ({paaQuestions.length})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="serp" className="space-y-3">
                        {serpResults.map((result) => (
                          <div
                            key={result.position}
                            className="flex gap-3 p-3 rounded-lg border bg-card"
                          >
                            <span className="text-sm font-mono text-muted-foreground shrink-0 w-6">
                              {result.position}.
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-primary truncate">
                                {result.title}
                              </p>
                              <p className="text-xs text-green-700 truncate">
                                {result.url}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {result.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </TabsContent>

                      <TabsContent value="paa" className="space-y-2">
                        {paaQuestions.map((q, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg border bg-card text-sm"
                          >
                            {q}
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            )}

            {/* ===== STEP 2: Writing / Generation ===== */}
            {isWriting && (
              <Card>
                <CardContent className="py-20 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-lg font-semibold">Artikel wird generiert...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Dies kann einen Moment dauern. Der Artikel wird aus der Outline generiert.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* ===== STEP 3: Draft / Review / Edit ===== */}
            {(isDraftOrReview || isApproved || isPublished) && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Artikel</CardTitle>
                      <div className="flex items-center gap-2">
                        {isDraftOrReview && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={saveContent}
                              disabled={saving}
                            >
                              Speichern
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setStatus("review")}
                              disabled={saving || article.status === "review"}
                            >
                              In Review
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setStatus("approved")}
                              disabled={saving}
                            >
                              Freigeben
                            </Button>
                          </>
                        )}
                        {isApproved && (
                          <Button
                            size="sm"
                            onClick={() => setStatus("published")}
                            disabled={saving}
                          >
                            Veröffentlichen
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="edit">
                      <TabsList className="mb-3">
                        <TabsTrigger value="edit">Bearbeiten</TabsTrigger>
                        <TabsTrigger value="preview">Vorschau</TabsTrigger>
                      </TabsList>

                      <TabsContent value="edit">
                        <Textarea
                          value={articleContent}
                          onChange={(e) => setArticleContent(e.target.value)}
                          className="min-h-[600px] font-mono text-sm leading-relaxed"
                          placeholder="Artikel-Inhalt in Markdown..."
                          readOnly={isApproved || isPublished}
                        />
                      </TabsContent>

                      <TabsContent value="preview">
                        <div
                          className="prose prose-sm max-w-none p-4 border rounded-lg min-h-[600px] bg-white"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(articleContent),
                          }}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Comments Section */}
                {isDraftOrReview && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        Kommentare ({comments.filter((c) => !c.resolved).length}{" "}
                        offen)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Add comment */}
                      <div className="flex gap-2">
                        <Input
                          value={newCommentSelection}
                          onChange={(e) => setNewCommentSelection(e.target.value)}
                          placeholder="Textstelle (optional)..."
                          className="text-sm flex-1"
                        />
                        <Input
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Kommentar..."
                          className="text-sm flex-[2]"
                          onKeyDown={(e) =>
                            e.key === "Enter" && addComment()
                          }
                        />
                        <Button size="sm" onClick={addComment}>
                          +
                        </Button>
                      </div>

                      {/* Comment list */}
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={cn(
                            "p-3 rounded-lg border text-sm",
                            comment.resolved
                              ? "bg-muted/50 opacity-60"
                              : "bg-card"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              {comment.selection && (
                                <p className="text-xs text-primary font-mono mb-1">
                                  &ldquo;{comment.selection}&rdquo;
                                </p>
                              )}
                              <p>{comment.comment}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs shrink-0"
                              onClick={() => toggleCommentResolved(comment.id)}
                            >
                              {comment.resolved ? "Öffnen" : "Erledigt"}
                            </Button>
                          </div>
                        </div>
                      ))}

                      {comments.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Keine Kommentare vorhanden
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Published Info */}
                {isPublished && article.publishedUrl && (
                  <Card>
                    <CardContent className="py-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Veröffentlicht am{" "}
                            {article.publishedAt
                              ? formatDate(article.publishedAt)
                              : "---"}
                          </p>
                          <a
                            href={article.publishedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline text-sm"
                          >
                            {article.publishedUrl}
                          </a>
                        </div>
                        <Badge className={cn("text-xs", statusInfo.className)}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Right: Chat Panel (1/3) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-[120px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {currentPhase() === "outline"
                    ? "Outline-Feedback"
                    : "Content-Feedback"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Chat Messages */}
                <div className="h-[500px] overflow-y-auto space-y-3 pr-1">
                  {chatMessages.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Noch keine Nachrichten. Schreiben Sie Ihr Feedback unten.
                    </p>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-lg p-3 text-sm",
                        msg.role === "user"
                          ? "bg-primary/10 ml-4"
                          : "bg-muted mr-4"
                      )}
                    >
                      <p className="text-xs font-semibold mb-1 text-muted-foreground">
                        {msg.role === "user" ? "Sie" : "AI-Assistent"}
                      </p>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                {!isPublished && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Feedback eingeben..."
                      className="min-h-[60px] text-sm resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendChatMessage();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="self-end"
                      onClick={sendChatMessage}
                      disabled={sendingChat || !chatInput.trim()}
                    >
                      {sendingChat ? "..." : "Senden"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
