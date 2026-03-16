import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireAuth, requireAdmin, auditLog, AuthError } from "@/lib/auth";

type RouteParams = { params: { id: string } };

async function checkAccess(userId: string, role: string, projectId: string) {
  if (role === "admin") return true;
  const member = await prisma.lBProjectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  return !!member;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(req);
    if (!(await checkAccess(user.id, user.role, params.id))) {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }

    const project = await prisma.lBProject.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { companyName: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
        _count: {
          select: {
            backlinks: true,
            mentions: true,
            brokenLinks: true,
            contacts: true,
            competitors: true,
            snapshots: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projekt nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Project GET error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  domain: z.string().min(1).optional(),
  url: z.string().url().optional(),
  brandKeywords: z.string().optional(),
  status: z.enum(["active", "paused", "completed"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(req);
    if (!(await checkAccess(user.id, user.role, params.id))) {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    }

    const project = await prisma.lBProject.update({
      where: { id: params.id },
      data: parsed.data,
    });

    await auditLog(user.id, "project.update", {
      entity: "LBProject",
      entityId: project.id,
    });

    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Project PATCH error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(req);

    await prisma.lBProject.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Projekt gelöscht" });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Project DELETE error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
