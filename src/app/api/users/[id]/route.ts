import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true,
      role: true,
      position: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const updateSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    role: z.enum(["admin", "employee", "viewer"]).optional(),
    position: z.string().optional(),
    isActive: z.boolean().optional(),
  });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.firstName !== undefined) data.firstName = parsed.data.firstName;
  if (parsed.data.lastName !== undefined) data.lastName = parsed.data.lastName;
  if (parsed.data.firstName || parsed.data.lastName) {
    // Rebuild name
    const existing = await prisma.user.findUnique({ where: { id }, select: { firstName: true, lastName: true } });
    if (existing) {
      data.name = `${parsed.data.firstName || existing.firstName} ${parsed.data.lastName || existing.lastName}`;
    }
  }
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.position !== undefined) data.position = parsed.data.position;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        role: true,
        position: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Deactivate instead of hard delete
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    return NextResponse.json({ message: "Benutzer deaktiviert", user });
  } catch {
    return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
  }
}
