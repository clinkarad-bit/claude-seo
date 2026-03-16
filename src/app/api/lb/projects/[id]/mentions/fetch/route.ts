import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, auditLog, AuthError } from "@/lib/auth";
import { searchBrandMentions } from "@/lib/linkbuilding";

type RouteParams = { params: { id: string } };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(req);

    if (user.role !== "admin") {
      const member = await prisma.lBProjectMember.findUnique({
        where: { userId_projectId: { userId: user.id, projectId: params.id } },
      });
      if (!member) {
        return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
      }
    }

    const project = await prisma.lBProject.findUnique({
      where: { id: params.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Projekt nicht gefunden" }, { status: 404 });
    }

    // Parse brand keywords
    const keywords = project.brandKeywords
      ? (project.brandKeywords as string).split(",").map((k) => k.trim()).filter(Boolean)
      : [project.name, project.domain];

    const mentionResults = await searchBrandMentions(keywords);

    let created = 0;
    for (const m of mentionResults) {
      const sourceDomain = new URL(m.url).hostname.replace(/^www\./, "");
      await prisma.lBBrandMention.upsert({
        where: {
          projectId_sourceUrl: {
            projectId: params.id,
            sourceUrl: m.url,
          },
        },
        create: {
          projectId: params.id,
          sourceUrl: m.url,
          sourceDomain,
          title: m.title,
          snippet: m.snippet,
          hasLink: m.hasLink,
          mentionDate: m.publishedAt ? new Date(m.publishedAt) : null,
          source: "dataforseo",
          status: "new",
        },
        update: {
          title: m.title,
          snippet: m.snippet,
        },
      });
      created++;
    }

    await auditLog(user.id, "mentions.fetch", {
      entity: "LBProject",
      entityId: params.id,
      metadata: JSON.stringify({ keywords, found: mentionResults.length, created }),
    });

    return NextResponse.json({ found: mentionResults.length, created });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Mentions fetch error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
