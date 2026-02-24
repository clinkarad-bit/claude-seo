import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { generateSectionContent, generateMeta } from "@/lib/ai";
import { parseJSON } from "@/lib/utils";
import type { OutlineSection } from "@/types";

const createSchema = z.object({
  outlineId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const pieces = await prisma.contentPiece.findMany({
    where: status ? { status } : undefined,
    include: {
      outline: {
        include: {
          topic: {
            include: { topicCluster: { include: { customer: true } } },
          },
        },
      },
      performanceHistory: {
        orderBy: { measuredAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pieces);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const outline = await prisma.outline.findUnique({
    where: { id: parsed.data.outlineId },
    include: {
      topic: {
        include: {
          keywords: { where: { relevant: true } },
          topicCluster: { include: { customer: true } },
        },
      },
    },
  });

  if (!outline) {
    return NextResponse.json({ error: "Outline nicht gefunden" }, { status: 404 });
  }

  if (outline.contentPiece) {
    return NextResponse.json(
      { error: "Für diese Outline existiert bereits ein Content Piece" },
      { status: 409 }
    );
  }

  const customer = outline.topic.topicCluster.customer;
  const outlineContent = parseJSON<{ suggestedTitle: string; sections: OutlineSection[] }>(
    outline.content,
    { suggestedTitle: outline.topic.title, sections: [] }
  );

  // Generate content section by section
  const sectionContents: string[] = [];
  for (const section of outlineContent.sections) {
    const sectionText = await generateSectionContent({
      sektionTitel: section.h2,
      sektionInhalt: section.bullets,
      sektionKeywords: section.keywords,
      sektionLinks: [
        ...(section.internalLinks ?? []),
        ...(section.externalLinks ?? []),
      ],
      kundenBeispieltext: customer.exampleText ?? "",
      kundenGuidelines: customer.guidelinesText ?? "",
    });
    sectionContents.push(`## ${section.h2}\n\n${sectionText}`);
  }

  const fullContent = sectionContents.join("\n\n");

  // Generate meta
  const meta = await generateMeta({
    thema: outline.topic.title,
    sections: outlineContent.sections,
    kundenname: customer.companyName,
  });

  const piece = await prisma.contentPiece.create({
    data: {
      outlineId: outline.id,
      status: "draft",
      title: meta.title || outlineContent.suggestedTitle,
      introduction: meta.introduction,
      content: fullContent,
      metaDescription: meta.metaDescription,
      urlSlug: meta.urlSlug,
    },
    include: {
      outline: {
        include: {
          topic: { include: { topicCluster: { include: { customer: true } } } },
        },
      },
    },
  });

  return NextResponse.json(piece, { status: 201 });
}
