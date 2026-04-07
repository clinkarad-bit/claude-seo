/**
 * Generate XLSX with all keyword data including extended "Wechsel" keywords
 */
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

const RESULTS_DIR = "/home/user/claude-seo/scripts/results";

interface KWResult {
  keyword: string;
  cluster: string;
  searchVolume: number;
  cpc: number;
  competitionIndex: number;
  competitionLevel: string;
  lowBid: number;
  highBid: number;
}

// Parse DataForSEO search_volume response
function parseSearchVolume(filepath: string, cluster: string): KWResult[] {
  try {
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
  } catch (e) {
    console.error(`Error parsing ${filepath}:`, e);
    return [];
  }
}

// Parse DataForSEO keywords_for_keywords (suggestion) response
function parseSuggestions(filepath: string, cluster: string): KWResult[] {
  try {
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
  } catch (e) {
    console.error(`Error parsing ${filepath}:`, e);
    return [];
  }
}

function getIntent(kw: string): string {
  const transactional = ["wechseln", "kündigen", "bestellen", "buchen", "kaufen", "erstellen lassen", "anbieter wechseln", "alternative", "vertrag kündigen"];
  const commercial = ["vergleich", "kosten", "preis", "preise", "anbieter", "dienstleister", "firma", "service", "münchen", "bayern", "stuttgart", "erfahrungen", "bewertung", "empfehlung", "günstig", "bester"];
  const navigational = ["techem", "ista", "brunata", "minol", "apv"];
  const kwLower = kw.toLowerCase();

  // "alternative" overrides navigational
  if (transactional.some(t => kwLower.includes(t))) return "transactional";
  if (navigational.some(n => kwLower.includes(n)) && !transactional.some(t => kwLower.includes(t))) {
    if (commercial.some(c => kwLower.includes(c))) return "commercial";
    return "navigational";
  }
  if (commercial.some(c => kwLower.includes(c))) return "commercial";
  return "informational";
}

function getRelevance(kw: string, cluster: string): string {
  const kwLower = kw.toLowerCase();
  if (cluster.includes("München") || cluster.includes("lokal")) return "hoch";
  if (cluster.includes("Wechsel")) return "hoch";
  if (cluster.includes("Hausverwaltung")) return "hoch";
  if (kwLower.includes("münchen") || kwLower.includes("bayern")) return "hoch";
  if (kwLower.includes("wechsel") || kwLower.includes("alternative") || kwLower.includes("kündigen")) return "hoch";
  if (kwLower.includes("hausverwaltung") || kwLower.includes("weg")) return "hoch";
  if (kwLower.includes("mehrfamilienhaus") || kwLower.includes("vermieter")) return "hoch";
  if (kwLower.includes("messdienst") || kwLower.includes("messdienstleister")) return "hoch";
  if (kwLower.includes("heizkostenabrechnung") && (kwLower.includes("erstellen") || kwLower.includes("dienstleister") || kwLower.includes("anbieter") || kwLower.includes("service"))) return "hoch";
  if (cluster.includes("Eigentümer")) return "hoch";
  if (cluster.includes("Bauträger")) return "mittel";
  if (kwLower.includes("fehler") || kwLower.includes("falsch") || kwLower.includes("zu hoch") || kwLower.includes("prüfen") || kwLower.includes("beschwerde") || kwLower.includes("probleme")) return "hoch";
  if (kwLower.includes("erfahrungen") || kwLower.includes("bewertung") || kwLower.includes("vergleich")) return "hoch";
  if (kwLower.includes("ablesen") || kwLower.includes("funktion") || kwLower.includes("eichung")) return "niedrig";
  return "mittel";
}

