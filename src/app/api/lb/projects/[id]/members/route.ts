import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireAuth, requireAdmin, auditLog, AuthError } from "@/lib/auth";

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

    const members = await prisma.lBProjectMember.findMany({
      where: { projectId: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json({ members });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["owner", "member"]).optional().default("member"),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(req);

    const body = await req.json();
    const parsed = addMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    }

    // Check user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    const member = await prisma.lBProjectMember.create({
      data: {
        userId: parsed.data.userId,
        projectId: params.id,
        role: parsed.data.role,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await auditLog(admin.id, "project.member.add", {
      entity: "LBProjectMember",
      entityId: member.id,
      metadata: JSON.stringify({ projectId: params.id, userId: parsed.data.userId }),
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Members POST error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
