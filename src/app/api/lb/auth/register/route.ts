import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireAdmin, hashPassword, auditLog, AuthError } from "@/lib/auth";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, "Passwort muss mindestens 12 Zeichen haben"),
  name: z.string().min(1, "Name ist erforderlich"),
  role: z.enum(["admin", "employee"]).optional().default("employee"),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, name, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Ein Benutzer mit dieser E-Mail existiert bereits" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, passwordHash, name, role },
    });

    await auditLog(admin.id, "user.create", {
      entity: "User",
      entityId: user.id,
      metadata: JSON.stringify({ email: user.email, role: user.role }),
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