function getPageType(kw: string, intent: string): string {
  const kwLower = kw.toLowerCase();
  if (kwLower.includes("wechsel") || kwLower.includes("alternative") || kwLower.includes("kündigen")) return "Landingpage (Wechsel)";
  if (kwLower.includes("münchen") || kwLower.includes("bayern") || kwLower.includes("stuttgart")) return "Landingpage (lokal)";
  if (kwLower.includes("hausverwaltung") || kwLower.includes("weg")) return "Landingpage (Zielgruppe)";
  if (kwLower.includes("vermieter") || kwLower.includes("eigentümer") || kwLower.includes("mehrfamilienhaus")) return "Landingpage (Zielgruppe)";
  if (kwLower.includes("neubau") || kwLower.includes("erstausstattung") || kwLower.includes("bauträger")) return "Landingpage (Bauträger)";
  if (kwLower.includes("fehler") || kwLower.includes("fehlerhaft") || kwLower.includes("falsch") || kwLower.includes("zu hoch") || kwLower.includes("prüfen") || kwLower.includes("reklamation") || kwLower.includes("widerspruch") || kwLower.includes("beschwerde") || kwLower.includes("beanstanden") || kwLower.includes("korrigieren") || kwLower.includes("nachprüfen") || kwLower.includes("überprüfen")) return "Ratgeber/Blog";
  if (kwLower.includes("pflicht") || kwLower.includes("verordnung") || kwLower.includes("funktion") || kwLower.includes("ablesen") || kwLower.includes("eichung") || kwLower.includes("senken")) return "Ratgeber/Blog";
  if (kwLower.includes("erfahrungen") || kwLower.includes("bewertung") || kwLower.includes("probleme")) return "Ratgeber/Blog";
  if (kwLower.includes("vergleich") || kwLower.includes("empfehlung") || kwLower.includes("bester") || kwLower.includes("welcher")) return "Ratgeber/Blog";
  if (intent === "transactional" || intent === "commercial") return "Landingpage (Leistung)";
  return "Ratgeber/Blog";
}

// ===== Load all data =====

const clusterFiles: [string, string][] = [
  ["01_heizkostenabrechnung.json", "Heizkostenabrechnung allgemein"],
  ["02_messdienst.json", "Messdienst allgemein"],
  ["03_messtechnik.json", "Messtechnik Produkte"],
  ["04_muenchen.json", "Messdienst lokal München"],
  ["05_hausverwaltung.json", "Zielgruppe Hausverwaltung"],
  ["06_eigentuemer.json", "Zielgruppe Eigentümer"],
  ["07_bautraeger.json", "Zielgruppe Bauträger"],
  ["08_wechsel.json", "Wechsel / Unzufriedenheit"],
];

const allKeywords: KWResult[] = [];

// Original clusters
for (const [file, cluster] of clusterFiles) {
  allKeywords.push(...parseSearchVolume(path.join(RESULTS_DIR, file), cluster));
}

// Wechsel suggestions
for (const f of ["09_wechsel_suggest1.json", "09_wechsel_suggest2.json", "09_wechsel_suggest3.json", "09_wechsel_suggest4.json"]) {
  allKeywords.push(...parseSuggestions(path.join(RESULTS_DIR, f), "Wechsel / Anbieter (Suggest.)"));
}

// Extra wechsel search volumes
for (const f of ["10_wechsel_extra1.json", "10_wechsel_extra2.json", "10_wechsel_extra3.json"]) {
  allKeywords.push(...parseSearchVolume(path.join(RESULTS_DIR, f), "Wechsel / Anbieter (erweitert)"));
}

// Deduplicate by keyword (keep highest SV entry)
const kwMap = new Map<string, KWResult>();
for (const kw of allKeywords) {
  const existing = kwMap.get(kw.keyword);
  if (!existing || kw.searchVolume > existing.searchVolume) {
    kwMap.set(kw.keyword, kw);
  }
}
const uniqueKeywords = Array.from(kwMap.values());
uniqueKeywords.sort((a, b) => b.searchVolume - a.searchVolume);

console.log(`Total unique keywords: ${uniqueKeywords.length}`);

// ===== Build XLSX =====

const wb = XLSX.utils.book_new();

