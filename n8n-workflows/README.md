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

### 01 - Main Content Pipeline (`01-main-content-pipeline.json`)
**Trigger:** ClickUp Task Status → "COPYWRITING"

Ablauf:
1. **SERP Analyse** - Top 10 Google-Ergebnisse analysieren
2. **WDF*IDF Analyse** - Termgewichtung der Top 10
3. **People Also Ask + Reddit** - FAQ-Fragen sammeln
4. **Perplexity Deep Research** - Umfassende Themenrecherche
5. **Claude: Outline** - Struktur mit FAQs, interner Verlinkung
6. **Claude: Content Writing** - Skyscraper-Artikel schreiben
7. **Claude: GEO Optimierung** - Struktur & Formulierungen für GEO/SEO
8. **Claude: Sprachstil + Humanizer** - KI-Sprache entfernen, Kundenstil einbauen
9. **Claude: Meta Title & Description** - SEO Meta-Daten
10. **Gemini: Bilder** - 3 Bildvarianten generieren
11. **Google Doc erstellen** - Artikel in Google Drive ablegen
12. **Google Sheet updaten** - Status + Link eintragen
13. **ClickUp updaten** - Google Doc Link + Bilder in Task

### 02 - Review Flow (`02-review-flow.json`)
**Trigger:** ClickUp Task Status → "REVIEW BEIM KUNDEN"
- Google Doc von Entwurf-Ordner → Review-Ordner verschieben

### 03 - Freigabe Flow (`03-freigabe-flow.json`)
**Trigger:** ClickUp Task Status → "FREIGEGEBEN"
- Google Doc von Review-Ordner → Freigegeben-Ordner verschieben

### 04 - WordPress Publish (`04-wordpress-publish.json`)
**Trigger:** ClickUp Task Status → "IN WORDPRESS ANLEGEN"
- Google Doc Inhalt lesen
- WordPress Post erstellen (mit RankMath Meta-Daten)
- Featured Image hochladen
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
| Google Gemini | API Key | Bildgenerierung |
| WordPress | App Password | WordPress REST API |
| DataForSEO | Login/Pass | SERP & WDF*IDF Daten |

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

#### Gemini
1. n8n → Credentials → Add → Google Gemini (PaLM) API
2. API Key von: ai.google.dev

#### WordPress
1. WordPress → Users → Application Passwords
2. n8n → Credentials → Add → WordPress
3. URL: `https://kundenwebsite.de`
4. Username + Application Password

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

## Wichtige Hinweise

- **Skyscraper-Ansatz:** Der Content wird so gebaut, dass er besser als die Top 10 ist
- **Interne Verlinkung:** Automatisch basierend auf der Keyword Map im Google Sheet
- **FAQs:** People Also Ask + Reddit werden analysiert und als FAQ-Sektion eingebaut
- **GEO-Optimierung:** Separate Claude-Phase für Generative Engine Optimization
- **Humanizer:** KI-Sprache wird entfernt, Kundenstil wird eingebaut
- **Infografiken:** Werden an passenden Stellen im Artikel mit Mermaid/HTML generiert
- **Mock-Modus:** Ohne API Keys werden realistische Testdaten verwendet
