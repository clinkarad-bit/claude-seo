import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth";

type RouteParams = { params: { id: string } };

export async function GET(req: NextRequest, { params }: RouteParams) {
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const linkType = searchParams.get("linkType");
    const category = searchParams.get("category");
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";

    const where: Record<string, unknown> = { projectId: params.id };
    if (linkType) where.linkType = linkType;
    if (category) where.category = category;

    const [backlinks, total] = await Promise.all([
      prisma.lBBacklink.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lBBacklink.count({ where }),
    ]);

    return NextResponse.json({
      backlinks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Backlinks GET error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
