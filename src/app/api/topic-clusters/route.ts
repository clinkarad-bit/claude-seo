import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { generateTopicSuggestions } from "@/lib/ai";

const createSchema = z.object({
  customerId: z.string().min(1),
  name: z.string().min(1),
  keywordList: z.string(),
  exampleConversion: z.string().default(""),
  exampleProduktnah: z.string().default(""),
  exampleEnger: z.string().default(""),
  exampleFerner: z.string().default(""),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  const clusters = await prisma.topicCluster.findMany({
    where: customerId ? { customerId } : undefined,
    include: {
      customer: true,
      _count: { select: { topics: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clusters);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: parsed.data.customerId },
  });

  if (!customer) {
    return NextResponse.json({ error: "Kunde nicht gefunden" }, { status: 404 });
  }

  // Create the cluster
  const cluster = await prisma.topicCluster.create({
    data: {
      customerId: parsed.data.customerId,
      name: parsed.data.name,
      status: "in_progress",
    },
  });

  // Generate topic suggestions via AI
  const suggestions = await generateTopicSuggestions({
    kundenname: customer.companyName,
    kundenbeschreibung: customer.description,
    themencluster: parsed.data.name,
    keywordListe: parsed.data.keywordList,
    beispiele_conversion: parsed.data.exampleConversion,
    beispiele_produktnah: parsed.data.exampleProduktnah,
    beispiele_enger: parsed.data.exampleEnger,
    beispiele_ferner: parsed.data.exampleFerner,
  });

  // Save topics to database
  if (suggestions.length > 0) {
    await prisma.topic.createMany({
      data: suggestions.flatMap((s) =>
        s.topics.map((title) => ({
          topicClusterId: cluster.id,
          title,
          category: s.category,
        }))
      ),
    });
  }

  const clusterWithTopics = await prisma.topicCluster.findUnique({
    where: { id: cluster.id },
    include: {
      topics: true,
      customer: true,
    },
  });

  return NextResponse.json(clusterWithTopics, { status: 201 });
}
