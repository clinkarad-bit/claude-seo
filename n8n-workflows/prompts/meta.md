# Meta Title & Meta Description Generator

## Ziele des Meta-Titles
- Suchintention auf den Punkt treffen (Informational, Transactional, Lokal etc.)
- Primäres Keyword früh platzieren, ohne Keyword-Stuffing, IMMER in maximal natürlicher Sprache
- Jahreszahlen natürlich einbauen: NICHT "welche D&O-Versicherung ist 2026 gut?" SONDERN "welche D&O-Versicherung ist in 2026 gut?"
- Echte Erwartungshaltung setzen, kein Clickbait, keine überzogenen Versprechen
- Hohe Scanbarkeit auf Desktop und Mobile
- Jede URL hat einen eigenen eindeutigen Titel
- Merksatz: Ein Title zeigt sofort "Worum geht's? Für wen? Welcher konkrete Nutzen?" ohne Marketing-Gelaber

## Länge & Technik
- 50-60 Zeichen, damit der Titel in Desktop-SERPs nicht abgeschnitten wird
- Wichtigste Keywords und Nutzen in die ersten 40-50 Zeichen
- Breitere Zeichen (W, M, Umlaute) kosten mehr Pixelplatz

## Struktur
[Hauptkeyword + Klarheit] : [konkreter Nutzen / Kontext] | [Brand]

Beispiele:
- "Private Krankenversicherung für Selbstständige: Tarife jetzt vergleichen"
- "PKV-Wechsel für Gutverdiener: Chancen, Risiken, Checkliste"
- "Betriebliche Krankenversicherung für KMU: Vorteile & Kosten einfach erklärt"

## Keyword-Strategie
- Primäres Keyword so nah wie möglich an den Anfang, in natürlichem Deutsch
- 1-2 verwandte Begriffe dezent ergänzen wenn sie den Titel nicht unlesbar machen
- KEIN Keyword-Stuffing mit Komma-Aneinanderreihungen
- Keyword IMMER maximal natürlich einbauen mit Verben, Präpositionen, Bindewörtern
- Alles richtig ausschreiben: NICHT "Checkliste PKV" SONDERN "Checkliste für die PKV"

## Sprache
- KEINE Superlative: ultimativ, krass, extrem, unglaublich, schockierend
- KEINE unrealistischen Versprechen: "garantiert beste PKV", "nie wieder Probleme"
- KEINE Clickbait-Muster: "Das glaubt dir keine Versicherung!", "Nr. 1 Trick"
- Stattdessen deskriptiv & konkret
- W-Wörter IMMER als richtige Frage: NICHT "wann sich ein Wechsel lohnt" SONDERN "Wann lohnt sich ein Wechsel?"
- Normale Satzschreibung, kein Title-Case
- Trennzeichen ":" oder "|" zur Strukturierung, KEINE Gedankenstriche

## Meta Description
- 140-155 Zeichen
- Haupt-Keyword möglichst früh
- Konkrete Aussage oder Frage die Neugier weckt
- Laie muss sofort verstehen was ihn auf der Seite erwartet
- Kurze Handlungsaufforderung am Ende: "Jetzt lesen.", "Direkt umsetzen."
- KEINE Gedankenstriche, KEINE Passivkonstruktionen
- Natürliche Sprache, kein Keyword-Stuffing

## Konsistenz
- Title = komprimiertes Versprechen
- Meta Description = kurze Vertiefung
- Beides muss zum tatsächlichen Seiteninhalt passen

## Ausgabe
Antworte NUR als flaches JSON:
{
  "meta_title": "...",
  "meta_description": "...",
  "url_slug": "...",
  "focus_keyword": "..."
}
KEINE Varianten, KEINE verschachtelten Objekte.