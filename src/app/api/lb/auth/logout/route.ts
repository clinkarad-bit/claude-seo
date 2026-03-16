import { NextRequest, NextResponse } from "next/server";
import { destroySession, buildExpiredSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("lb-session")?.value;

    if (sessionToken) {
      await destroySession(sessionToken);
    }

    const response = NextResponse.json(
      { message: "Erfolgreich abgemeldet" },
      { status: 200 }
    );

    response.headers.set("Set-Cookie", buildExpiredSessionCookie());

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
