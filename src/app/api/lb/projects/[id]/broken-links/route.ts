import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, auditLog, AuthError } from "@/lib/auth";
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const brokenLinks = await prisma.lBBrokenLink.findMany({
      where: {
        projectId: params.id,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ brokenLinks });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

const updateStatusSchema = z.object({
  brokenLinkId: z.string(),
  status: z.enum(["found", "contacted", "replaced", "ignored"]),
  suggestedUrl: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
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
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    }

    const brokenLink = await prisma.lBBrokenLink.update({
      where: { id: parsed.data.brokenLinkId },
      data: {
        status: parsed.data.status,
        ...(parsed.data.suggestedUrl ? { suggestedUrl: parsed.data.suggestedUrl } : {}),
      },
    });

    await auditLog(user.id, "broken-link.status.update", {
      entity: "LBBrokenLink",
      entityId: brokenLink.id,
      metadata: JSON.stringify({ status: parsed.data.status }),
    });

    return NextResponse.json({ brokenLink });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
