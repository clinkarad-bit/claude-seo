/**
 * Parse all DataForSEO results and create comprehensive keyword analysis
 */
import * as fs from "fs";
import * as path from "path";

const RESULTS_DIR = "/home/user/claude-seo/scripts/results";

const clusterNames: Record<string, string> = {
  "01_heizkostenabrechnung": "Heizkostenabrechnung allgemein",
  "02_messdienst": "Messdienst allgemein",
  "03_messtechnik": "Messtechnik Produkte",
  "04_muenchen": "Messdienst lokal München",
  "05_hausverwaltung": "Zielgruppe Hausverwaltung",
  "06_eigentuemer": "Zielgruppe Eigentümer",
  "07_bautraeger": "Zielgruppe Bauträger",
  "08_wechsel": "Wechsel / Unzufriedenheit",
};

interface ParsedKeyword {
  keyword: string;
  cluster: string;
  searchVolume: number;
  cpc: number;
  competitionIndex: number;
  competitionLevel: string;
  lowBid: number;
  highBid: number;
}

function parseFile(filename: string, cluster: string): ParsedKeyword[] {
  const filepath = path.join(RESULTS_DIR, filename + ".json");
  const raw = fs.readFileSync(filepath, "utf-8");
  const data = JSON.parse(raw);

  const results = data?.tasks?.[0]?.result ?? [];
  return results.map((item: any) => ({
    keyword: item.keyword,
    cluster,
    searchVolume: item.search_volume ?? 0,
    cpc: item.cpc ?? 0,
    competitionIndex: item.competition_index ?? 0,
    competitionLevel: item.competition ?? "UNKNOWN",
    lowBid: item.low_top_of_page_bid ?? 0,
    highBid: item.high_top_of_page_bid ?? 0,
  }));
}

// Determine search intent
function getIntent(kw: string): string {
  const transactional = ["wechseln", "kündigen", "bestellen", "buchen", "kaufen", "erstellen lassen", "anbieter wechseln", "alternative"];
  const commercial = ["vergleich", "kosten", "preis", "anbieter", "dienstleister", "firma", "service", "alternative", "münchen", "bayern", "stuttgart", "oberbayern", "süddeutschland"];
  const navigational = ["techem", "ista", "brunata", "minol", "apv"];

  const kwLower = kw.toLowerCase();

  if (navigational.some(n => kwLower.includes(n) && !kwLower.includes("alternative"))) return "navigational";
  if (transactional.some(t => kwLower.includes(t))) return "transactional";
  if (commercial.some(c => kwLower.includes(c))) return "commercial";
  return "informational";
}

// Determine relevance for apv messtecc
function getRelevance(kw: string, cluster: string, sv: number): string {
  const kwLower = kw.toLowerCase();
  // High relevance: core services + local + target audiences + switching
  if (cluster.includes("München") || cluster.includes("lokal")) return "hoch";
  if (cluster.includes("Wechsel")) return "hoch";
  if (cluster.includes("Hausverwaltung")) return "hoch";
  if (kwLower.includes("münchen") || kwLower.includes("bayern")) return "hoch";
  if (kwLower.includes("messdienst") && (kwLower.includes("wechsel") || kwLower.includes("alternative"))) return "hoch";
  if (kwLower.includes("heizkostenabrechnung") && (kwLower.includes("erstellen") || kwLower.includes("dienstleister") || kwLower.includes("anbieter") || kwLower.includes("service"))) return "hoch";
  if (kwLower.includes("hausverwaltung") || kwLower.includes("weg")) return "hoch";
  if (kwLower.includes("mehrfamilienhaus") || kwLower.includes("vermieter")) return "hoch";
  if (cluster.includes("Eigentümer")) return "hoch";
  if (cluster.includes("Bauträger")) return "mittel";
  if (kwLower.includes("neubau")) return "mittel";

  // Generic high-volume informational keywords
  if (sv > 5000 && !kwLower.includes("münchen")) return "mittel";
  if (kwLower.includes("ablesen") || kwLower.includes("funktion") || kwLower.includes("eichung")) return "niedrig";
  if (kwLower.includes("pflicht") && !kwLower.includes("vermieter")) return "niedrig";

  return "mittel";
}

// Page type recommendation
function getPageType(kw: string, intent: string, cluster: string): string {
  if (intent === "transactional" || intent === "commercial") {
    if (kw.includes("münchen") || kw.includes("bayern") || kw.includes("stuttgart")) return "Landingpage (lokal)";
    if (kw.includes("hausverwaltung") || kw.includes("weg")) return "Landingpage (Zielgruppe)";
    if (kw.includes("vermieter") || kw.includes("eigentümer") || kw.includes("mehrfamilienhaus")) return "Landingpage (Zielgruppe)";
    if (kw.includes("wechsel") || kw.includes("alternative") || kw.includes("kündigen")) return "Landingpage (Wechsel)";
    if (kw.includes("neubau") || kw.includes("erstausstattung") || kw.includes("bauträger")) return "Landingpage (Bauträger)";
    return "Landingpage (Leistung)";
  }
  if (kw.includes("fehler") || kw.includes("fehlerhaft") || kw.includes("zu hoch") || kw.includes("prüfen") || kw.includes("reklamation") || kw.includes("widerspruch") || kw.includes("beschwerde")) return "Ratgeber/Blog";
  if (kw.includes("pflicht") || kw.includes("verordnung") || kw.includes("funktion") || kw.includes("ablesen") || kw.includes("eichung")) return "Ratgeber/Blog";
  if (intent === "informational") return "Ratgeber/Blog";
  return "Landingpage (Leistung)";
}

