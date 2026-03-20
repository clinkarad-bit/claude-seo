import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  id: z.string().optional(),
  service: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  isConnected: z.boolean().optional(),
  config: z.string().optional(),
});

export async function GET() {
  try {
    const connections = await prisma.aPIConnection.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(connections);
  } catch (error) {
    console.error("Failed to fetch connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    if (id) {
      // Update existing connection
      const connection = await prisma.aPIConnection.update({
        where: { id },
        data,
      });
      return NextResponse.json(connection);
    }

    // Upsert by service name
    const connection = await prisma.aPIConnection.upsert({
      where: { service: data.service },
      update: data,
      create: data,
    });

    return NextResponse.json(connection);
  } catch (error) {
    console.error("Failed to save connection:", error);
    return NextResponse.json(
      { error: "Failed to save connection" },
      { status: 500 }
    );
  }
}
