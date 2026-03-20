import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const configSchema = z.object({
  customerId: z.string().optional(),
  reportType: z.enum(["weekly_rank", "monthly_competitor"]),
  recipientEmails: z.array(z.string().email()).min(1),
  isActive: z.boolean().optional().default(true),
  dayOfWeek: z.number().min(0).max(6).optional().default(1),
  hourOfDay: z.number().min(0).max(23).optional().default(9),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  const where: Record<string, unknown> = {};
  if (customerId) where.customerId = customerId;

  const configs = await prisma.reportConfig.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(configs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const config = await prisma.reportConfig.create({
    data: {
      customerId: parsed.data.customerId || null,
      reportType: parsed.data.reportType,
      recipientEmails: JSON.stringify(parsed.data.recipientEmails),
      isActive: parsed.data.isActive,
      dayOfWeek: parsed.data.dayOfWeek,
      hourOfDay: parsed.data.hourOfDay,
    },
  });

  return NextResponse.json(config, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  const updateSchema = z.object({
    id: z.string().min(1),
    recipientEmails: z.array(z.string().email()).optional(),
    isActive: z.boolean().optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
    hourOfDay: z.number().min(0).max(23).optional(),
  });

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;

  const data: Record<string, unknown> = {};
  if (updates.recipientEmails !== undefined) {
    data.recipientEmails = JSON.stringify(updates.recipientEmails);
  }
  if (updates.isActive !== undefined) data.isActive = updates.isActive;
  if (updates.dayOfWeek !== undefined) data.dayOfWeek = updates.dayOfWeek;
  if (updates.hourOfDay !== undefined) data.hourOfDay = updates.hourOfDay;

  const config = await prisma.reportConfig.update({
    where: { id },
    data,
  });

  return NextResponse.json(config);
}
