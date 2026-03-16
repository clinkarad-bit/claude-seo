import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, auditLog, AuthError } from "@/lib/auth";
import { fetchDomainIntersection, fetchCompetitors } from "@/lib/linkbuilding";

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

    // Get existing competitors
    const existingCompetitors = await prisma.lBCompetitor.findMany({
      where: { projectId: params.id },
    });
    const competitorDomains = existingCompetitors.map((c) => c.domain);

    // If no competitors exist, suggest some via DataForSEO
    if (competitorDomains.length === 0) {
      const suggested = await fetchCompetitors(project.domain);
      for (const comp of suggested) {
        await prisma.lBCompetitor.create({
          data: {
            projectId: params.id,
            domain: comp.domain,
            domainRating: comp.domainAuthority,
            totalBacklinks: comp.totalBacklinks,
            isAISuggested: true,
          },
        });
      }
      const updatedCompetitors = await prisma.lBCompetitor.findMany({
        where: { projectId: params.id },
      });
      competitorDomains.push(...updatedCompetitors.map((c) => c.domain));
    }

    // Fetch gap analysis
    const gapResults = await fetchDomainIntersection(
      project.domain,
      competitorDomains.slice(0, 5)
    );

    // Update competitors with gap data
    for (const comp of existingCompetitors) {
      const gapForComp = gapResults.filter((g) =>
        g.competitors.some((c) => c.domain === comp.domain && c.hasLink && !g.targetHasLink)
      );
      if (gapForComp.length > 0) {
        await prisma.lBCompetitor.update({
          where: { id: comp.id },
          data: { gapData: JSON.stringify(gapForComp) },
        });
      }
    }

    await auditLog(user.id, "gap-analyse.fetch", {
      entity: "LBProject",
      entityId: params.id,
      metadata: JSON.stringify({ competitors: competitorDomains.length, gaps: gapResults.length }),
    });

    return NextResponse.json({
      gaps: gapResults,
      competitorCount: competitorDomains.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Gap analysis fetch error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
