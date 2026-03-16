/**
 * n8n Webhook endpoints for automated data ingestion.
 * All webhooks are authenticated with N8N_WEBHOOK_SECRET header.
 *
 * POST /api/lb/webhooks?type=snapshot     → Backlink snapshot
 * POST /api/lb/webhooks?type=mentions     → Brand mentions
 * POST /api/lb/webhooks?type=broken-links → Broken links
 * POST /api/lb/webhooks?type=contacts     → Contact data
 * POST /api/lb/webhooks?type=gap-results  → Gap analysis results
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

function verifyWebhookSecret(req: NextRequest): boolean {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) return false;
  const provided = req.headers.get("x-webhook-secret");
  return provided === secret;
}

// --- Schemas ---

const snapshotSchema = z.object({
  projectId: z.string(),
  totalBacklinks: z.number(),
  dofollowCount: z.number(),
  nofollowCount: z.number(),
  avgDR: z.number().optional(),
  referringDomains: z.number(),
  newBacklinks: z.number().optional(),
  lostBacklinks: z.number().optional(),
});

const mentionSchema = z.object({
  projectId: z.string(),
  sourceUrl: z.string().url(),
  sourceDomain: z.string(),
  title: z.string().optional(),
  snippet: z.string().optional(),
  hasLink: z.boolean().optional(),
  source: z.string().optional(),
});

const brokenLinkSchema = z.object({
  projectId: z.string(),
  sourceUrl: z.string().url(),
  sourceDomain: z.string(),
  brokenUrl: z.string().url(),
  anchorText: z.string().optional(),
  topicRelevance: z.number().optional(),
  suggestedUrl: z.string().optional(),
  httpStatus: z.number().optional(),
  domainRating: z.number().optional(),
});

const contactSchema = z.object({
  projectId: z.string(),
  contacts: z.array(
    z.object({
      domain: z.string(),
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      position: z.string().optional(),
      source: z.string().optional(),
    })
  ),
});

const gapResultSchema = z.object({
  projectId: z.string(),
  gaps: z.array(
    z.object({
      domain: z.string(),
      domainRating: z.number().optional(),
      totalBacklinks: z.number().optional(),
    })
  ),
});

export async function POST(req: NextRequest) {
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const body = await req.json();

  try {
    switch (type) {
      case "snapshot": {
        const data = snapshotSchema.parse(body);
        await prisma.lBBacklinkSnapshot.create({ data });
        return NextResponse.json({ success: true, type: "snapshot" });
      }

      case "mentions": {
        const data = mentionSchema.parse(body);
        await prisma.lBBrandMention.upsert({
          where: {
            projectId_sourceUrl: {
              projectId: data.projectId,
              sourceUrl: data.sourceUrl,
            },
          },
          create: {
            projectId: data.projectId,
            sourceUrl: data.sourceUrl,
            sourceDomain: data.sourceDomain,
            title: data.title ?? null,
            snippet: data.snippet ?? null,
            hasLink: data.hasLink ?? false,
            source: data.source ?? "n8n",
            status: "new",
          },
          update: {
            title: data.title ?? undefined,
            snippet: data.snippet ?? undefined,
          },
        });
        return NextResponse.json({ success: true, type: "mentions" });
      }

      case "broken-links": {
        const data = brokenLinkSchema.parse(body);
        await prisma.lBBrokenLink.create({
          data: {
            projectId: data.projectId,
            sourceUrl: data.sourceUrl,
            sourceDomain: data.sourceDomain,
            brokenUrl: data.brokenUrl,
            anchorText: data.anchorText ?? null,
            topicRelevance: data.topicRelevance ?? null,
            suggestedUrl: data.suggestedUrl ?? null,
            httpStatus: data.httpStatus ?? null,
            domainRating: data.domainRating ?? null,
          },
        });
        return NextResponse.json({ success: true, type: "broken-links" });
      }

      case "contacts": {
        const data = contactSchema.parse(body);
        let created = 0;
        for (const c of data.contacts) {
          await prisma.lBContact.create({
            data: {
              projectId: data.projectId,
              domain: c.domain,
              name: c.name ?? null,
              email: c.email ?? null,
              phone: c.phone ?? null,
              position: c.position ?? null,
              source: c.source ?? "n8n",
            },
          });
          created++;
        }
        return NextResponse.json({ success: true, type: "contacts", created });
      }

      case "gap-results": {
        const data = gapResultSchema.parse(body);
        let created = 0;
        for (const gap of data.gaps) {
          await prisma.lBCompetitor.create({
            data: {
              projectId: data.projectId,
              domain: gap.domain,
              domainRating: gap.domainRating ?? null,
              totalBacklinks: gap.totalBacklinks ?? null,
              isAISuggested: false,
              gapData: JSON.stringify(gap),
            },
          });
          created++;
        }
        return NextResponse.json({
          success: true,
          type: "gap-results",
          created,
        });
      }

      default:
        return NextResponse.json(
          {
            error:
              "Unbekannter Webhook-Typ. Erlaubt: snapshot, mentions, broken-links, contacts, gap-results",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
