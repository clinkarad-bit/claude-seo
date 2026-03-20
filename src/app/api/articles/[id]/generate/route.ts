import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseJSON } from "@/lib/utils";

interface OutlineSection {
  h2: string;
  bullets: string[];
  keywords: string[];
}

function generateMockArticleContent(
  keyword: string,
  title: string,
  sections: OutlineSection[]
): string {
  const intro = `# ${title}

Wenn Sie sich mit dem Thema **${keyword}** auseinandersetzen, sind Sie hier genau richtig. In diesem umfassenden Ratgeber erfahren Sie alles Wichtige – von den grundlegenden Hintergründen bis hin zu konkreten Handlungsempfehlungen. Unser Ziel ist es, Ihnen fundierte Informationen an die Hand zu geben, damit Sie die bestmöglichen Entscheidungen treffen können.

---

`;

  let content = intro;

  for (const section of sections) {
    content += `## ${section.h2}\n\n`;

    // Generate 2-3 paragraphs per section based on bullets
    for (let i = 0; i < section.bullets.length; i++) {
      const bullet = section.bullets[i];
      content += generateParagraphFromBullet(bullet, section.keywords, i);
      content += "\n\n";
    }

    // Add a keyword-rich connecting sentence
    if (section.keywords.length > 0) {
      content += `> **Wichtig:** Besonders im Zusammenhang mit *${section.keywords[0]}* sollten Sie die oben genannten Punkte beachten.\n\n`;
    }

    content += "---\n\n";
  }

  // Add FAQ section
  content += `## Häufig gestellte Fragen zu ${keyword}

### Wie lange dauert die Behandlung bei ${keyword}?

Die Dauer hängt stark von der individuellen Situation ab. In leichten Fällen können die Symptome innerhalb weniger Tage abklingen. Bei chronischen Verläufen ist eine langfristige Betreuung empfehlenswert.

### Welche Kosten kommen auf mich zu?

Die Kosten variieren je nach Behandlungsmethode und -umfang. Viele Leistungen werden von den Krankenkassen übernommen. Informieren Sie sich vorab bei Ihrem Versicherer.

### Kann ich selbst etwas tun?

Ja, es gibt zahlreiche Maßnahmen, die Sie selbst ergreifen können. Regelmäßige Bewegung, eine ausgewogene Ernährung und Stressreduktion sind wichtige Bausteine der Prävention.

---

## Fazit

${keyword} ist ein Thema, das viele Menschen betrifft. Mit dem richtigen Wissen und den passenden Maßnahmen lassen sich die meisten Herausforderungen gut bewältigen. Zögern Sie nicht, professionelle Hilfe in Anspruch zu nehmen, wenn Sie unsicher sind. Je früher Sie handeln, desto besser sind in der Regel die Ergebnisse.

*Zuletzt aktualisiert: ${new Date().toLocaleDateString("de-DE")}*
`;

  return content;
}

function generateParagraphFromBullet(
  bullet: string,
  keywords: string[],
  index: number
): string {
  const templates = [
    `**${bullet}** ist ein zentraler Aspekt, den Sie nicht unterschätzen sollten. Experten betonen immer wieder, wie wichtig es ist, diesen Punkt frühzeitig zu berücksichtigen. Studien zeigen, dass eine proaktive Herangehensweise die Ergebnisse deutlich verbessern kann.`,
    `Beim Thema *${bullet}* gibt es einige wichtige Punkte zu beachten. Zunächst sollten Sie sich einen Überblick über die verschiedenen Möglichkeiten verschaffen. Eine individuelle Beratung kann dabei helfen, die für Sie passende Lösung zu finden.`,
    `${bullet} – dieses Thema beschäftigt viele Betroffene. Die gute Nachricht: Es gibt bewährte Strategien und Methoden, die nachweislich helfen. Wichtig ist dabei, geduldig zu bleiben und den eingeschlagenen Weg konsequent zu verfolgen.`,
    `Ein weiterer wichtiger Aspekt ist ${bullet.toLowerCase()}. Hier zeigt sich, dass eine Kombination verschiedener Ansätze oft die besten Resultate liefert. Sprechen Sie mit Ihrem Experten über die verschiedenen Optionen.`,
    `Nicht zu vergessen: ${bullet.toLowerCase()}. Viele unterschätzen die Bedeutung dieses Punktes. Dabei kann gerade hier eine frühzeitige Intervention den entscheidenden Unterschied machen.`,
  ];

  let paragraph = templates[index % templates.length];

  // Integrate a keyword naturally if available
  if (keywords.length > 0 && index < keywords.length) {
    paragraph += ` Im Kontext von *${keywords[index]}* ist dies besonders relevant.`;
  }

  return paragraph;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    return NextResponse.json({ error: "Artikel nicht gefunden" }, { status: 404 });
  }

  if (article.status !== "outline_approved" && article.status !== "outline") {
    return NextResponse.json(
      { error: "Artikel muss im Status 'outline_approved' sein" },
      { status: 400 }
    );
  }

  // Set status to "writing"
  await prisma.article.update({
    where: { id },
    data: { status: "writing" },
  });

  // Parse outline
  const outline = parseJSON<{ sections: OutlineSection[] }>(
    article.outlineContent,
    { sections: [] }
  );

  // Generate mock article content
  const generatedContent = generateMockArticleContent(
    article.keyword,
    article.title || article.keyword,
    outline.sections
  );

  // Count words
  const wordCount = generatedContent
    .replace(/[#*>\-_|`]/g, "")
    .split(/\s+/)
    .filter(Boolean).length;

  // Update article with generated content
  const updated = await prisma.article.update({
    where: { id },
    data: {
      content: generatedContent,
      status: "draft",
      wordCount,
    },
    include: {
      customer: { select: { companyName: true, domain: true } },
    },
  });

  return NextResponse.json(updated);
}
