import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, auditLog, AuthError } from "@/lib/auth";
import { findContacts } from "@/lib/linkbuilding";

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

    // Get unique domains from backlinks and broken links to find contacts for
    const backlinks = await prisma.lBBacklink.findMany({
      where: { projectId: params.id },
      select: { sourceDomain: true },
      distinct: ["sourceDomain"],
      take: 20,
    });
    const brokenLinks = await prisma.lBBrokenLink.findMany({
      where: { projectId: params.id },
      select: { sourceDomain: true },
      distinct: ["sourceDomain"],
      take: 10,
    });

    const domainSet = new Set<string>();
    backlinks.forEach((b) => domainSet.add(b.sourceDomain));
    brokenLinks.forEach((b) => domainSet.add(b.sourceDomain));
    const domains = Array.from(domainSet).slice(0, 10);

    let totalCreated = 0;
    for (const domain of domains) {
      const contacts = await findContacts(domain);
      for (const c of contacts) {
        const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || null;
        await prisma.lBContact.create({
          data: {
            projectId: params.id,
            domain,
            name,
            email: c.email,
            position: c.position,
            source: "hunter.io",
            outreachStatus: "new",
          },
        });
        totalCreated++;
      }
    }

    await auditLog(user.id, "contacts.fetch", {
      entity: "LBProject",
      entityId: params.id,
      metadata: JSON.stringify({ domains: domains.length, created: totalCreated }),
    });

    return NextResponse.json({ domains: domains.length, created: totalCreated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Contacts fetch error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
