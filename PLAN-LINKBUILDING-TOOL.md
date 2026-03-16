# Projektplan: Linkbuilding Tool WebApp

**Ziel:** Vollständiges Linkbuilding-Management-Tool als Erweiterung der bestehenden claude-seo Next.js App
**Subdomain:** pr.leadsite.de
**Tech-Stack:** Next.js 14, TypeScript, Prisma/SQLite, Tailwind CSS, n8n für Automationen

---

## 1. Architektur-Übersicht

```
┌─────────────────────────────────────────────────────┐
│                  Next.js Frontend                    │
│   (pr.leadsite.de)                                  │
│                                                     │
│  /linkbuilding/dashboard     → Übersicht            │
│  /linkbuilding/projekte      → Kundenprojekte       │
│  /linkbuilding/backlinks     → Backlinkprofil       │
│  /linkbuilding/gap-analyse   → Wettbewerber-Gap     │
│  /linkbuilding/mentions      → Brand Mentions       │
│  /linkbuilding/broken-links  → Broken Backlinks     │
│  /linkbuilding/kontakte      → Kontaktdaten         │
└───────────┬─────────────────────────┬───────────────┘
            │ REST API                │ Webhooks
            ▼                         ▼
┌───────────────────┐    ┌────────────────────────────┐
│   Next.js API     │    │         n8n                 │
│   /api/lb/*       │◄──►│  (Automationen)            │
└───────┬───────────┘    │                            │
        │                │  • DataForSEO Polling      │
        ▼                │  • Brand Mention Alerts    │
┌───────────────────┐    │  • Broken Link Check       │
│  Prisma / SQLite  │    │  • Kontakt-Extraktion      │
│  (Datenbank)      │    │  • E-Mail Outreach         │
└───────────────────┘    └────────────────────────────┘
```

---

## 2. Externe APIs & Tools

| Service | Zweck | Integration |
|---------|-------|-------------|
| **DataForSEO** | Backlink-Daten, DR, Backlink-Historie, Wettbewerber-Analyse | Direkt via API + n8n Automationen |
| **Hunter.io** | E-Mail-Adressen & Ansprechpartner finden | n8n Workflow → API Route |
| **Snov.io** (Alternative) | E-Mail-Finder + Verifikation | n8n Workflow (fallback) |
| **Google Alerts / Mention.com API** | Brand Mentions tracken | n8n Polling-Workflow |
| **Ahrefs API** (optional) | Firehose Brand Mentions, Broken Links | n8n Workflow (falls API-Key vorhanden) |
| **ScreamingFrog / Sitebulb** (via n8n) | Broken Link Crawling | n8n CLI-Trigger |
| **Claude AI** | Backlink-Kategorisierung, Outreach-Texte, Wettbewerber-Empfehlungen | Bestehende ai.ts Integration |

---

## 3. Datenmodell (Prisma Schema Erweiterung)

