# n8n Content Writing Automation System

Vollautomatisches Content-Writing-System mit ClickUp, Google Drive, Google Sheets, WordPress und KI-Integration (Claude, Perplexity, Gemini).

## Architektur-Übersicht

```
ClickUp Board (Blogpipeline)
┌──────────┐  ┌────────────┐  ┌──────────────────┐  ┌────────────┐  ┌─────────────────────┐
│ KEYWORD  │→ │ COPYWRITING│→ │ REVIEW BEIM      │→ │ FREIGEGEBEN│→ │ IN WORDPRESS ANLEGEN│
│          │  │            │  │ KUNDEN           │  │            │  │                     │
└──────────┘  └────────────┘  └──────────────────┘  └────────────┘  └─────────────────────┘
     │              │                │                    │                    │
     │         Workflow 01      Workflow 02          Workflow 03          Workflow 04
     │         Content           Review               Freigabe            WordPress
     │         Pipeline          Flow                 Flow                Publish
     │              │                │                    │                    │
     │              ▼                ▼                    ▼                    ▼
     │         ┌─────────┐    ┌──────────┐         ┌──────────┐       ┌───────────┐
     │         │ Google  │    │ Google   │         │ Google   │       │ WordPress │
     │         │ Doc     │    │ Drive    │         │ Drive    │       │ + RankMath│
     │         │ erstellt│    │ Review/  │         │ Freigabe/│       │ + Bild    │
     │         └─────────┘    └──────────┘         └──────────┘       └───────────┘
     │              │                                                       │
     │              ▼                                                       ▼
     │         ┌─────────┐                                            ┌──────────┐
     │         │ Google  │                                            │ Google   │
     │         │ Sheet   │◄───────────────────────────────────────────│ Sheet    │
     │         │ Update  │                                            │ Status   │
     │         └─────────┘                                            └──────────┘
```

## Workflows

### 00 - Keyword Research (`00-keyword-research.json`)
**Trigger:** ClickUp Webhook → Seed Keyword
- DataForSEO: Keyword Suggestions + Related Keywords (700+ Keywords)
- Deduplizieren & Gruppieren
- Google Sheet erstellen mit 3 Worksheets
- ClickUp Tasks pro Keyword anlegen

### 01a - Outline Generation (`01a-outline-generation.json`)
**Trigger:** ClickUp Task Status → "COPYWRITING"

Ablauf:
1. **SERP Analyse** (DataForSEO) - Top 10 Google-Ergebnisse
2. **Content Parsing** (DataForSEO) - Volltext der Top 10 laden
3. **WDF*IDF Calculator** - Top 50 Terme berechnen
4. **People Also Ask + Reddit** - FAQ-Fragen sammeln
5. **Perplexity Deep Research** - Aktuelle Fakten & Quellen
6. **Keyword Map lesen** (Google Sheets) - Interne Verlinkung
7. **Claude: Outline generieren** - Struktur mit H2/H3, FAQs, WDF*IDF-Terme
8. **Trigger 01b** - Alle Daten an Content Writer übergeben

### 01b - Content Writer (`01b-content-writer.json`)
**Trigger:** Webhook von 01a

Ablauf:
1. **Pass 1: Section Writing** - Jede H2-Sektion einzeln mit Claude schreiben
2. **Pass 2: Style & Cohesion** - Übergänge, Brand Voice, Intro + Fazit
3. **WDF*IDF Coverage Check** - Prüfen ob ≥60% der Top-50-Terme im Artikel
4. **Pass 3: WDF*IDF Optimization** (optional) - Fehlende Terme einbauen
5. **Claude: Meta Data** - Title, Description, Slug generieren
6. **Google Doc erstellen** - Artikel in Google Drive ablegen
7. **ClickUp updaten** - Meta-Daten + Doc-Link in Custom Fields

### 02 - Review Flow (`02-review-flow.json`)
**Trigger:** ClickUp Task Status → "REVIEW BEIM KUNDEN"
- Google Doc von Entwurf-Ordner → Review-Ordner verschieben

### 03 - Freigabe Flow (`03-freigabe-flow.json`)
**Trigger:** ClickUp Task Status → "FREIGEGEBEN"
- Google Doc von Review-Ordner → Freigegeben-Ordner verschieben

### 04 - WordPress Publish (`04-wordpress-publish.json`)
**Trigger:** ClickUp Task Status → "IN WORDPRESS ANLEGEN"
- Google Doc Inhalt lesen + in HTML konvertieren
- **Gemini analysiert Artikel** → generiert Szenen-Beschreibung
- **2 fotorealistische Titelbilder** mit Gemini Image Generation erzeugen (iPhone-Stil)
- **Beide Bilder in ClickUp Task** als Attachments hochladen
- Bild 1 als **Featured Image in WordPress** hochladen
- WordPress Post erstellen (Draft) mit Bild + Content
- **RankMath Meta-Daten** setzen (Title, Description, Focus Keyword)
- Google Doc in "WordPress Angelegt" Ordner verschieben
- Google Sheet Status updaten

### 05 - Veröffentlicht Sync (`05-veroeffentlicht-sync.json`)
**Trigger:** ClickUp Task Status → "BEITRAG VERÖFFENTLICHT"
- Google Sheet Status auf "veröffentlicht" setzen
- Keyword Map aktualisieren

## Benötigte API-Credentials in n8n

