import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { generateOutline } from "@/lib/ai";
import { findInternalLinks, findExternalLinks, parseTFIDFCsv } from "@/lib/seo";
import { parseJSON } from "@/lib/utils";

const createSchema = z.object({
  topicId: z.string().min(1),
  tfidfCsv: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const topicId = searchParams.get("topicId");

  const outlines = await prisma.outline.findMany({
    where: topicId ? { topicId } : undefined,
    include: {
      topic: {
        include: {
          topicCluster: { include: { customer: true } },
        },
      },
      contentPiece: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(outlines);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const topic = await prisma.topic.findUnique({
    where: { id: parsed.data.topicId },
    include: {
      keywords: { where: { relevant: true }, orderBy: { searchVolume: "desc" } },
      topicCluster: { include: { customer: true } },
    },
  });

  if (!topic) {
    return NextResponse.json({ error: "Thema nicht gefunden" }, { status: 404 });
  }

  // Existing outline check
  if (topic.outline) {
    return NextResponse.json(
      { error: "Für dieses Thema existiert bereits eine Outline" },
      { status: 409 }
    );
  }

  const customer = topic.topicCluster.customer;
  const keywords = topic.keywords;
  const mainKeyword = keywords[0]?.keyword ?? topic.title;
  const secondaryKeywords = keywords.slice(1, 6).map((k) => k.keyword);

  // TF*IDF data
  const tfidfData = parsed.data.tfidfCsv
    ? parseTFIDFCsv(parsed.data.tfidfCsv)
    : null;

  // Internal / external links
  const [internLinks, externLinks] = await Promise.all([
    findInternalLinks(customer.domain ?? "", topic.title),
    findExternalLinks(topic.title),
  ]);

  // Generate outline via AI
  const outlineResult = await generateOutline({
    thema: topic.title,
    mainKeyword,
    secondaryKeywords,
    tfidfTerme: tfidfData?.map((t) => t.term) ?? [],
    internLinks,
    externLinks,
    kundenGuidelines: customer.guidelinesText ?? "",
    beispieltext: customer.exampleText ?? "",
  });

  const outline = await prisma.outline.create({
    data: {
      topicId: topic.id,
      status: "new",
      mainKeyword,
      secondaryKeywords: JSON.stringify(secondaryKeywords),
      internalLinks: JSON.stringify(internLinks),
      externalLinks: JSON.stringify(externLinks),
      tfidfData: tfidfData ? JSON.stringify(tfidfData) : null,
      content: JSON.stringify(outlineResult),
    },
    include: {
      topic: { include: { topicCluster: { include: { customer: true } } } },
    },
  });

  return NextResponse.json(
    {
      ...outline,
      secondaryKeywords: parseJSON(outline.secondaryKeywords, []),
      internalLinks: parseJSON(outline.internalLinks, []),
      externalLinks: parseJSON(outline.externalLinks, []),
      tfidfData: parseJSON(outline.tfidfData, null),
      content: parseJSON(outline.content, {}),
    },
    { status: 201 }
  );
}
