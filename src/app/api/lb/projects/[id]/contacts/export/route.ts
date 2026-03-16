import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth";

type RouteParams = { params: { id: string } };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(req);

    if (user.role !== "admin") {
      const member = await prisma.lBProjectMember.findUnique({
        where: { userId_projectId: { userId: user.id, projectId: params.id } },
      });
      if (!member) {
        return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
      }
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") ?? "csv";

    const contacts = await prisma.lBContact.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: "desc" },
    });

    if (format === "vcf") {
      const vcfCards = contacts.map((c) => {
        const nameParts = (c.name ?? "").split(" ");
        const firstName = nameParts[0] ?? "";
        const lastName = nameParts.slice(1).join(" ");
        const lines = [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `FN:${c.name ?? c.email ?? c.domain}`,
          `N:${lastName};${firstName};;;`,
        ];
        if (c.email) lines.push(`EMAIL:${c.email}`);
        if (c.phone) lines.push(`TEL:${c.phone}`);
        if (c.position) lines.push(`TITLE:${c.position}`);
        if (c.domain) lines.push(`ORG:${c.domain}`);
        if (c.linkedinUrl) lines.push(`URL:${c.linkedinUrl}`);
        if (c.notes) lines.push(`NOTE:${c.notes}`);
        lines.push("END:VCARD");
        return lines.join("\r\n");
      });

      return new NextResponse(vcfCards.join("\r\n"), {
        headers: {
          "Content-Type": "text/vcard; charset=utf-8",
          "Content-Disposition": `attachment; filename="kontakte-${params.id}.vcf"`,
        },
      });
    }

    // CSV export
    const header = "Name,E-Mail,Telefon,Position,Domain,Quelle,Status,Notizen";
    const rows = contacts.map((c) => {
      const escape = (val: string | null) => {
        if (!val) return "";
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };
      return [
        escape(c.name),
        escape(c.email),
        escape(c.phone),
        escape(c.position),
        escape(c.domain),
        escape(c.source),
        escape(c.outreachStatus),
        escape(c.notes),
      ].join(",");
    });

    const csv = [header, ...rows].join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kontakte-${params.id}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
