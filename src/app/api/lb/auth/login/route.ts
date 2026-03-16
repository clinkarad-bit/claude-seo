import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  verifyPassword,
  checkAccountLock,
  incrementFailedLogins,
  resetFailedLogins,
  createSession,
  auditLog,
  buildSessionCookie,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabe" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: "E-Mail oder Passwort falsch" },
        { status: 401 }
      );
    }

    if (checkAccountLock(user)) {
      return NextResponse.json(
        {
          error: "Konto gesperrt. Bitte versuchen Sie es später erneut.",
          lockedUntil: user.lockedUntil,
        },
        { status: 423 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      await incrementFailedLogins(user.id);
      return NextResponse.json(
        { error: "E-Mail oder Passwort falsch" },
        { status: 401 }
      );
    }

    await resetFailedLogins(user.id);

    const token = await createSession(user.id, req);

    await auditLog(user.id, "login", {
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    const response = NextResponse.json(
      { user: userWithoutPassword },
      { status: 200 }
    );

    response.headers.set("Set-Cookie", buildSessionCookie(token));

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
