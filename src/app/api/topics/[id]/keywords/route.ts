import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuggestKeywords } from "@/lib/seo";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const keywords = await prisma.keyword.findMany({
    where: { topicId: params.id },
    orderBy: { searchVolume: "desc" },
  });
  return NextResponse.json(keywords);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const topic = await prisma.topic.findUnique({ where: { id: params.id } });
  if (!topic) {
    return NextResponse.json({ error: "Thema nicht gefunden" }, { status: 404 });
  }

  // Check for existing keywords to avoid duplicates
  const existing = await prisma.keyword.findMany({
    where: { topicId: params.id },
    select: { keyword: true },
  });
  const existingSet = new Set(existing.map((k) => k.keyword.toLowerCase()));

  // Fetch keyword suggestions
  const suggestions = await getSuggestKeywords(topic.title);
  const newKeywords = suggestions.filter(
    (s) => !existingSet.has(s.keyword.toLowerCase())
  );

  if (newKeywords.length > 0) {
    await prisma.keyword.createMany({
      data: newKeywords.map((kw) => ({
        topicId: params.id,
        keyword: kw.keyword,
        searchVolume: kw.searchVolume,
        cpc: kw.cpc,
        relevant: true,
      })),
    });
  }

  // Update topic stats
  const allKeywords = await prisma.keyword.findMany({
    where: { topicId: params.id },
  });
  const totalVolume = allKeywords.reduce((s, k) => s + k.searchVolume, 0);
  const avgCpc =
    allKeywords.length > 0
      ? allKeywords.reduce((s, k) => s + k.cpc, 0) / allKeywords.length
      : 0;

  await prisma.topic.update({
    where: { id: params.id },
    data: {
      keywordCount: allKeywords.length,
      searchVolumeTotal: totalVolume,
      avgCpc,
      lastUpdated: new Date(),
    },
  });

  return NextResponse.json(allKeywords);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { keywordId, ...updates } = await req.json();
  const keyword = await prisma.keyword.update({
    where: { id: keywordId, topicId: params.id },
    data: updates,
  });
  return NextResponse.json(keyword);
}