// Sheet 1: Alle Keywords
const allData = uniqueKeywords.map((kw, i) => {
  const intent = getIntent(kw.keyword);
  const relevance = getRelevance(kw.keyword, kw.cluster);
  const pageType = getPageType(kw.keyword, intent);
  return {
    "#": i + 1,
    "Keyword": kw.keyword,
    "Suchvolumen/Monat": kw.searchVolume,
    "CPC (€)": kw.cpc,
    "KD (0-100)": kw.competitionIndex,
    "Wettbewerb": kw.competitionLevel,
    "Min. Gebot (€)": kw.lowBid,
    "Max. Gebot (€)": kw.highBid,
    "Suchintention": intent,
    "Cluster": kw.cluster,
    "Relevanz apv messtecc": relevance,
    "Empf. Seitentyp": pageType,
  };
});

const ws1 = XLSX.utils.json_to_sheet(allData);
// Set column widths
ws1["!cols"] = [
  { wch: 4 },  // #
  { wch: 45 }, // Keyword
  { wch: 16 }, // SV
  { wch: 10 }, // CPC
  { wch: 10 }, // KD
  { wch: 12 }, // Wettbewerb
  { wch: 13 }, // Min Gebot
  { wch: 13 }, // Max Gebot
  { wch: 14 }, // Intention
  { wch: 30 }, // Cluster
  { wch: 20 }, // Relevanz
  { wch: 25 }, // Seitentyp
];
XLSX.utils.book_append_sheet(wb, ws1, "Alle Keywords");

// Sheet 2: Wechsel/Anbieter Keywords only
const wechselData = uniqueKeywords
  .filter(kw => {
    const kwLower = kw.keyword.toLowerCase();
    return kw.cluster.includes("Wechsel") ||
      kwLower.includes("wechsel") || kwLower.includes("alternative") ||
      kwLower.includes("kündigen") || kwLower.includes("fehler") ||
      kwLower.includes("falsch") || kwLower.includes("zu hoch") ||
      kwLower.includes("prüfen") || kwLower.includes("beschwerde") ||
      kwLower.includes("probleme") || kwLower.includes("unzufrieden") ||
      kwLower.includes("beanstanden") || kwLower.includes("reklamation") ||
      kwLower.includes("korrigieren") || kwLower.includes("nachprüfen") ||
      kwLower.includes("überprüfen") || kwLower.includes("vergleich") ||
      kwLower.includes("erfahrungen") || kwLower.includes("bewertung") ||
      (kwLower.includes("techem") || kwLower.includes("ista") || kwLower.includes("brunata") || kwLower.includes("minol"));
  })
  .map((kw, i) => {
    const intent = getIntent(kw.keyword);
    const relevance = getRelevance(kw.keyword, kw.cluster);
    const pageType = getPageType(kw.keyword, intent);
    return {
      "#": i + 1,
      "Keyword": kw.keyword,
      "Suchvolumen/Monat": kw.searchVolume,
      "CPC (€)": kw.cpc,
      "KD (0-100)": kw.competitionIndex,
      "Wettbewerb": kw.competitionLevel,
      "Min. Gebot (€)": kw.lowBid,
      "Max. Gebot (€)": kw.highBid,
      "Suchintention": intent,
      "Cluster": kw.cluster,
      "Relevanz apv messtecc": relevance,
      "Empf. Seitentyp": pageType,
    };
  });

const ws2 = XLSX.utils.json_to_sheet(wechselData);
ws2["!cols"] = ws1["!cols"];
XLSX.utils.book_append_sheet(wb, ws2, "Wechsel & Anbieter");

// Sheet 3: TOP 20 Priority
const scored = uniqueKeywords.map(kw => {
  const intent = getIntent(kw.keyword);
  const relevance = getRelevance(kw.keyword, kw.cluster);
  const relevanceScore = relevance === "hoch" ? 3 : relevance === "mittel" ? 2 : 1;
  const svScore = Math.log10(Math.max(kw.searchVolume, 1)) * 10;
  const kdPenalty = kw.competitionIndex * 0.3;
  const intentBonus = intent === "transactional" ? 15 : intent === "commercial" ? 10 : 0;
  const score = svScore * relevanceScore + intentBonus - kdPenalty;
  const pageType = getPageType(kw.keyword, intent);
  return { ...kw, intent, relevance, score, pageType };
});
scored.sort((a, b) => b.score - a.score);

