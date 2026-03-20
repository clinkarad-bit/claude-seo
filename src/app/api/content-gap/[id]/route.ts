import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["open", "planned", "created", "dismissed"]),
  articleId: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.contentGap.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Content gap not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.contentGap.update({
    where: { id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.articleId ? { articleId: parsed.data.articleId } : {}),
    },
  });

  return NextResponse.json(updated);
}
