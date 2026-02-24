/**
 * AI integration layer.
 * Uses real APIs when keys are configured, falls back to mocks for development.
 */

export interface AIResponse {
  content: string;
}

export interface ThemenRechercheParams {
  kundenname: string;
  kundenbeschreibung: string;
  themencluster: string;
  keywordListe: string;
  beispiele_conversion: string;
  beispiele_produktnah: string;
  beispiele_enger: string;
  beispiele_ferner: string;
}

export interface TopicSuggestion {
  category: "conversion" | "produktnah" | "enger" | "ferner";
  topics: string[];
}

export interface OutlineSection {
  h2: string;
  bullets: string[];
  keywords: string[];
  internalLinks: Array<{ url: string; anchor: string }>;
  externalLinks: Array<{ url: string; anchor: string }>;
}

export interface OutlineResult {
  sections: OutlineSection[];
  suggestedTitle: string;
}

async function callClaude(prompt: string): Promise<AIResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return mockAIResponse(prompt);
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return { content: content.text };
}

async function callOpenAI(prompt: string): Promise<AIResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return mockAIResponse(prompt);
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 4096,
  });

  return { content: response.choices[0]?.message?.content ?? "" };
}

export async function callAI(
  prompt: string,
  model: "claude" | "openai" = "claude"
): Promise<AIResponse> {
  if (model === "openai") return callOpenAI(prompt);
  return callClaude(prompt);
}

// ---------------------------------------------------------------------------
// Mock responses for development / testing
// ---------------------------------------------------------------------------

function mockAIResponse(prompt: string): AIResponse {
  if (prompt.includes("Themenrecherche") || prompt.includes("Ratgeberbereich")) {
    return { content: generateMockTopicXML() };
  }
  if (prompt.includes("SEO-Outline")) {
    return { content: generateMockOutlineJSON() };
  }
  if (prompt.includes("Sektion") && prompt.includes("Stichpunkte")) {
    return { content: generateMockSectionContent() };
  }
  if (prompt.includes("Stil des Beispieltexts")) {
    return { content: generateMockStyledContent() };
  }
  if (prompt.includes("Titel") && prompt.includes("Meta-Description")) {
    return { content: generateMockMeta() };
  }
  return {
    content:
      "Dies ist ein KI-generierter Platzhaltertext. In der Produktion wird hier echten KI-Content stehen.",
  };
}