const top20Data = scored.slice(0, 20).map((kw, i) => ({
  "#": i + 1,
  "Keyword": kw.keyword,
  "Suchvolumen/Monat": kw.searchVolume,
  "CPC (€)": kw.cpc,
  "KD (0-100)": kw.competitionIndex,
  "Wettbewerb": kw.competitionLevel,
  "Suchintention": kw.intent,
  "Cluster": kw.cluster,
  "Relevanz": kw.relevance,
  "Empf. Seitentyp": kw.pageType,
  "Priority Score": Math.round(kw.score * 10) / 10,
}));

const ws3 = XLSX.utils.json_to_sheet(top20Data);
ws3["!cols"] = [
  { wch: 4 }, { wch: 45 }, { wch: 16 }, { wch: 10 }, { wch: 10 },
  { wch: 12 }, { wch: 14 }, { wch: 30 }, { wch: 12 }, { wch: 25 }, { wch: 13 },
];
XLSX.utils.book_append_sheet(wb, ws3, "TOP 20 Priority");

// Sheet 4: Cluster-Zusammenfassung
const clusterSummary: any[] = [];
const clusterNames = [...new Set(uniqueKeywords.map(k => k.cluster))];
for (const cluster of clusterNames) {
  const clusterKws = uniqueKeywords.filter(k => k.cluster === cluster);
  const withSV = clusterKws.filter(k => k.searchVolume > 0);
  const avgSV = withSV.length > 0 ? Math.round(withSV.reduce((s, k) => s + k.searchVolume, 0) / withSV.length) : 0;
  const avgCPC = withSV.length > 0 ? Math.round(withSV.reduce((s, k) => s + k.cpc, 0) / withSV.length * 100) / 100 : 0;
  const avgKD = withSV.length > 0 ? Math.round(withSV.reduce((s, k) => s + k.competitionIndex, 0) / withSV.length) : 0;
  const topKw = clusterKws.sort((a, b) => b.searchVolume - a.searchVolume)[0];
  clusterSummary.push({
    "Cluster": cluster,
    "Anzahl Keywords": clusterKws.length,
    "Davon mit SV > 0": withSV.length,
    "Ø Suchvolumen": avgSV,
    "Ø CPC (€)": avgCPC,
    "Ø KD": avgKD,
    "Top-Keyword": topKw?.keyword ?? "-",
    "Top SV": topKw?.searchVolume ?? 0,
  });
}

const ws4 = XLSX.utils.json_to_sheet(clusterSummary);
ws4["!cols"] = [
  { wch: 35 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 10 },
  { wch: 8 }, { wch: 40 }, { wch: 10 },
];
XLSX.utils.book_append_sheet(wb, ws4, "Cluster-Übersicht");

