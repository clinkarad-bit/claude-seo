import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireAuth, auditLog, AuthError } from "@/lib/auth";

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().min(1).max(500),
  url: z.string().url(),
  brandKeywords: z.string().optional(),
  customerId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    let projects;
    if (user.role === "admin") {
      projects = await prisma.lBProject.findMany({
        include: {
          customer: { select: { companyName: true } },
          _count: {
            select: {
              backlinks: true,
              mentions: true,
              brokenLinks: true,
              contacts: true,
              members: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      const memberOf = await prisma.lBProjectMember.findMany({
        where: { userId: user.id },
        select: { projectId: true },
      });
      const projectIds = memberOf.map((m) => m.projectId);
      projects = await prisma.lBProject.findMany({
        where: { id: { in: projectIds } },
        include: {
          customer: { select: { companyName: true } },
          _count: {
            select: {
              backlinks: true,
              mentions: true,
              brokenLinks: true,
              contacts: true,
              members: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Projects GET error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const project = await prisma.lBProject.create({
      data: {
        name: parsed.data.name,
        domain: parsed.data.domain,
        url: parsed.data.url,
        brandKeywords: parsed.data.brandKeywords ?? null,
        customerId: parsed.data.customerId ?? null,
        members: {
          create: { userId: user.id, role: "owner" },
        },
      },
    });

    await auditLog(user.id, "project.create", {
      entity: "LBProject",
      entityId: project.id,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Projects POST error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