| Credential | Typ | Beschreibung |
|---|---|---|
| ClickUp API | API Key | ClickUp Personal API Token |
| Google OAuth2 | OAuth2 | Für Drive, Docs, Sheets |
| Anthropic (Claude) | API Key | Claude API für Content |
| Perplexity | API Key | Deep Research |
| WordPress (covago.de) | HTTP Basic Auth | WordPress REST API + RankMath |
| DataForSEO | Login/Pass | SERP & WDF*IDF Daten |
| Google AI (Gemini) | API Key | Bildgenerierung für Featured Images |

## Setup-Anleitung

### 1. Credentials in n8n anlegen

#### ClickUp API
1. n8n → Credentials → Add Credential → ClickUp API
2. API Key von: ClickUp → Settings → Apps → API Token

#### Google OAuth2
1. Google Cloud Console → APIs & Services → Credentials
2. OAuth 2.0 Client erstellen (Web Application)
3. Authorized redirect URI: `https://n8n.carlosarad.de/rest/oauth2-credential/callback`
4. In n8n: Credentials → Add → Google OAuth2 API
5. APIs aktivieren: Drive, Docs, Sheets

#### Anthropic (Claude)
1. n8n → Credentials → Add → Anthropic
2. API Key von: console.anthropic.com

#### Perplexity
1. n8n → Credentials → Add → HTTP Header Auth
2. Header Name: `Authorization`
3. Header Value: `Bearer YOUR_PERPLEXITY_API_KEY`

#### Gemini (Bildgenerierung)
1. n8n → Settings → Environment Variables → `GEMINI_API_KEY` setzen
2. API Key von: ai.google.dev / Google AI Studio
3. Wird in Workflow 04 für fotorealistische Titelbilder verwendet

#### WordPress (covago.de)
1. n8n → Credentials → Add → HTTP Basic Auth
2. Name: `WordPress Basic Auth (covago.de)`
3. Username: `web-admin`
4. Password: (Application Password aus WordPress → Users → Application Passwords)

#### DataForSEO
1. n8n → Credentials → Add → HTTP Basic Auth
2. Login + Password von dataforseo.com

### 2. Google Drive Ordnerstruktur anlegen

```
Google Drive/
└── Content Pipeline/
    └── [Kundenname]/
        ├── Entwurf/
        ├── Review/
        ├── Freigegeben/
        └── WordPress Angelegt/
```

### 3. Google Sheet (Keyword Map) einrichten

Spalten:
| Keyword | Hub/Cluster | Pillar Article URL | Status | Google Doc Link | WordPress URL | Kunde |

Status-Werte: `keyword`, `copywriting`, `review`, `freigegeben`, `in_wordpress`, `veröffentlicht`

### 4. ClickUp Board einrichten

Board "Blogpipeline" mit 6 Spalten (Status):
- KEYWORD
- COPYWRITING
- REVIEW BEIM KUNDEN
- FREIGEGEBEN
- IN WORDPRESS ANLEGEN
- BEITRAG VERÖFFENTLICHT

Custom Fields pro Task (bereits vorhanden):
- `Link zum Beitrag` (URL) — wird automatisch mit Google Doc Link befüllt
- `Meta Description` (Text) — wird automatisch von Claude generiert
- `Meta Title` (Text) — wird automatisch von Claude generiert
- `Themen-Cluster` (Text/Dropdown) — Hub/Cluster für interne Verlinkung
- Tags: Kundenname (z.B. "covago")

### 5. Workflows importieren

1. n8n öffnen → Workflows → Import from File
2. Alle 5 JSON-Dateien importieren
3. In jedem Workflow die Credentials zuweisen
4. Variablen anpassen (Ordner-IDs, Sheet-IDs, etc.)
5. Workflows aktivieren

## Konfiguration per Workflow

Jeder Workflow enthält am Anfang einen **"Config"** Node (Set Node) mit allen konfigurierbaren Werten:
- Google Drive Ordner-IDs
- Google Sheet ID
- ClickUp Space/List IDs
- WordPress Site URLs
- Kundenspezifische Einstellungen

### Prompts

Alle AI-Prompts sind **direkt in den Workflows eingebettet** — kein externes Setup nötig. Die Prompts können direkt in den jeweiligen HTTP-Request-Nodes (Claude, Perplexity) bearbeitet werden.

### n8n Environment Variables

| Variable | Workflow | Beschreibung |
|---|---|---|
| `GEMINI_API_KEY` | 04 | Google AI Studio API Key für Bildgenerierung |
| `GOOGLE_DRIVE_FREIGEGEBEN_FOLDER_ID` | 04 | Google Drive Ordner-ID "Freigegeben" |
| `GOOGLE_DRIVE_WORDPRESS_FOLDER_ID` | 04 | Google Drive Ordner-ID "WordPress Angelegt" |
| `GOOGLE_SHEET_ID` | 04 | Google Sheet ID für Status-Tracking |

## Wichtige Hinweise

- **Skyscraper-Ansatz:** Der Content wird so gebaut, dass er besser als die Top 10 ist
- **Interne Verlinkung:** Automatisch basierend auf der Keyword Map im Google Sheet
- **FAQs:** People Also Ask + Reddit werden analysiert und als FAQ-Sektion eingebaut
- **GEO-Optimierung:** Separate Claude-Phase für Generative Engine Optimization
- **Humanizer:** KI-Sprache wird entfernt, Kundenstil wird eingebaut
- **Infografiken:** Werden an passenden Stellen im Artikel mit Mermaid/HTML generiert
- **Mock-Modus:** Ohne API Keys werden realistische Testdaten verwendet
