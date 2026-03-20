import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  defaultLanguage: z.string().min(1).optional(),
  timezone: z.string().min(1).optional(),
  logoUrl: z.string().optional().nullable(),
});

export async function GET() {
  try {
    // Get the first agency record, or create a default one
    let agency = await prisma.agency.findFirst();

    if (!agency) {
      agency = await prisma.agency.create({
        data: {
          name: "Meine Agentur",
          defaultLanguage: "de-DE",
          timezone: "Europe/Berlin",
        },
      });
    }

    return NextResponse.json(agency);
  } catch (error) {
    console.error("Failed to fetch agency:", error);
    return NextResponse.json(
      { error: "Failed to fetch agency settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Get existing agency or create one
    let agency = await prisma.agency.findFirst();

    if (!agency) {
      agency = await prisma.agency.create({
        data: {
          name: parsed.data.name ?? "Meine Agentur",
          defaultLanguage: parsed.data.defaultLanguage ?? "de-DE",
          timezone: parsed.data.timezone ?? "Europe/Berlin",
          logoUrl: parsed.data.logoUrl ?? null,
        },
      });
    } else {
      agency = await prisma.agency.update({
        where: { id: agency.id },
        data: parsed.data,
      });
    }

    return NextResponse.json(agency);
  } catch (error) {
    console.error("Failed to update agency:", error);
    return NextResponse.json(
      { error: "Failed to update agency settings" },
      { status: 500 }
    );
  }
}
