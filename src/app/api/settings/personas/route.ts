import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  customerId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  isDefault: z.boolean().optional(),
});

const updateSchema = createSchema.extend({
  id: z.string().min(1),
});

export async function GET() {
  try {
    const personas = await prisma.writerPersona.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { id: true, companyName: true },
        },
      },
    });
    return NextResponse.json(personas);
  } catch (error) {
    console.error("Failed to fetch personas:", error);
    return NextResponse.json(
      { error: "Failed to fetch personas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if this is an update (has id)
    if (body.id) {
      const parsed = updateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { id, ...data } = parsed.data;

      // If setting as default, unset other defaults for same customer
      if (data.isDefault) {
        await prisma.writerPersona.updateMany({
          where: { customerId: data.customerId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const persona = await prisma.writerPersona.update({
        where: { id },
        data,
        include: {
          customer: { select: { id: true, companyName: true } },
        },
      });
      return NextResponse.json(persona);
    }

    // Create new persona
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults for same customer
    if (parsed.data.isDefault) {
      await prisma.writerPersona.updateMany({
        where: { customerId: parsed.data.customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const persona = await prisma.writerPersona.create({
      data: parsed.data,
      include: {
        customer: { select: { id: true, companyName: true } },
      },
    });

    return NextResponse.json(persona);
  } catch (error) {
    console.error("Failed to save persona:", error);
    return NextResponse.json(
      { error: "Failed to save persona" },
      { status: 500 }
    );
  }
}
