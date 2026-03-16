import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, auditLog, AuthError } from "@/lib/auth";
import { fetchBrokenBacklinks } from "@/lib/linkbuilding";

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

    const brokenResults = await fetchBrokenBacklinks(project.domain);

    let created = 0;
    for (const bl of brokenResults) {
      const sourceDomain = new URL(bl.sourceUrl).hostname.replace(/^www\./, "");
      await prisma.lBBrokenLink.create({
        data: {
          projectId: params.id,
          sourceUrl: bl.sourceUrl,
          sourceDomain,
          brokenUrl: bl.targetUrl,
          anchorText: bl.anchorText || null,
          httpStatus: bl.httpCode,
          domainRating: bl.domainAuthority,
          status: "found",
        },
      });
      created++;
    }

    await auditLog(user.id, "broken-links.fetch", {
      entity: "LBProject",
      entityId: params.id,
      metadata: JSON.stringify({ found: brokenResults.length, created }),
    });

    return NextResponse.json({ found: brokenResults.length, created });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Broken links fetch error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
