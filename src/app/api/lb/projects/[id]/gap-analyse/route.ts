import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, auditLog, AuthError } from "@/lib/auth";
import { fetchDomainIntersection, fetchCompetitors } from "@/lib/linkbuilding";
import { z } from "zod";

type RouteParams = { params: { id: string } };

export async function GET(req: NextRequest, { params }: RouteParams) {
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

    const competitors = await prisma.lBCompetitor.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ competitors });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

const addCompetitorSchema = z.object({
  domain: z.string().min(1),
});

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

    const body = await req.json();
    const parsed = addCompetitorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    }

    const competitor = await prisma.lBCompetitor.create({
      data: {
        projectId: params.id,
        domain: parsed.data.domain,
        isAISuggested: false,
      },
    });

    await auditLog(user.id, "competitor.add", {
      entity: "LBCompetitor",
      entityId: competitor.id,
      metadata: JSON.stringify({ projectId: params.id, domain: parsed.data.domain }),
    });

    return NextResponse.json({ competitor }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
