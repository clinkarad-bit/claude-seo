import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  position: z.string().optional(),
  role: z.enum(["admin", "employee", "viewer"]).default("employee"),
});

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
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

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, firstName, lastName, position, role } = parsed.data;

  // Check if user with this email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Ein Benutzer mit dieser E-Mail existiert bereits" },
      { status: 409 }
    );
  }

  // Generate temporary password
  const tempPassword = generateTempPassword();
  // In production, this would be hashed with bcrypt
  const passwordHash = crypto.createHash("sha256").update(tempPassword).digest("hex");

  const name = `${firstName} ${lastName}`;

  // Find an admin user to set as invitedBy (or use the first user)
  let invitedById: string | null = null;
  const adminUser = await prisma.user.findFirst({
    where: { role: "admin", isActive: true },
    select: { id: true },
  });
  if (adminUser) {
    invitedById = adminUser.id;
  }

  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      name,
      role,
      position: position || null,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true,
      role: true,
      position: true,
      isActive: true,
      createdAt: true,
    },
  });

  // Create invite record if we have an inviter
  if (invitedById) {
    await prisma.userInvite.create({
      data: {
        email,
        firstName,
        lastName,
        position: position || null,
        role,
        tempPassword,
        invitedById,
      },
    });
  }

  return NextResponse.json(
    {
      user,
      tempPassword,
      message: `Benutzer erstellt. Temporaeres Passwort: ${tempPassword}`,
    },
    { status: 201 }
  );
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