function generateMockTopicXML(): string {
  return `<themenvorschlaege>
  <kategorie name="conversion">
    <thema>Hund humpelt – was tun?</thema>
    <thema>Tierarzt Kosten Hund Lahmheit</thema>
    <thema>Hund Pfote verletzt Behandlung</thema>
    <thema>Hund humpelt nach Spaziergang</thema>
    <thema>Gelenkschmerzen Hund Symptome</thema>
    <thema>Hund hinkt plötzlich</thema>
    <thema>Hund Bein schonen Tierarzt notwendig</thema>
    <thema>Hund Kreuzbandrisss erkennen</thema>
    <thema>Hund lahmt Notfall</thema>
    <thema>Hund Vorderbein hebt immer wieder</thema>
    <thema>Hund Schmerzen erkennen Lahmheit</thema>
    <thema>Tierarzt Hund Lahmheit Diagnose</thema>
    <thema>Hund Hüftdysplasie Behandlung</thema>
    <thema>Arthrosis Hund Schmerzmittel</thema>
    <thema>Hund verletzt Erste Hilfe</thema>
  </kategorie>
  <kategorie name="produktnah">
    <thema>Gelenkschutz Hund Tabletten</thema>
    <thema>Glucosamin Hund Erfahrungen</thema>
    <thema>Hund Bandage Pfote anlegen</thema>
    <thema>Orthopädisches Hundebett Empfehlung</thema>
    <thema>Hund Schmerzmittel Ibuprofen gefährlich</thema>
    <thema>Physiotherapie Hund zuhause</thema>
    <thema>Wärmepflaster Hund Gelenke</thema>
    <thema>Hund Rampe Treppe Gelenke schonen</thema>
    <thema>Futterergänzung Hund Gelenke Test</thema>
    <thema>Omega-3 Hund Gelenke</thema>
    <thema>Hund Rollstuhl Hinterlähmung</thema>
    <thema>Hund Laufband Physiotherapie</thema>
    <thema>CBD Öl Hund Schmerzen</thema>
    <thema>Hund Anti-Rutsch Socken Parkett</thema>
    <thema>Massagegerät Hund Muskel</thema>
  </kategorie>
  <kategorie name="enger">
    <thema>Hund Muskelzerrung Behandlung</thema>
    <thema>Pfotenverletzung Hund erkennen</thema>
    <thema>Hund Ellbogendysplasie</thema>
    <thema>Sprunggelenk Hund geschwollen</thema>
    <thema>Hund Arthritis Alter</thema>
    <thema>Bandscheibenvorfall Hund Symptome</thema>
    <thema>Osteochondrose Hund</thema>
    <thema>Hund Knorpelschaden</thema>
    <thema>Hund Patellastellung</thema>
    <thema>Großer Hund Gelenke schonen</thema>
    <thema>Hund nach OP Rehabilitation</thema>
    <thema>Welpe Bewegung Gelenke</thema>
    <thema>Übergewicht Hund Gelenke</thema>
    <thema>Hund Gangbild beurteilen</thema>
    <thema>Hund Schonhaltung erkennen</thema>
  </kategorie>
  <kategorie name="ferner">
    <thema>Hund altern Zeichen</thema>
    <thema>Hund Ernährung Gelenke</thema>
    <thema>Sport mit Hund Verletzungen vermeiden</thema>
    <thema>Hundeversicherung Operationen</thema>
    <thema>Tierarzt Wahl Orthopädie</thema>
    <thema>Hund Bewegung täglich Empfehlung</thema>
    <thema>Hundepension Hund verletzt</thema>
    <thema>Welpen Ernährung Knochen</thema>
    <thema>Hund schwimmen Gelenke</thema>
    <thema>Aquatherapie Hund</thema>
    <thema>Hund Gewicht kontrollieren</thema>
    <thema>Rassenspezifische Erkrankungen</thema>
    <thema>Hund Impfung Grundschutz</thema>
    <thema>Tierkrankenversicherung Vergleich</thema>
    <thema>Hund Vorsorge Untersuchung</thema>
  </kategorie>
</themenvorschlaege>`;
}

function generateMockOutlineJSON(): string {
  return JSON.stringify({
    suggestedTitle: "Hund humpelt – Ursachen, Diagnose und Behandlung",
    sections: [
      {
        h2: "Warum humpelt mein Hund? Die häufigsten Ursachen",
        bullets: [
          "Pfotenverletzungen (Schnitte, Fremdkörper, Verbrennungen)",
          "Muskelzerrungen nach intensiver Bewegung",
          "Gelenkerkrankungen wie Arthritis oder HD",
          "Kreuzbandriss als häufige Sportverletzung",
          "Knochenwachstumsstörungen bei Welpen",
        ],
        keywords: [
          "hund humpelt ursachen",
          "hund lahmt",
          "hund humpelt vorderbein",
        ],
        internalLinks: [],
        externalLinks: [
          {
            url: "https://www.tieraerztekammer.de",
            anchor: "Tierärztekammer Deutschland",
          },
        ],
      },
      {
        h2: "Wann ist sofortiger Tierarztbesuch notwendig?",
        bullets: [
          "Hund kann Bein gar nicht aufsetzen",
          "Sichtbare Wunden oder Knochenfehlstellungen",
          "Starke Schwellungen am Gelenk",
          "Fieber oder Apathie begleiten das Humpeln",
          "Symptome verschlechtern sich nach 24 Stunden",
        ],
        keywords: [
          "hund humpelt tierarzt",
          "hund lahmt notfall",
          "wann tierarzt hund",
        ],
        internalLinks: [],
        externalLinks: [],
      },
      {
        h2: "Diagnose: Was macht der Tierarzt?",
        bullets: [
          "Anamnese und klinische Untersuchung",
          "Gangbild-Analyse",
          "Röntgen zur Beurteilung von Knochen und Gelenken",
          "Blutbild bei Verdacht auf Entzündung",
          "MRT oder CT bei komplexen Befunden",
        ],
        keywords: [
          "hund lahmheit diagnose",
          "röntgen hund gelenk",
          "tierarzt untersuchung humpeln",
        ],
        internalLinks: [],
        externalLinks: [],
      },
      {
        h2: "Behandlung und Therapiemöglichkeiten",
        bullets: [
          "Medikamentöse Schmerztherapie und Entzündungshemmer",
          "Physiotherapie und Bewegungstherapie",
          "Operative Eingriffe bei Kreuzbandriss oder HD",
          "Nahrungsergänzung mit Glucosamin und Omega-3",
          "Gewichtsmanagement zur Gelenkentlastung",
        ],
        keywords: [
          "hund humpelt behandlung",
          "hund gelenk therapie",
          "glucosamin hund",
        ],
        internalLinks: [],
        externalLinks: [],
      },
    ],
  });
}

