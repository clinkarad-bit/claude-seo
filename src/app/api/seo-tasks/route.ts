import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  articleId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  type: z.enum([
    "content_update",
    "meta_update",
    "internal_link",
    "technical",
    "new_content",
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  status: z.enum(["open", "in_progress", "done", "dismissed"]).default("open"),
  analysis: z.string().optional().nullable(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["open", "in_progress", "done", "dismissed"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  const where: Record<string, unknown> = {};
  if (customerId) {
    where.customerId = customerId;
  }

  const tasks = await prisma.sEOTask.findMany({
    where,
    include: {
      article: {
        select: {
          id: true,
          keyword: true,
          title: true,
          status: true,
        },
      },
    },
    orderBy: [
      { status: "asc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const task = await prisma.sEOTask.create({
    data: {
      articleId: parsed.data.articleId ?? null,
      customerId: parsed.data.customerId ?? null,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: parsed.data.status,
      analysis: parsed.data.analysis ?? null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, ...updateData } = parsed.data;

  const task = await prisma.sEOTask.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(task);
}
