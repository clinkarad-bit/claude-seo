import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, auditLog, AuthError } from "@/lib/auth";
import { fetchBacklinks, fetchBacklinkSummary } from "@/lib/linkbuilding";

type RouteParams = { params: { id: string } };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(req);

    // Check access
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

    // Fetch backlinks from DataForSEO (or mock)
    const [backlinksData, summary] = await Promise.all([
      fetchBacklinks(project.domain),
      fetchBacklinkSummary(project.domain),
    ]);

    // Insert backlinks
    let imported = 0;
    for (const bl of backlinksData) {
      const sourceDomain = new URL(bl.sourceUrl).hostname.replace(/^www\./, "");
      await prisma.lBBacklink.create({
        data: {
          projectId: params.id,
          sourceUrl: bl.sourceUrl,
          sourceDomain,
          targetUrl: bl.targetUrl,
          anchorText: bl.anchorText ?? null,
          linkType: bl.linkType,
          domainRating: bl.domainAuthority ?? null,
          pageRating: bl.pageAuthority ?? null,
          isActive: !bl.isLost,
          lastChecked: new Date(),
        },
      });
      imported++;
    }

    // Create snapshot
    await prisma.lBBacklinkSnapshot.create({
      data: {
        projectId: params.id,
        totalBacklinks: summary.totalBacklinks,
        dofollowCount: summary.dofollowLinks,
        nofollowCount: summary.nofollowLinks,
        avgDR: summary.avgDomainAuthority ?? null,
        referringDomains: summary.referringDomains,
      },
    });

    const total = await prisma.lBBacklink.count({
      where: { projectId: params.id },
    });

    await auditLog(user.id, "backlinks.fetch", {
      entity: "LBProject",
      entityId: params.id,
      metadata: JSON.stringify({ imported, total }),
    });

    return NextResponse.json({ imported, total });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Backlinks fetch error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