function generateMockSectionContent(): string {
  return `Wenn Ihr Hund plötzlich humpelt oder ein Bein schont, ist das für viele Hundebesitzer ein beunruhigendes Zeichen. Die Ursachen für eine Lahmheit beim Hund sind vielfältig und reichen von harmlosen Pfotenverletzungen bis hin zu ernsthaften Gelenkerkrankungen, die einer tierärztlichen Behandlung bedürfen.

Eine der häufigsten Ursachen ist eine **Verletzung der Pfote** – sei es ein Schnitt an einem Stein, ein eingewachsener Nagel oder ein Fremdkörper zwischen den Zehen. Gerade nach Spaziergängen im Unterholz oder auf rauem Untergrund sollten Sie die Pfoten Ihres Hundes regelmäßig kontrollieren.

Ebenso häufig sind **Muskelzerrungen und Prellungen**, die nach intensivem Spielen oder ungewöhnlichen Bewegungen auftreten können. Diese heilen meist innerhalb weniger Tage von selbst aus, wenn der Hund entsprechend geschont wird.

Bei älteren Hunden hingegen stecken häufig **degenerative Gelenkerkrankungen** wie Arthritis oder Hüftdysplasie hinter dem Humpeln. Diese chronischen Erkrankungen erfordern eine langfristige Behandlungsstrategie und regelmäßige Kontrollen beim Tierarzt.`;
}

function generateMockStyledContent(): string {
  return `Wenn Ihr Hund humpelt, ist schnelles Handeln wichtig – aber keine Panik. Zunächst sollten Sie Ihren Vierbeiner ruhig halten und die betroffene Stelle vorsichtig untersuchen. Schieben Sie das Fell beiseite und kontrollieren Sie die Pfote auf Verletzungen, Fremdkörper oder Schwellungen.

Zeigt Ihr Hund die Lahmheit bereits seit mehr als 24 Stunden oder weigert er sich, das Bein überhaupt aufzusetzen, ist ein Besuch beim Tierarzt unumgänglich. Auch wenn Sie sichtbare Wunden, Schwellungen oder Verformungen feststellen, sollten Sie nicht zögern.

**Unser Tipp:** Führen Sie kurze Spaziergänge ein und vermeiden Sie Treppensteigen, bis die Ursache geklärt ist. Legen Sie Ihrem Hund kein Schmerzmittel aus der Hausapotheke geben – viele für Menschen verträgliche Präparate sind für Hunde giftig.`;
}

function generateMockMeta(): string {
  return JSON.stringify({
    title: "Hund humpelt – Ursachen, Diagnose & Behandlung | Tiergesundheit",
    introduction:
      "Wenn Ihr Hund plötzlich humpelt oder ein Bein schont, ist das besorgniserregend. Wir erklären die häufigsten Ursachen und wann Sie sofort zum Tierarzt sollten.",
    metaDescription:
      "Hund humpelt? Erfahren Sie die häufigsten Ursachen, ab wann der Tierarzt notwendig ist und wie Lahmheit beim Hund behandelt wird. ✓ Expertenwissen ✓ Praxistipps",
    urlSlug: "hund-humpelt-ursachen-behandlung",
  });
}

