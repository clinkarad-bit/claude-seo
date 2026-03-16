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

    const contacts = await prisma.lBContact.findMany({
      where: {
        projectId: params.id,
        ...(status ? { outreachStatus: status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contacts });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

const updateContactSchema = z.object({
  contactId: z.string(),
  outreachStatus: z.enum(["new", "contacted", "replied", "converted", "ignored"]).optional(),
  notes: z.string().optional(),
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
    const parsed = updateContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    }

    const updateData: Record<string, string> = {};
    if (parsed.data.outreachStatus) updateData.outreachStatus = parsed.data.outreachStatus;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

    const contact = await prisma.lBContact.update({
      where: { id: parsed.data.contactId },
      data: updateData,
    });

    await auditLog(user.id, "contact.update", {
      entity: "LBContact",
      entityId: contact.id,
      metadata: JSON.stringify(updateData),
    });

    return NextResponse.json({ contact });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
