import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { extractTextFromPDF } from "@/lib/pdf";

const createSchema = z.object({
  companyName: z.string().min(1),
  description: z.string().min(1),
  domain: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { topicClusters: true } },
    },
  });
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return handleFormDataPost(req);
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const customer = await prisma.customer.create({
    data: {
      companyName: parsed.data.companyName,
      description: parsed.data.description,
      domain: parsed.data.domain || null,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}

async function handleFormDataPost(req: NextRequest) {
  const formData = await req.formData();

  const companyName = formData.get("companyName") as string;
  const description = formData.get("description") as string;
  const domain = (formData.get("domain") as string) || null;
  const guidelinesFile = formData.get("guidelinesPdf") as File | null;
  const exampleFile = formData.get("exampleTextPdf") as File | null;

  if (!companyName || !description) {
    return NextResponse.json(
      { error: "companyName and description are required" },
      { status: 400 }
    );
  }

  let guidelinesPdf: string | null = null;
  let guidelinesText: string | null = null;
  let exampleTextPdf: string | null = null;
  let exampleText: string | null = null;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  if (guidelinesFile && guidelinesFile.size > 0) {
    const buffer = Buffer.from(await guidelinesFile.arrayBuffer());
    const fileName = `${Date.now()}-${guidelinesFile.name}`;
    await writeFile(path.join(uploadDir, fileName), buffer);
    guidelinesPdf = `/uploads/${fileName}`;
    try {
      guidelinesText = await extractTextFromPDF(buffer);
    } catch {
      guidelinesText = null;
    }
  }

  if (exampleFile && exampleFile.size > 0) {
    const buffer = Buffer.from(await exampleFile.arrayBuffer());
    const fileName = `${Date.now()}-${exampleFile.name}`;
    await writeFile(path.join(uploadDir, fileName), buffer);
    exampleTextPdf = `/uploads/${fileName}`;
    try {
      exampleText = await extractTextFromPDF(buffer);
    } catch {
      exampleText = null;
    }
  }

  const customer = await prisma.customer.create({
    data: {
      companyName,
      description,
      domain,
      guidelinesPdf,
      guidelinesText,
      exampleTextPdf,
      exampleText,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}