// ---------------------------------------------------------------------------
// Topic Research
// ---------------------------------------------------------------------------

export async function generateTopicSuggestions(
  params: ThemenRechercheParams
): Promise<TopicSuggestion[]> {
  const prompt = buildThemenRecherchePrompt(params);
  const response = await callAI(prompt, "claude");
  return parseTopicXML(response.content);
}

function buildThemenRecherchePrompt(params: ThemenRechercheParams): string {
  return `Du bist SEO Berater für ${params.kundenname}.

Firma: ${params.kundenbeschreibung}

Erstelle einen Ratgeberbereich zum Thema: ${params.themencluster}

Keyword-Recherche: ${params.keywordListe}

Kategorien mit Beispielen:
1. Conversionnahe Themen: ${params.beispiele_conversion}
2. Produktnahe Themen: ${params.beispiele_produktnah}
3. Enger Themenbezug: ${params.beispiele_enger}
4. Ferner Themenbezug: ${params.beispiele_ferner}

WICHTIG:
- Pro Kategorie 15 Themen
- Kurze, prägnante Formulierung
- Ein repräsentatives Thema pro Suchintent
- Keine Füllwörter
- Ausgabe in XML-Tags für Parsing:

<themenvorschlaege>
  <kategorie name="conversion">
    <thema>...</thema>
  </kategorie>
  <kategorie name="produktnah">
    <thema>...</thema>
  </kategorie>
  <kategorie name="enger">
    <thema>...</thema>
  </kategorie>
  <kategorie name="ferner">
    <thema>...</thema>
  </kategorie>
</themenvorschlaege>`;
}

function parseTopicXML(xml: string): TopicSuggestion[] {
  const categories: Array<"conversion" | "produktnah" | "enger" | "ferner"> = [
    "conversion",
    "produktnah",
    "enger",
    "ferner",
  ];

  return categories.map((cat) => {
    const regex = new RegExp(
      `<kategorie name="${cat}"[^>]*>([\\s\\S]*?)<\\/kategorie>`,
      "i"
    );
    const match = xml.match(regex);
    const topics: string[] = [];

    if (match) {
      const themaRegex = /<thema>([^<]+)<\/thema>/gi;
      let m: RegExpExecArray | null;
      while ((m = themaRegex.exec(match[1])) !== null) {
        topics.push(m[1].trim());
      }
    }

    return { category: cat, topics };
  });
}

// ---------------------------------------------------------------------------
// Outline Generation
// ---------------------------------------------------------------------------

export async function generateOutline(params: {
  thema: string;
  mainKeyword: string;
  secondaryKeywords: string[];
  tfidfTerme: string[];
  internLinks: Array<{ url: string; anchor: string }>;
  externLinks: Array<{ url: string; anchor: string }>;
  kundenGuidelines: string;
  beispieltext: string;
}): Promise<OutlineResult> {
  const prompt = buildOutlinePrompt(params);
  const response = await callAI(prompt, "claude");

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as OutlineResult;
    }
  } catch {
    // fall through to mock
  }

  return JSON.parse(generateMockOutlineJSON()) as OutlineResult;
}