// Parse all files
const allKeywords: ParsedKeyword[] = [];
for (const [file, cluster] of Object.entries(clusterNames)) {
  try {
    const results = parseFile(file, cluster);
    allKeywords.push(...results);
  } catch (e) {
    console.error(`Error parsing ${file}:`, e);
  }
}

// Sort by search volume
allKeywords.sort((a, b) => b.searchVolume - a.searchVolume);

// === OUTPUT ===

console.log("# Keyword-Recherche apv messtecc – DataForSEO Echte Daten\n");
console.log(`Abfragedatum: ${new Date().toISOString().split("T")[0]}`);
console.log(`Gesamt Keywords: ${allKeywords.length}`);
console.log(`Location: Deutschland (2276), Sprache: Deutsch\n`);

// Full table
console.log("## Vollständige Keyword-Tabelle\n");
console.log("| Keyword | SV/Monat | CPC (€) | KD (0-100) | Wettbewerb | Suchintention | Cluster | Relevanz | Seitentyp |");
console.log("|---|---|---|---|---|---|---|---|---|");

for (const kw of allKeywords) {
  const intent = getIntent(kw.keyword);
  const relevance = getRelevance(kw.keyword, kw.cluster, kw.searchVolume);
  const pageType = getPageType(kw.keyword, intent, kw.cluster);

  console.log(
    `| ${kw.keyword} | ${kw.searchVolume.toLocaleString("de-DE")} | ${kw.cpc.toFixed(2)} | ${kw.competitionIndex} | ${kw.competitionLevel} | ${intent} | ${kw.cluster} | ${relevance} | ${pageType} |`
  );
}

// TOP 20 Priority Keywords
console.log("\n\n## TOP 20 Priority Keywords (bestes Verhältnis SV / KD / Relevanz)\n");

// Score: high SV, low competition, high relevance
const scored = allKeywords.map(kw => {
  const intent = getIntent(kw.keyword);
  const relevance = getRelevance(kw.keyword, kw.cluster, kw.searchVolume);
  const relevanceScore = relevance === "hoch" ? 3 : relevance === "mittel" ? 2 : 1;
  const svScore = Math.log10(Math.max(kw.searchVolume, 1)) * 10;
  const kdPenalty = kw.competitionIndex * 0.3;
  const intentBonus = intent === "transactional" ? 15 : intent === "commercial" ? 10 : 0;
  const score = svScore * relevanceScore + intentBonus - kdPenalty;
  return { ...kw, intent, relevance, score, pageType: getPageType(kw.keyword, intent, kw.cluster) };
});

scored.sort((a, b) => b.score - a.score);

console.log("| # | Keyword | SV/Monat | CPC (€) | KD | Wettbewerb | Intention | Cluster | Relevanz | Seitentyp | Score |");
console.log("|---|---|---|---|---|---|---|---|---|---|---|");

scored.slice(0, 20).forEach((kw, i) => {
  console.log(
    `| ${i + 1} | **${kw.keyword}** | ${kw.searchVolume.toLocaleString("de-DE")} | ${kw.cpc.toFixed(2)} | ${kw.competitionIndex} | ${kw.competitionLevel} | ${kw.intent} | ${kw.cluster} | ${kw.relevance} | ${kw.pageType} | ${kw.score.toFixed(1)} |`
  );
});

// Wechsel-Keywords
console.log("\n\n## Keywords für wechselwillige Kunden\n");
const switchKeywords = scored.filter(kw =>
  kw.cluster.includes("Wechsel") ||
  kw.keyword.includes("alternative") ||
  kw.keyword.includes("wechsel") ||
  kw.keyword.includes("fehler") ||
  kw.keyword.includes("zu hoch") ||
  kw.keyword.includes("prüfen") ||
  kw.keyword.includes("unzufrieden")
);
switchKeywords.sort((a, b) => b.searchVolume - a.searchVolume);

console.log("| Keyword | SV/Monat | CPC (€) | KD | Intention | Relevanz | Seitentyp |");
console.log("|---|---|---|---|---|---|---|");
switchKeywords.forEach(kw => {
  console.log(
    `| ${kw.keyword} | ${kw.searchVolume.toLocaleString("de-DE")} | ${kw.cpc.toFixed(2)} | ${kw.competitionIndex} | ${kw.intent} | ${kw.relevance} | ${kw.pageType} |`
  );
});

// Cluster summary
console.log("\n\n## Cluster-Zusammenfassung\n");
console.log("| Cluster | Anzahl KW | Ø SV | Ø CPC | Ø KD | Top-Keyword (SV) |");
console.log("|---|---|---|---|---|---|");

for (const cluster of Object.values(clusterNames)) {
  const clusterKws = allKeywords.filter(kw => kw.cluster === cluster);
  if (clusterKws.length === 0) continue;
  const avgSV = Math.round(clusterKws.reduce((s, k) => s + k.searchVolume, 0) / clusterKws.length);
  const avgCPC = (clusterKws.reduce((s, k) => s + k.cpc, 0) / clusterKws.length).toFixed(2);
  const avgKD = Math.round(clusterKws.reduce((s, k) => s + k.competitionIndex, 0) / clusterKws.length);
  const topKw = clusterKws.sort((a, b) => b.searchVolume - a.searchVolume)[0];
  console.log(`| ${cluster} | ${clusterKws.length} | ${avgSV.toLocaleString("de-DE")} | ${avgCPC}€ | ${avgKD} | ${topKw.keyword} (${topKw.searchVolume.toLocaleString("de-DE")}) |`);
}

// Save full JSON
fs.writeFileSync(
  "/home/user/claude-seo/scripts/keyword-analysis-full.json",
  JSON.stringify(scored, null, 2)
);
console.log("\n\nVollständige Daten gespeichert in: scripts/keyword-analysis-full.json");
