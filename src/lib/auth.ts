/**
 * Custom session-based authentication library.
 * Uses bcryptjs for password hashing and httpOnly cookies for session management.
 */

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { User, UserSession } from "@prisma/client";

const SESSION_COOKIE_NAME = "lb-session";
const SESSION_EXPIRY_HOURS = 24;
const MAX_FAILED_LOGINS = 10;
const LOCK_DURATION_MINUTES = 30;

// ---------------------------------------------------------------------------
// Password helpers
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

export async function createSession(
  userId: string,
  req: Request
): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000
  );

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  await prisma.userSession.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  return token;
}

export async function getSession(
  req: Request
): Promise<{ user: User; session: UserSession } | null> {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const token = parseCookie(cookieHeader, SESSION_COOKIE_NAME);
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  // Check expiry
  if (new Date() > session.expiresAt) {
    await prisma.userSession.delete({ where: { id: session.id } });
    return null;
  }

  return { user: session.user, session };
}

export async function destroySession(token: string): Promise<void> {
  await prisma.userSession.delete({ where: { token } }).catch(() => {
    // Session may already be deleted — ignore
  });
}

// ---------------------------------------------------------------------------
// Auth guards
// ---------------------------------------------------------------------------

export async function requireAuth(req: Request): Promise<User> {
  const result = await getSession(req);
  if (!result) {
    throw new AuthError("Nicht authentifiziert", 401);
  }
  if (!result.user.isActive) {
    throw new AuthError("Konto ist deaktiviert", 403);
  }
  return result.user;
}

export async function requireAdmin(req: Request): Promise<User> {
  const user = await requireAuth(req);
  if (user.role !== "admin") {
    throw new AuthError("Keine Administratorberechtigung", 403);
  }
  return user;
}

// ---------------------------------------------------------------------------
// Audit logging
// ---------------------------------------------------------------------------

export async function auditLog(
  userId: string,
  action: string,
  opts?: {
    entity?: string;
    entityId?: string;
    metadata?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity: opts?.entity ?? null,
      entityId: opts?.entityId ?? null,
      metadata: opts?.metadata ?? null,
      ipAddress: opts?.ipAddress ?? null,
      userAgent: opts?.userAgent ?? null,
    },
  });
}

// ---------------------------------------------------------------------------
// Account locking
// ---------------------------------------------------------------------------

export function checkAccountLock(user: User): boolean {
  if (!user.lockedUntil) return false;
  if (new Date() > user.lockedUntil) {
    // Lock has expired — will be cleared on next successful login
    return false;
  }
  return true;
}

export async function incrementFailedLogins(userId: string): Promise<void> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { failedLogins: { increment: 1 } },
  });

  if (user.failedLogins >= MAX_FAILED_LOGINS) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: new Date(
          Date.now() + LOCK_DURATION_MINUTES * 60 * 1000
        ),
      },
    });
  }
}

export async function resetFailedLogins(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLogins: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

export function buildSessionCookie(token: string): string {
  const maxAge = SESSION_EXPIRY_HOURS * 60 * 60;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

export function buildExpiredSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? match.substring(name.length + 1) : null;
}

// ---------------------------------------------------------------------------
// Custom error class
// ---------------------------------------------------------------------------

export class AuthError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}