function buildOutlinePrompt(params: {
  thema: string;
  mainKeyword: string;
  secondaryKeywords: string[];
  tfidfTerme: string[];
  internLinks: Array<{ url: string; anchor: string }>;
  externLinks: Array<{ url: string; anchor: string }>;
  kundenGuidelines: string;
  beispieltext: string;
}): string {
  return `Erstelle eine SEO-Outline für: ${params.thema}

Main Keyword: ${params.mainKeyword}
Secondary Keywords: ${params.secondaryKeywords.join(", ")}

TF*IDF Terme (Top 100): ${params.tfidfTerme.slice(0, 100).join(", ")}

Interne Links: ${JSON.stringify(params.internLinks)}
Externe Links: ${JSON.stringify(params.externLinks)}

Guidelines: ${params.kundenGuidelines}
Beispieltext: ${params.beispieltext}

Struktur:
- Mehrere Abschnitte mit H2-Überschriften
- Pro Abschnitt: Stichpunkte, relevante Keywords, Links
- Keywords aus TF*IDF integrieren
- Tiefe basierend auf Beispieltext

Output als JSON:
{
  "suggestedTitle": "...",
  "sections": [
    {
      "h2": "...",
      "bullets": ["..."],
      "keywords": ["..."],
      "internalLinks": [{"url": "...", "anchor": "..."}],
      "externalLinks": [{"url": "...", "anchor": "..."}]
    }
  ]
}`;
}

// ---------------------------------------------------------------------------
// Content Generation
// ---------------------------------------------------------------------------

export async function generateSectionContent(params: {
  sektionTitel: string;
  sektionInhalt: string[];
  sektionKeywords: string[];
  sektionLinks: Array<{ url: string; anchor: string }>;
  kundenBeispieltext: string;
  kundenGuidelines: string;
}): Promise<string> {
  // Step 1: Generate content
  const contentPrompt = `Sektion: ${params.sektionTitel}
Stichpunkte: ${params.sektionInhalt.join("\n- ")}
Keywords: ${params.sektionKeywords.join(", ")}
Links: ${JSON.stringify(params.sektionLinks)}

Erstelle einen ausführlichen Text für diese Sektion.
Integriere alle Keywords natürlich.
Setze die Links mit den vorgegebenen Ankertexten.
Ausgabe nur den Fließtext, kein JSON.`;

  const contentResponse = await callAI(contentPrompt, "claude");

  // Step 2: Style adjustment
  const stylePrompt = `Text: ${contentResponse.content}
Beispieltext: ${params.kundenBeispieltext}
Guidelines: ${params.kundenGuidelines}

Passe den Text an den Stil des Beispieltexts an.
Achte auf Tonalität, Satzbau, Fachlichkeit.
Gib nur den angepassten Text zurück, kein JSON.`;

  const styleResponse = await callAI(stylePrompt, "claude");
  return styleResponse.content;
}

export async function generateMeta(params: {
  thema: string;
  sections: OutlineSection[];
  kundenname: string;
}): Promise<{
  title: string;
  introduction: string;
  metaDescription: string;
  urlSlug: string;
}> {
  const prompt = `Erstelle für folgenden SEO-Artikel:
Thema: ${params.thema}
Sektionen: ${params.sections.map((s) => s.h2).join(", ")}
Kundenname: ${params.kundenname}

Erstelle:
- Einen SEO-optimierten Titel (max 60 Zeichen)
- Eine Einleitung (2-3 Sätze)
- Eine Meta-Description (max 160 Zeichen)
- Einen URL-Slug (lowercase, mit Bindestrich)

Output als JSON:
{
  "title": "...",
  "introduction": "...",
  "metaDescription": "...",
  "urlSlug": "..."
}`;

  const response = await callAI(prompt, "claude");

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // fall through
  }

  return JSON.parse(generateMockMeta());
}

export async function refineWithFeedback(params: {
  entityType: "outline" | "theme" | "content";
  currentContent: string;
  feedback: string;
  history: Array<{ feedback: string; timestamp: number }>;
}): Promise<string> {
  const historyText = params.history
    .slice(-3)
    .map((h) => `- ${h.feedback}`)
    .join("\n");

  const prompt = `Du hast folgenden ${params.entityType} erstellt:
${params.currentContent}

Bisheriges Feedback:
${historyText}

Neues Feedback: ${params.feedback}

Überarbeite den Inhalt entsprechend dem Feedback.
Behalte die grundlegende Struktur bei, sofern nicht explizit anders gewünscht.
Gib den überarbeiteten Inhalt zurück.`;

  const response = await callAI(prompt, "claude");
  return response.content;
}