```prisma
// === AUTH ===
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String
  role          String   @default("employee") // "admin" | "employee"
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  projects      LBProjectMember[]
}

// === LINKBUILDING PROJEKT ===
model LBProject {
  id            String   @id @default(cuid())
  name          String                          // z.B. "Kunde XY - Linkbuilding Q1"
  domain        String                          // Kundendomain
  url           String                          // Eingabe-URL
  customerId    String?
  customer      Customer? @relation(fields: [customerId], references: [id])
  status        String   @default("active")     // active | paused | completed
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  members       LBProjectMember[]
  backlinks     LBBacklink[]
  competitors   LBCompetitor[]
  mentions      LBBrandMention[]
  brokenLinks   LBBrokenLink[]
  contacts      LBContact[]
  backlinkSnapshots LBBacklinkSnapshot[]
}

model LBProjectMember {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  projectId String
  project   LBProject @relation(fields: [projectId], references: [id])
  role      String   @default("member") // "owner" | "member"

  @@unique([userId, projectId])
}

// === BACKLINKS ===
model LBBacklink {
  id              String   @id @default(cuid())
  projectId       String
  project         LBProject @relation(fields: [projectId], references: [id])
  sourceUrl       String              // URL die auf uns verlinkt
  sourceDomain    String              // Domain der Quelle
  targetUrl       String              // Unsere URL
  anchorText      String?
  linkType        String   @default("dofollow")  // dofollow | nofollow | ugc | sponsored
  category        String?             // PR | Gastbeitrag | Verzeichnis | Forum | Blog | Social | News | Andere
  domainRating    Float?              // DR der Quell-Domain
  pageRating      Float?              // URL-Rating der Quell-Seite
  isActive        Boolean  @default(true)
  firstSeen       DateTime @default(now())
  lastChecked     DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model LBBacklinkSnapshot {
  id              String   @id @default(cuid())
  projectId       String
  project         LBProject @relation(fields: [projectId], references: [id])
  date            DateTime @default(now())
  totalBacklinks  Int
  dofollowCount   Int
  nofollowCount   Int
  avgDR           Float?
  referringDomains Int
  newBacklinks    Int      @default(0)
  lostBacklinks   Int      @default(0)
}

// === WETTBEWERBER ===
model LBCompetitor {
  id              String   @id @default(cuid())
  projectId       String
  project         LBProject @relation(fields: [projectId], references: [id])
  domain          String
  domainRating    Float?
  totalBacklinks  Int?
  isAISuggested   Boolean  @default(false)  // Von AI empfohlen
  gapData         String?  // JSON: Links die Wettbewerber hat, wir nicht
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// === BRAND MENTIONS ===
model LBBrandMention {
  id              String   @id @default(cuid())
  projectId       String
  project         LBProject @relation(fields: [projectId], references: [id])
  sourceUrl       String
  sourceDomain    String
  title           String?
  snippet         String?             // Textauszug
  hasLink         Boolean  @default(false)  // Mention MIT Link?
  mentionDate     DateTime?
  status          String   @default("new")  // new | contacted | converted | ignored
  createdAt       DateTime @default(now())
}

// === BROKEN BACKLINKS ===
model LBBrokenLink {
  id              String   @id @default(cuid())
  projectId       String
  project         LBProject @relation(fields: [projectId], references: [id])
  sourceUrl       String              // Seite mit dem Broken Link
  sourceDomain    String
  brokenUrl       String              // Die kaputte URL
  anchorText      String?
  topicRelevance  Float?              // 0-1 Relevanz zum Kundenprojekt
  suggestedUrl    String?             // Unsere URL als Ersatz
  httpStatus      Int?                // 404, 410, etc.
  domainRating    Float?
  status          String   @default("found")  // found | contacted | replaced | ignored
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// === KONTAKTE ===
model LBContact {
  id              String   @id @default(cuid())
  projectId       String
  project         LBProject @relation(fields: [projectId], references: [id])
  domain          String
  pageUrl         String?             // Seite von der der Kontakt stammt
  name            String?
  email           String?
  phone           String?
  position        String?             // z.B. "Redakteur", "Webmaster"
  source          String?             // "hunter.io" | "manual" | "snov.io" | "website"
  linkedinUrl     String?
  outreachStatus  String   @default("new") // new | contacted | replied | converted | rejected
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## 4. Feature-Übersicht & Implementierungsplan

### Phase 1: Grundgerüst (Auth + Projekt-Management)

**1.1 Authentifizierung**
- NextAuth.js mit Credentials Provider (E-Mail + Passwort)
- Middleware für Route Protection (`/linkbuilding/*`)
- Rollen: Admin (alles) + Mitarbeiter (nur zugewiesene Projekte)
- Session-basierte Auth mit JWT

**1.2 Projekt-Management** (`/linkbuilding/projekte`)
- Projekt erstellen: Name, Kundendomain, URL, Kunde zuweisen
- Projektliste mit Status, Backlink-Anzahl, DR
- Mitarbeiter zu Projekt zuweisen (Admin-only)
- Projekt-Dashboard mit KPIs

**API Routes:**
```
POST   /api/lb/auth/login
POST   /api/lb/auth/register    (Admin-only)
GET    /api/lb/projects
POST   /api/lb/projects
GET    /api/lb/projects/[id]
PATCH  /api/lb/projects/[id]
DELETE /api/lb/projects/[id]
```

---

### Phase 2: Backlinkprofil-Analyse

**2.1 Backlink-Abruf** (`/linkbuilding/backlinks/[projectId]`)
- URL eingeben → DataForSEO Backlinks API abrufen
- Alle Backlinks tabellarisch anzeigen mit Sortierung + Filterung
- Dofollow/Nofollow Ratio als Kreisdiagramm
- DR-Verteilung als Balkendiagramm

**2.2 Backlink-Kategorisierung**
- AI (Claude) analysiert Ankertexte + Quell-URLs und kategorisiert automatisch:
  - PR / Pressemitteilung
  - Gastbeitrag
  - Verzeichnis / Directory
  - Forum / Community
  - Blog / Kommentar
  - Social Media
  - News / Presse
  - Andere
- Manuelles Überschreiben möglich

**2.3 Backlink-Entwicklung (Zeitverlauf)**
- Snapshots werden täglich via n8n erstellt
- Chart: Backlinks über Zeit (Tag/Woche/Monat/Jahr)
- Neue vs. verlorene Backlinks
- DR-Entwicklung über Zeit

**DataForSEO Endpoints:**
```
POST /v3/backlinks/backlinks        → Alle Backlinks einer URL
POST /v3/backlinks/domain_pages     → DR + Domain-Metriken
POST /v3/backlinks/history          → Historische Daten
POST /v3/backlinks/summary          → Zusammenfassung
```

**API Routes:**
```
GET    /api/lb/projects/[id]/backlinks
POST   /api/lb/projects/[id]/backlinks/fetch    (Trigger DataForSEO)
GET    /api/lb/projects/[id]/backlinks/stats     (Ratios, DR, Charts)
GET    /api/lb/projects/[id]/backlinks/history   (Snapshots)
```

---

### Phase 3: Backlink-Gap Analyse

**3.1 Wettbewerber-Management**
- Manuell Wettbewerber-Domain hinzufügen
- AI-Empfehlung: Claude analysiert Domain + Branche → schlägt 5-10 Wettbewerber vor
- DataForSEO Competitors API für Empfehlungen

**3.2 Gap-Analyse**
- Vergleich: Welche Domains verlinken auf Wettbewerber, aber nicht auf uns?
- Tabelle mit Gap-Domains inkl. DR, Link-Typ, Ankertext
- Filter: Min-DR, Link-Typ, Kategorie
- One-Click: Gap-Domain → Kontakt-Extraktion starten

**DataForSEO Endpoints:**
```
POST /v3/backlinks/competitors       → Ähnliche Domains finden
POST /v3/backlinks/domain_intersection → Backlink-Gap
```

**API Routes:**
```
GET    /api/lb/projects/[id]/competitors
POST   /api/lb/projects/[id]/competitors
POST   /api/lb/projects/[id]/competitors/suggest  (AI + DataForSEO)
GET    /api/lb/projects/[id]/gap-analysis
POST   /api/lb/projects/[id]/gap-analysis/run
```

---

### Phase 4: Brand Mentions

**4.1 Mention-Tracking**
- Brand-Keywords definieren (Firmenname, Produktnamen, etc.)
- n8n Workflow pollt regelmässig:
  - DataForSEO Content Analysis API (Mentions im Web)
  - Optional: Ahrefs API (Content Explorer / Firehose)
  - Google Alerts via RSS-Feed Parsing
- Neue Mentions werden in DB gespeichert

**4.2 Mention-Management**
- Liste aller Mentions mit Status
- Filter: mit/ohne Link, Domain, Datum
- "Unlinked Mentions" hervorheben → Outreach-Opportunity
- Status-Workflow: New → Contacted → Converted → Ignored

**DataForSEO Endpoints:**
```
POST /v3/content_analysis/search     → Web-Mentions suchen
POST /v3/content_analysis/summary    → Mention-Statistiken
```

**API Routes:**
```
GET    /api/lb/projects/[id]/mentions
POST   /api/lb/projects/[id]/mentions/scan     (Trigger n8n)
PATCH  /api/lb/projects/[id]/mentions/[mentionId]
```

---

### Phase 5: Broken Backlinks

**5.1 Broken Link Discovery**
- n8n Workflow crawlt regelmässig Ziel-Domains aus Gap-Analyse
- DataForSEO: Broken Backlinks der Quell-Domains finden
- AI (Claude) prüft Themenrelevanz: Ankertext + Kontext vs. Kundenprojekt
- Relevanz-Score (0-1) wird berechnet

**5.2 Broken Link Management**
- Tabelle mit Broken Links, sortiert nach Relevanz + DR
- AI schlägt passende eigene URL als Ersatz vor
- Status-Workflow: Found → Contacted → Replaced → Ignored
- One-Click: Kontakt der Domain abrufen

**DataForSEO Endpoints:**
```
POST /v3/backlinks/broken_backlinks  → Broken Links einer Domain
POST /v3/backlinks/broken_pages      → Kaputte Seiten
```

**API Routes:**
```
GET    /api/lb/projects/[id]/broken-links
POST   /api/lb/projects/[id]/broken-links/scan
PATCH  /api/lb/projects/[id]/broken-links/[linkId]
```

---

### Phase 6: Kontakt-Extraktion

**6.1 Kontakt-Finder**
- Von jeder Seite (Backlink, Mention, Broken Link, Gap) → "Kontakt finden" Button
- n8n Workflow:
  1. Hunter.io Domain Search → E-Mails + Namen
  2. Fallback: Snov.io Domain Search
  3. Fallback: Website Scraping (Impressum, Kontakt-Seite)
  4. LinkedIn-Profil-Suche (optional)
- Ergebnisse in LBContact gespeichert

**6.2 Kontakt-Management**
- Zentrale Kontaktliste pro Projekt
- Export als CSV/VCF für Outlook-Import
- Outreach-Status tracken
- Notizen pro Kontakt

**API Routes:**
```
GET    /api/lb/projects/[id]/contacts
POST   /api/lb/projects/[id]/contacts/find     (Trigger n8n: domain → Kontakte)
PATCH  /api/lb/projects/[id]/contacts/[contactId]
GET    /api/lb/projects/[id]/contacts/export    (CSV/VCF Download)
```

---

## 5. n8n Automationen (Workflows)

### Workflow 1: Täglicher Backlink-Snapshot
```
Trigger: Cron (täglich 06:00)
→ Für jedes aktive Projekt:
  → DataForSEO: Backlink Summary abrufen
  → Snapshot in DB speichern (via Webhook → /api/lb/webhooks/snapshot)
  → Bei signifikanten Änderungen: Slack/E-Mail Notification
```

### Workflow 2: Brand Mention Scanner
```
Trigger: Cron (alle 4 Stunden)
→ Für jedes aktive Projekt:
  → DataForSEO Content Analysis: Brand-Keywords suchen
  → Optional: Ahrefs Content Explorer API
  → Google Alerts RSS Feeds parsen
  → Neue Mentions via Webhook → /api/lb/webhooks/mentions
  → Bei Unlinked Mentions: Notification an Projektteam
```

### Workflow 3: Broken Link Checker
```
Trigger: Cron (wöchentlich)
→ Für jedes aktive Projekt:
  → Top-Domains aus Gap-Analyse laden
  → DataForSEO: Broken Backlinks pro Domain
  → AI: Themenrelevanz prüfen (Claude API)
  → Relevante Broken Links via Webhook → /api/lb/webhooks/broken-links
```

### Workflow 4: Kontakt-Extraktion
```
Trigger: Webhook (von Frontend ausgelöst)
→ Input: Domain + Projekt-ID
→ Hunter.io: Domain Search
→ Falls keine Ergebnisse: Snov.io Domain Search
→ Falls noch nichts: Website Scraping (Impressum)
→ Ergebnisse via Webhook → /api/lb/webhooks/contacts
→ Notification: "X Kontakte gefunden für domain.de"
```

### Workflow 5: Gap-Analyse Automation
```
Trigger: Webhook (von Frontend ausgelöst)
→ Input: Projekt-URL + Wettbewerber-URLs
→ DataForSEO: Domain Intersection
→ Ergebnisse filtern (Min-DR, aktive Links)
→ Ergebnisse via Webhook → /api/lb/webhooks/gap-results
```

### Webhook API Routes für n8n:
```
POST /api/lb/webhooks/snapshot       (n8n → App: Backlink Snapshot)
POST /api/lb/webhooks/mentions       (n8n → App: Neue Mentions)
POST /api/lb/webhooks/broken-links   (n8n → App: Broken Links)
POST /api/lb/webhooks/contacts       (n8n → App: Kontaktdaten)
POST /api/lb/webhooks/gap-results    (n8n → App: Gap-Analyse Ergebnisse)
```

Alle Webhooks werden mit einem shared Secret (`N8N_WEBHOOK_SECRET` env var) authentifiziert.

---

## 6. UI-Konzept

### Navigation (Sidebar-Erweiterung)
```
📊 Dashboard
👥 Kunden
🔍 Themenrecherche
📝 Outlines
📄 Content
📈 Performance
─────────────────
🔗 Linkbuilding          ← NEU
  ├── Dashboard
  ├── Projekte
  ├── Backlinks
  ├── Gap-Analyse
  ├── Brand Mentions
  ├── Broken Links
  └── Kontakte
```

### Linkbuilding Dashboard
- KPI-Cards: Gesamte Backlinks, DR-Durchschnitt, Dofollow-Ratio, Neue Backlinks (30d)
- Mini-Charts: Backlink-Trend, Mention-Trend
- Letzte Aktivitäten (neue Links, neue Mentions, etc.)
- Offene Opportunities (Unlinked Mentions, Broken Links)

### Backlink-Profil Seite
- Oberer Bereich: Summary Cards (Total, Dofollow, Nofollow, Avg DR)
- Dofollow/Nofollow Kreisdiagramm
- Kategorie-Verteilung Balkendiagramm
- Backlink-Tabelle mit Spalten: Quell-URL, Ankertext, Typ, DR, Kategorie, Status, Datum
- Zeitverlaufs-Chart (auswählbar: Tag/Woche/Monat/Jahr)

---

## 7. Implementierungs-Reihenfolge

| Phase | Inhalt | Geschätzt |
|-------|--------|-----------|
| **Phase 1** | Auth (NextAuth.js) + User-Model + Projekt-CRUD + Navigation | Grundgerüst |
| **Phase 2** | Backlinkprofil: DataForSEO Integration, Tabelle, Charts, Kategorisierung | Kernfeature |
| **Phase 3** | Gap-Analyse: Wettbewerber, AI-Empfehlung, Domain Intersection | Analyse |
| **Phase 4** | Brand Mentions: Tracking, Unlinked Mentions, Status-Workflow | Monitoring |
| **Phase 5** | Broken Links: Discovery, Relevanz-Check, Ersatz-Vorschläge | Opportunities |
| **Phase 6** | Kontakte: Hunter.io, Export, Outreach-Status | Outreach |
| **Phase 7** | n8n Webhooks + Automationen, Notifications | Automation |
| **Phase 8** | Dashboard, Charts (recharts), KPIs, Polish | Reporting |

---

## 8. Neue Dependencies

```json
{
  "next-auth": "^4.24.0",        // Authentifizierung
  "bcryptjs": "^2.4.3",          // Passwort-Hashing
  "recharts": "^2.12.0",         // Charts (Backlink-Trend, DR-Verteilung)
  "@types/bcryptjs": "^2.4.6"    // TypeScript Types
}
```

---

## 9. Environment Variables (Neu)

```bash
# Auth
NEXTAUTH_SECRET="..."            # NextAuth JWT Secret
NEXTAUTH_URL="https://pr.leadsite.de"

# n8n
N8N_WEBHOOK_SECRET="..."         # Shared Secret für n8n Webhooks
N8N_BASE_URL="https://n8n.leadsite.de"  # n8n Instance URL

# Kontakt-Extraktion
HUNTER_API_KEY=""                 # Hunter.io API Key
SNOV_API_KEY=""                   # Snov.io API Key (optional)
```

---

## 10. Mock-Strategie (Entwicklung ohne API-Keys)

Wie beim bestehenden Projekt: Alle externen APIs haben realistische Mock-Fallbacks:

- **DataForSEO Backlinks**: Mock generiert 50-200 Backlinks mit realistischen DR, Ankertexten, Kategorien
- **Hunter.io**: Mock liefert 2-5 Kontakte pro Domain
- **Brand Mentions**: Mock generiert 10-20 Mentions mit Mix aus linked/unlinked
- **Broken Links**: Mock generiert 5-15 Broken Links mit Relevanz-Scores

So kann das Tool vollständig ohne API-Keys entwickelt und getestet werden.

---

## Zusammenfassung

Das Tool wird als Erweiterungsmodul der bestehenden claude-seo App gebaut und nutzt:
- **Bestehende Infrastruktur**: Next.js, Prisma, UI-Komponenten, AI-Integration
- **Neue Module**: Auth, Backlink-Analyse, Gap-Analyse, Mentions, Broken Links, Kontakte
- **n8n** für alle wiederkehrenden Automationen (Polling, Scanning, Extraktion)
- **DataForSEO** als primäre Datenquelle für Backlinks
- **Hunter.io / Snov.io** für Kontakt-Extraktion
- **Claude AI** für Kategorisierung, Relevanz-Scoring, Wettbewerber-Empfehlungen
