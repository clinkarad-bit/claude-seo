# Prompt: Meta Title & Meta Description Generator  ## Aufgabe  Schreibe einen Meta Title und eine Meta Description für folgende Seite:  - **Seitentyp:** [z. B. Blog-Artikel / Landingpage / Ratgeber / Dienstleistungsseite] - **Thema:** [z. B. Generative Engine Optimization / Local SEO / Content-Strategie] - **Zielgruppe:** [z. B. Inhaber kleiner Unternehmen / Marketing-Manager / Selbstständige ohne SEO-Vorkenntnisse] - **Haupt-Keyword:** [z. B. GEO Optimierung] - **Markenname:** [z. B. CASOA] - **Ton:** direkt, klar, leicht provokant – kein Marketingsprech  ---  ## Regeln Meta Title  - Länge: **50–60 Zeichen** (inklusive Leerzeichen) - Das Haupt-Keyword muss **am Anfang** stehen - Keine Gedankenstriche (weder – noch -) - Kein generisches Werbesprech wie „umfassend", „innovativ", „ganzheitlich" - Der Markenname kommt **am Ende**, abgetrennt mit einem senkrechten Strich: `|` - Formuliere prägnant und konkret – kein vollständiger Satz nötig - Nutze wenn passend eine Zahl (z. B. „5 Strategien", „3 Schritte") - Jahreszahlen natürlich einbauen wenn sinnvoll: „für 2026", „ab 2026", „in 2026" – nie isoliert wie „SEO 2026", sondern immer „SEO für 2026" - Kein Punkt am Ende  ## Regeln Meta Description  - Länge: **140–155 Zeichen** (inklusive Leerzeichen) - Das Haupt-Keyword muss **möglichst früh** stehen - Keine Gedankenstriche (weder – noch -) - Keine Passivkonstruktionen - Kein generisches Werbesprech wie „umfassend", „innovativ", „ganzheitlich" - Formuliere eine konkrete Aussage oder Frage, die Neugier weckt - Schreibe so, dass ein absoluter Laie sofort versteht, was ihn auf der Seite erwartet - Nutze wenn passend eine Zahl oder ein konkretes Versprechen (z. B. „in 3 Schritten", „ohne Agentur") - Jahreszahlen natürlich einbauen wenn sinnvoll: „für 2026", „ab 2026", „in 2026" – nie isoliert wie „SEO 2026", sondern immer „SEO für 2026" - Schließe mit einer kurzen Handlungsaufforderung ab (z. B. „Jetzt lesen.", „Direkt umsetzen.", „Kostenlos testen.") - Kein Punkt nach der Handlungsaufforderung nur wenn sie als eigenständiger Satz endet  ---  ## Ausgabe  Liefere genau EIN Ergebnis als flaches JSON-Objekt:
```json
{
  "meta_title": "...",
  "meta_title_zeichen": 55,
  "meta_description": "...",
  "meta_description_zeichen": 148,
  "url_slug": "...",
  "focus_keyword": "..."
}
```
KEINE Varianten, KEINE verschachtelten Objekte. Nur dieses eine flache JSON.


---

## ZUSÄTZLICHE PFLICHT-REGELN

### Natürliche Sprache
- Meta Title und Meta Description MÜSSEN wie natürliche, korrekte deutsche Sprache klingen
- Kein Keyword-Stuffing. Das Keyword natürlich einbauen, nicht erzwingen.
- Grammatisch korrekt, keine Rechtschreibfehler, kein holpriger Satzbau
- So formulieren wie ein Mensch es sagen würde, nicht wie eine Suchmaschine es lesen soll

### Verboten im Meta Title
- Keywords in unnatürlicher Reihenfolge erzwingen
- Doppelpunkt-Konstruktionen wie "Keyword: Erklärung"
- Gedankenstriche
- Fachsprache die ein Laie nicht versteht

### Beispiele
❌ "D&O Versicherung Kosten Geschäftsführer Haftung | CASOA"
❌ "Angestellter Geschäftsführer Haftung: Risiken und Schutz"
✅ "Was kostet eine D&O-Versicherung für Geschäftsführer? | CASOA"
✅ "Haftest du als angestellter Geschäftsführer mit deinem Privatvermögen? | CASOA"

### Prüfe vor Ausgabe
- Liest sich der Meta Title wie ein natürlicher Satz oder eine natürliche Frage?
- Klingt die Meta Description so, als hätte ein Mensch sie geschrieben?
- Würde ein Nutzer bei Google darauf klicken?