// Sheet 5: Handlungsempfehlungen
const empfehlungen = [
  { "Priorität": 1, "Typ": "Landingpage", "Titel": "Heizkostenabrechnung – Service & Dienstleister", "Haupt-Keywords": "heizkostenabrechnung (9.900), heizkosten abrechnen (9.900), heizkostenabrechnung erstellen lassen (70)", "Geschätztes SV": "~20.000", "Begründung": "Kern-Leistungsseite, höchstes Traffic-Potenzial, KD 44 = machbar" },
  { "Priorität": 2, "Typ": "Landingpage", "Titel": "Nebenkostenabrechnung für Hausverwaltungen", "Haupt-Keywords": "nebenkostenabrechnung hausverwaltung (260), weg abrechnung (260), hausverwaltung abrechnung (170)", "Geschätztes SV": "~1.000", "Begründung": "Direkte Zielgruppenansprache, B2B-Traffic mit hoher Conversion" },
  { "Priorität": 3, "Typ": "Landingpage", "Titel": "Heizkostenabrechnung für Vermieter & Eigentümer", "Haupt-Keywords": "nebenkostenabrechnung vermieter (720), heizkostenabrechnung vermieter (140), heizkostenabrechnung mehrfamilienhaus (140)", "Geschätztes SV": "~1.100", "Begründung": "Zweite Kernzielgruppe, hohe Relevanz" },
  { "Priorität": 4, "Typ": "Landingpage", "Titel": "Messdienst wechseln – Alternative zu Techem, ista & Co.", "Haupt-Keywords": "techem alternative (170), ista alternative (90), brunata alternative (30), messdienst wechseln", "Geschätztes SV": "~330", "Begründung": "Extrem hohe CPCs (bis 7,27€), direkte Kaufabsicht, Top-Conversion" },
  { "Priorität": 5, "Typ": "Landingpage", "Titel": "Heizkostenabrechnung München & Süddeutschland", "Haupt-Keywords": "heizkostenabrechnung münchen (10), messtechnik münchen (40), heizkostenabrechnung stuttgart (20)", "Geschätztes SV": "~70", "Begründung": "Niedrige KD, lokaler Vorteil, hochrelevanter regionaler Traffic" },
  { "Priorität": 6, "Typ": "Ratgeber/Blog", "Titel": "Heizkostenabrechnung prüfen: So erkennen Sie Fehler", "Haupt-Keywords": "heizkostenabrechnung prüfen (590), heizkostenabrechnung fehler (10), heizkostenabrechnung fehlerhaft (40)", "Geschätztes SV": "~810", "Begründung": "Pain-Point-Content, leitet direkt in Wechsel-Funnel" },
  { "Priorität": 7, "Typ": "Ratgeber/Blog", "Titel": "Nebenkostenabrechnung zu hoch? Ursachen & Lösungen", "Haupt-Keywords": "nebenkostenabrechnung zu hoch (320), heizkostenabrechnung zu hoch (110), heizkosten zu hoch (50)", "Geschätztes SV": "~480", "Begründung": "Starker Funnel-Einstieg für unzufriedene Kunden" },
  { "Priorität": 8, "Typ": "Ratgeber/Blog", "Titel": "Heizkostenverordnung: Was Vermieter & Verwalter wissen müssen", "Haupt-Keywords": "heizkostenverordnung (5.400)", "Geschätztes SV": "5.400", "Begründung": "Quick Win! KD nur 11, riesiges SV, Expertenstatus" },
  { "Priorität": 9, "Typ": "Ratgeber/Blog", "Titel": "Rauchmelder Pflicht in Bayern: Wartung & Installation", "Haupt-Keywords": "rauchmelder pflicht (6.600), rauchmelder wartung (880), rauchwarnmelder pflicht bayern (70)", "Geschätztes SV": "~7.700", "Begründung": "Höchstes SV aller Ratgeber, regionaler Bezug möglich" },
  { "Priorität": 10, "Typ": "Ratgeber/Blog", "Titel": "Messdienstleister vergleichen: Kosten, Leistungen & Wechsel", "Haupt-Keywords": "messdienstleister vergleich (110), messdienstleister kosten (70), messdienstleister (390)", "Geschätztes SV": "~780", "Begründung": "Mid-Funnel, Entscheidungsphase, direkte Lead-Generierung" },
];

const ws5 = XLSX.utils.json_to_sheet(empfehlungen);
ws5["!cols"] = [
  { wch: 10 }, { wch: 15 }, { wch: 55 }, { wch: 80 }, { wch: 14 }, { wch: 60 },
];
XLSX.utils.book_append_sheet(wb, ws5, "Handlungsempfehlungen");

// Write file
const outPath = "/home/user/claude-seo/docs/apv-messtecc-keyword-analyse.xlsx";
XLSX.writeFile(wb, outPath);
console.log(`\nXLSX saved to: ${outPath}`);
console.log(`Sheets: Alle Keywords (${uniqueKeywords.length}), Wechsel & Anbieter (${wechselData.length}), TOP 20 Priority, Cluster-Übersicht, Handlungsempfehlungen`);
