import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

// Mock SERP analysis data
function generateMockSerpAnalysis(keyword: string) {
  const competitors = [
    { position: 1, title: `${keyword} - Der komplette Ratgeber 2026`, url: "https://example-health.de/ratgeber", description: `Alles was Sie über ${keyword} wissen müssen. Ursachen, Symptome und Behandlung im Überblick.` },
    { position: 2, title: `${keyword}: Ursachen & Tipps | Experten-Ratgeber`, url: "https://fachportal.de/artikel", description: `Erfahren Sie von Experten, was hinter ${keyword} steckt und welche Maßnahmen helfen.` },
    { position: 3, title: `Was tun bei ${keyword}? Sofortmaßnahmen erklärt`, url: "https://ratgeber-online.de/tipps", description: `Schnelle Hilfe bei ${keyword}. Diese Sofortmaßnahmen sollten Sie kennen.` },
    { position: 4, title: `${keyword} - Symptome richtig deuten`, url: "https://gesundheit-info.de/symptome", description: `Lernen Sie die Symptome bei ${keyword} richtig einzuordnen. Wann ist ein Arztbesuch nötig?` },
    { position: 5, title: `${keyword} behandeln: Die besten Methoden`, url: "https://behandlung-wiki.de/methoden", description: `Moderne Behandlungsmethoden bei ${keyword} im Vergleich. Was Studien zeigen.` },
    { position: 6, title: `Häufige Fragen zu ${keyword} beantwortet`, url: "https://faq-portal.de/fragen", description: `Die häufigsten Fragen und Antworten zum Thema ${keyword}.` },
    { position: 7, title: `${keyword} vorbeugen: 10 Tipps`, url: "https://vorsorge-magazin.de/tipps", description: `Mit diesen 10 einfachen Tipps können Sie ${keyword} effektiv vorbeugen.` },
    { position: 8, title: `Erfahrungsberichte: ${keyword}`, url: "https://community-health.de/erfahrungen", description: `Lesen Sie Erfahrungsberichte von Betroffenen zum Thema ${keyword}.` },
    { position: 9, title: `${keyword} - Wikipedia`, url: "https://de.wikipedia.org/wiki/artikel", description: `${keyword} bezeichnet... Allgemeine Informationen und Hintergründe.` },
    { position: 10, title: `${keyword} Kosten und Behandlung`, url: "https://kosten-check.de/behandlung", description: `Was kostet die Behandlung bei ${keyword}? Alle Infos zu Kosten und Kassenleistungen.` },
  ];
  return competitors;
}

function generateMockPAAQuestions(keyword: string) {
  return [
    `Was tun bei ${keyword}?`,
    `Wie lange dauert ${keyword}?`,
    `Wann sollte man zum Arzt bei ${keyword}?`,
    `Ist ${keyword} gefährlich?`,
    `Welche Hausmittel helfen bei ${keyword}?`,
    `Was sind die Ursachen für ${keyword}?`,
    `Kann man ${keyword} vorbeugen?`,
    `Welche Kosten entstehen bei ${keyword}?`,
  ];
}

function generateMockOutline(keyword: string) {
  return {
    sections: [
      {
        h2: `Was ist ${keyword}? Definition und Überblick`,
        bullets: [
          "Begriffserklärung und medizinische Einordnung",
          "Häufigkeit und betroffene Zielgruppen",
          "Abgrenzung zu verwandten Themen",
        ],
        keywords: [keyword, `${keyword} definition`, `${keyword} bedeutung`],
      },
      {
        h2: `Ursachen und Auslöser für ${keyword}`,
        bullets: [
          "Die häufigsten Ursachen im Überblick",
          "Risikofaktoren und Vorerkrankungen",
          "Äußere Einflussfaktoren",
          "Wann tritt das Problem typischerweise auf?",
        ],
        keywords: [`${keyword} ursachen`, `${keyword} auslöser`, `${keyword} gründe`],
      },
      {
        h2: `Symptome und Anzeichen erkennen`,
        bullets: [
          "Typische Symptome und deren Verlauf",
          "Warnsignale die sofortiges Handeln erfordern",
          "Unterscheidung akut vs. chronisch",
        ],
        keywords: [`${keyword} symptome`, `${keyword} anzeichen`, `${keyword} erkennen`],
      },
      {
        h2: `Diagnose: Wann zum Experten?`,
        bullets: [
          "Selbstbeurteilung vs. professionelle Diagnose",
          "Ablauf der Untersuchung",
          "Typische Diagnoseverfahren",
        ],
        keywords: [`${keyword} diagnose`, `${keyword} untersuchung`, `wann arzt ${keyword}`],
      },
      {
        h2: `Behandlung und Therapiemöglichkeiten`,
        bullets: [
          "Konservative Behandlungsansätze",
          "Medikamentöse Therapie",
          "Alternative und ergänzende Methoden",
          "Operative Eingriffe als letzte Option",
        ],
        keywords: [`${keyword} behandlung`, `${keyword} therapie`, `${keyword} hilfe`],
      },
      {
        h2: `Vorbeugung und Prävention`,
        bullets: [
          "Alltagstipps zur Vorbeugung",
          "Ernährung und Lebensstil",
          "Regelmäßige Vorsorge",
        ],
        keywords: [`${keyword} vorbeugen`, `${keyword} prävention`, `${keyword} vermeiden`],
      },
      {
        h2: `Häufig gestellte Fragen (FAQ)`,
        bullets: [
          "Die wichtigsten Fragen und Antworten",
          "Mythen und Irrtümer aufklären",
          "Weiterführende Ressourcen",
        ],
        keywords: [`${keyword} faq`, `${keyword} fragen`],
      },
    ],
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");

  const where = customerId ? { customerId } : {};

  const articles = await prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { companyName: true } },
    },
  });

  return NextResponse.json(articles);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { keyword, customerId } = body as { keyword: string; customerId: string };

  if (!keyword || !customerId) {
    return NextResponse.json(
      { error: "Keyword und Kunde sind erforderlich" },
      { status: 400 }
    );
  }

  // Generate mock data
  const serpAnalysis = generateMockSerpAnalysis(keyword);
  const paaQuestions = generateMockPAAQuestions(keyword);
  const outline = generateMockOutline(keyword);

  const article = await prisma.article.create({
    data: {
      keyword,
      customerId,
      status: "outline",
      title: `${keyword} - Ratgeber und Tipps`,
      metaDescription: `Erfahren Sie alles Wichtige über ${keyword}. Ursachen, Symptome, Behandlung und Tipps von Experten.`,
      permalink: slugify(keyword),
      outlineContent: JSON.stringify(outline),
      outlineFeedback: JSON.stringify([]),
      contentFeedback: JSON.stringify([]),
      comments: JSON.stringify([]),
      serpAnalysis: JSON.stringify(serpAnalysis),
      paaQuestions: JSON.stringify(paaQuestions),
    },
    include: {
      customer: { select: { companyName: true } },
    },
  });

  return NextResponse.json(article, { status: 201 });
}
