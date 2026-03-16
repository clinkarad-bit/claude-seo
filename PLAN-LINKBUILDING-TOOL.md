# Projektplan: Linkbuilding Tool WebApp (v2 — Final)

**Ziel:** Professionelles Linkbuilding-Management-Tool mit Enterprise-Grade Security
**Subdomain:** pr.leadsite.de
**Tech-Stack:** Next.js 14, TypeScript, PostgreSQL via Prisma, Tailwind CSS, n8n
**Stand:** 16.03.2026

---

## 1. Architektur-Übersicht

```
                         ┌──────────────────┐
                         │   Cloudflare      │
                         │   WAF + CDN       │
                         │   DDoS Protection │
                         └────────┬─────────┘
                                  │ HTTPS only
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Hetzner CX33 VPS                         │
│                    (Nürnberg, DE)                            │
│                                                             │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │   Caddy      │   │   Caddy      │   │   Caddy          │ │
│  │   Reverse    │──▶│   Next.js    │   │   Reverse        │ │
│  │   Proxy      │   │   :3000      │   │   Proxy          │ │
│  │   :443       │   └──────┬───────┘   │   n8n :5678      │ │
│  └─────────────┘          │            └────────┬─────────┘ │
│                           ▼                     │           │
│                    ┌──────────────┐              │           │
│                    │  PostgreSQL  │◀─────────────┘           │
│                    │  :5432       │                          │
│                    │  (encrypted) │                          │
│                    └──────────────┘                          │
│                                                             │
│  Docker Compose orchestriert alles                          │
│  Automatische Let's Encrypt Zertifikate via Caddy           │
└─────────────────────────────────────────────────────────────┘
```

### Subdomains:
- `pr.leadsite.de` → Next.js App (Linkbuilding Tool)
- `n8n.leadsite.de` → n8n Automation UI (Admin-only)

---

## 2. Was du brauchst (Einkaufsliste)

### Hosting & Infrastruktur

| Was | Anbieter | Kosten/Monat | Warum |
|-----|----------|--------------|-------|
| **VPS Server** | Hetzner Cloud CX33 | **~5,49 EUR** | 4 vCPU, 8GB RAM, 80GB SSD, Nürnberg DE, DSGVO-konform |
| **Domain/DNS** | Cloudflare (free) | **0 EUR** | DNS für pr.leadsite.de + n8n.leadsite.de |
| **WAF + DDoS** | Cloudflare (free tier) | **0 EUR** | Web Application Firewall, Bot Protection, Rate Limiting |
| **SSL/TLS** | Caddy (automatisch) | **0 EUR** | Let's Encrypt Zertifikate, auto-renewal |
| **Backups** | Hetzner Snapshots | **~1,10 EUR** | Tägliche Server-Snapshots (20% Aufpreis) |
| **Monitoring** | UptimeRobot (free) | **0 EUR** | Uptime Monitoring + Alerts |
| | | **~6,59 EUR/Monat** | |

### Externe APIs (Betriebskosten)

| Service | Plan | Kosten/Monat | Was du bekommst |
|---------|------|--------------|-----------------|
| **DataForSEO** | Pay-as-you-go | **~100 EUR** (Minimum) | Backlinks, DR, Gap-Analyse, Broken Links, Content Analysis |
| **Ahrefs Firehose** (firehose.com) | Free Beta | **0 EUR** | Echtzeit-Brand-Mentions via SSE Streaming |
| **Hunter.io** | Starter | **34 EUR** (jährlich) | 500 E-Mail-Suchen/Monat + Verifikation |
| **Claude API** (Anthropic) | Pay-as-you-go | **~10-30 EUR** | Kategorisierung, Relevanz-Scoring, Outreach-Texte |
| | | **~144-164 EUR/Monat** | |

### Optionale Extras

| Service | Kosten | Zweck |
|---------|--------|-------|
| Snov.io (Fallback E-Mail) | ab 30 EUR/Monat | Falls Hunter.io nicht reicht |
| Ahrefs (voll, für Brand Radar AI) | ab 129 EUR/Monat | AI-Mentions in ChatGPT, Perplexity etc. |
| Hetzner Upgrade auf CX43 | 17,49 EUR/Monat | Falls mehr Power nötig (8 vCPU, 16GB) |

### Gesamtkosten Minimal: **~150-170 EUR/Monat**

---

## 3. Sicherheitskonzept (Defense in Depth)

### Ebene 1: Netzwerk & Infrastruktur

```
Internet → Cloudflare (WAF/DDoS) → Caddy (TLS Termination) → App
```

- **Cloudflare WAF** (free tier): SQL Injection, XSS, OWASP Top 10 Regeln
- **Cloudflare Rate Limiting**: Max 100 Requests/Minute pro IP
- **DDoS Protection**: Automatisch via Cloudflare
- **Hetzner Firewall**: Nur Port 80/443 offen, SSH nur von deiner IP
- **Caddy**: Automatische HTTPS-Redirects, HSTS, TLS 1.3 only

```bash
# Hetzner Firewall Rules
ALLOW TCP 443 FROM 0.0.0.0/0    # HTTPS
ALLOW TCP 80  FROM 0.0.0.0/0    # HTTP → HTTPS redirect
ALLOW TCP 22  FROM DEINE_IP/32  # SSH nur von dir
DENY ALL
```

### Ebene 2: Applikation (Next.js)

**Security Headers** (via `next.config.js`):
```typescript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.dataforseo.com https://api.hunter.io wss://firehose.com;" }
]
```

**CSRF Protection:**
- SameSite=Strict Cookies
- CSRF Token in allen State-ändernden Requests
- Origin-Header Validierung

**Input Validation:**
- Zod Schemas auf ALLEN API-Eingaben
- Parameterized Queries über Prisma (SQL Injection unmöglich)
- Content-Type Enforcement (nur application/json akzeptieren)

### Ebene 3: Authentifizierung & Autorisierung

**Auth.js v5** (ehemals NextAuth.js) mit Defense-in-Depth:

```
                    ┌─────────────────┐
                    │  Cloudflare     │ ← Rate Limiting auf /api/auth/*
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │  Middleware      │ ← Route Protection (optimistisch)
                    │  (Edge)         │    NICHT alleinige Auth-Schicht!
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │  Data Access    │ ← Auth-Check bei JEDEM DB-Zugriff
                    │  Layer (DAL)    │    = echte Security-Grenze
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │  Prisma/DB      │ ← Row-Level Filtering (projectId)
                    └─────────────────┘
```

**Wichtig — CVE-2025-29927 beachtet:**
- Next.js Middleware ist NICHT die einzige Auth-Schicht
- Jeder API-Endpoint verifiziert Session eigenständig
- Data Access Layer Pattern: Auth-Check vor jedem DB-Query
- Caddy strippt `x-middleware-subrequest` Header (Exploit-Vektor)

**Passwort-Sicherheit:**
- bcrypt mit Cost Factor 12 (nicht schneller!)
- Passwort-Policy: Min 12 Zeichen, Komplexitätscheck
- Rate Limiting auf Login: Max 5 Versuche / 15 Min pro IP
- Account Lockout nach 10 Fehlversuchen

**Session Management:**
- JWT mit RS256 (asymmetrisch, nicht HS256)
- Token Expiry: 1 Stunde (Access) + 7 Tage (Refresh)
- HttpOnly + Secure + SameSite=Strict Cookies
- Session Revocation via DB-Check

**RBAC (Role-Based Access Control):**
```
Admin:
  ✅ Projekte erstellen/löschen
  ✅ Mitarbeiter verwalten (einladen, Rollen ändern)
  ✅ Alle Projekte sehen
  ✅ System-Einstellungen
  ✅ Audit-Log einsehen

Mitarbeiter:
  ✅ Nur zugewiesene Projekte sehen
  ✅ Backlinks, Mentions, Kontakte bearbeiten
  ✅ Analysen starten
  ❌ Keine Projekterstellung
  ❌ Keine Mitarbeiterverwaltung
  ❌ Kein Audit-Log
```

### Ebene 4: Datenbank

- **PostgreSQL** statt SQLite (Production-ready, Encryption, Row-Level Security)
- **Encryption at Rest**: PostgreSQL `pgcrypto` für sensible Felder (E-Mails, Kontaktdaten)
- **Connection Pooling**: Via Prisma (max 10 Connections)
- **Backups**: Tägliche pg_dump + Hetzner Snapshots
- **Kein direkter DB-Zugriff**: Nur über Prisma ORM, nie Raw SQL

### Ebene 5: Secrets Management

```bash
# .env wird NIEMALS committet
# Secrets werden auf dem Server direkt gesetzt

# Generierung sicherer Secrets:
openssl rand -base64 32  # für NEXTAUTH_SECRET
openssl rand -hex 32     # für N8N_WEBHOOK_SECRET
```

- Alle API-Keys in `.env` auf dem Server
- Docker Secrets für Container-Isolation
- Key Rotation: Vierteljährlich für eigene Secrets
- Kein Secret in Docker Images oder Git

### Ebene 6: Audit Trail & Monitoring

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String   // "login" | "project.create" | "backlink.fetch" | "contact.export"
  entity    String?  // "LBProject" | "LBContact" etc.
  entityId  String?
  metadata  String?  // JSON: Details der Aktion
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
}
```

- Jede wichtige Aktion wird geloggt (Login, Datenexport, API-Aufrufe)
- Fehlgeschlagene Logins werden geloggt + alarmiert
- Admin kann Audit-Log einsehen
- Logs werden 90 Tage aufbewahrt (DSGVO)

### Ebene 7: DSGVO / Datenschutz

- **Datensparsamkeit**: Nur nötige Daten speichern
- **Verschlüsselung**: TLS in Transit, pgcrypto at Rest für PII
- **Löschkonzept**: Kontaktdaten + Mentions löschbar auf Knopfdruck
- **Datenexport**: Admin kann alle Daten eines Projekts als JSON exportieren
- **Auftragsverarbeitung**: Hetzner hat AV-Vertrag (Standard)
- **Cookie-Banner**: Nicht nötig (keine Tracking-Cookies, nur Session-Cookie)
- **Impressum/Datenschutz**: Links im Footer der App

---

## 4. Brand Mentions — Ahrefs Firehose (firehose.com)

### Was ist Firehose?

Firehose (firehose.com) ist ein **kostenloses Echtzeit-Web-Monitoring-Tool von Ahrefs**. Es nutzt Ahrefs' riesigen Web-Crawler (einer der grössten der Welt) und liefert Mentions per **Server-Sent Events (SSE)** in Echtzeit.

### Wie es funktioniert:

```
1. Du erstellst einen "Tap" (= Datenquelle)
2. Du definierst "Rules" (= Lucene-Filter)
3. Firehose streamt alle passenden Seiten live per SSE
```

### Konkrete Integration:

**Schritt 1: Tap erstellen**
```
POST https://api.firehose.com/v1/taps
Authorization: Bearer fhm_DEIN_MANAGEMENT_KEY
```

**Schritt 2: Rules definieren (pro Kundenprojekt)**
```
POST https://api.firehose.com/v1/taps/{tap_id}/rules
Authorization: Bearer fh_DEIN_TAP_TOKEN

{
  "value": "\"LeadSite\" OR \"leadsite.de\" OR \"Firmenname\"",
  "tag": "brand-mentions-projekt-123"
}
```

**Schritt 3: SSE Stream konsumieren (via n8n)**
```
GET https://api.firehose.com/v1/taps/{tap_id}/stream
Authorization: Bearer fh_DEIN_TAP_TOKEN
Accept: text/event-stream
```

Jede gefundene Seite kommt als Event mit:
- URL, Domain, Title
- Snippet/Content-Auszug
- Crawl-Zeitpunkt
- Matching Rule + Tag

### n8n Workflow für Firehose:

```
┌──────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│ n8n SSE Trigger  │────▶│ Duplikat-Check     │────▶│ Webhook an App   │
│ (firehose.com    │     │ (URL schon in DB?) │     │ POST /api/lb/    │
│  Stream)         │     │                    │     │ webhooks/mentions│
└──────────────────┘     └────────────────────┘     └──────────────────┘
                                                            │
                                                            ▼
                                                    ┌──────────────────┐
                                                    │ Link-Check:      │
                                                    │ Enthält die Seite│
                                                    │ einen Backlink?  │
                                                    │ → hasLink=true   │
                                                    └──────────────────┘
```

### Fallback-Strategie (3 Quellen):

| Priorität | Quelle | Typ | Kosten |
|-----------|--------|-----|--------|
| 1 | **Firehose.com** (Ahrefs) | Echtzeit SSE Stream | Kostenlos (Beta) |
| 2 | **DataForSEO Content Analysis** | Polling (alle 4h) | In DataForSEO-Budget enthalten |
| 3 | **Google Alerts RSS** | RSS-Feed Parsing | Kostenlos |

Alle drei Quellen werden parallel betrieben. n8n dedupliziert automatisch (URL als unique key).

### Firehose API Keys:

```bash
# In .env
FIREHOSE_MANAGEMENT_KEY="fhm_..."   # Für Tap-Verwaltung
FIREHOSE_TAP_TOKEN="fh_..."          # Für Rules + Streaming
```

**Account erstellen:** Kostenlos auf firehose.com — kein Ahrefs-Abo nötig!

---

## 5. Datenmodell (Prisma Schema — PostgreSQL)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// === AUTH ===
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String
  role          String   @default("employee") // "admin" | "employee"
  isActive      Boolean  @default(true)
  failedLogins  Int      @default(0)
  lockedUntil   DateTime?
  lastLoginAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  projects      LBProjectMember[]
  auditLogs     AuditLog[]
  sessions      Session[]
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token        String   @unique
  expiresAt    DateTime
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String
  entity    String?
  entityId  String?
  metadata  String?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

// === LINKBUILDING PROJEKT ===
model LBProject {
  id            String   @id @default(cuid())
  name          String
  domain        String
  url           String
  brandKeywords String?  // JSON array: Brand-Keywords für Mention-Tracking
  customerId    String?
  customer      Customer? @relation(fields: [customerId], references: [id])
  status        String   @default("active")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  members       LBProjectMember[]
  backlinks     LBBacklink[]
  competitors   LBCompetitor[]
  mentions      LBBrandMention[]
  brokenLinks   LBBrokenLink[]
  contacts      LBContact[]
  snapshots     LBBacklinkSnapshot[]

  @@index([status])
  @@index([customerId])
}

model LBProjectMember {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  projectId String
  project   LBProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  role      String   @default("member")

  @@unique([userId, projectId])
}

// === BACKLINKS ===
model LBBacklink {
  id              String   @id @default(cuid())
  projectId       String
  project         LBProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sourceUrl       String
  sourceDomain    String
  targetUrl       String
  anchorText      String?
  linkType        String   @default("dofollow")
  category        String?
  domainRating    Float?
  pageRating      Float?
  isActive        Boolean  @default(true)
  firstSeen       DateTime @default(now())
  lastChecked     DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([projectId])
  @@index([sourceDomain])
  @@index([linkType])
  @@index([category])
}

model LBBacklinkSnapshot {
  id              String   @id @default(cuid())
  projectId       String
  project         LBProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  date            DateTime @default(now())
  totalBacklinks  Int
  dofollowCount   Int
  nofollowCount   Int
  avgDR           Float?
  referringDomains Int
  newBacklinks    Int      @default(0)
  lostBacklinks   Int      @default(0)

  @@index([projectId, date])
}

// === WETTBEWERBER ===
model LBCompetitor {
  id              String   @id @default(cuid())
  projectId       String
  project         LBProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  domain          String
  domainRating    Float?
  totalBacklinks  Int?
  isAISuggested   Boolean  @default(false)
  gapData         String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([projectId])
}

// === BRAND MENTIONS ===
model LBBrandMention {
  id              String   @id @default(cuid())
  projectId       String
  project         LBProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sourceUrl       String
  sourceDomain    String
  title           String?
  snippet         String?
  hasLink         Boolean  @default(false)
  mentionDate     DateTime?
  source          String?  // "firehose" | "dataforseo" | "google_alerts"
  status          String   @default("new")
  createdAt       DateTime @default(now())

  @@unique([projectId, sourceUrl])  // Deduplizierung!
  @@index([projectId, status])
  @@index([hasLink])
}

// === BROKEN BACKLINKS ===
model LBBrokenLink {
  id              String   @id @default(cuid())
  projectId       String
  project         LBProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sourceUrl       String
  sourceDomain    String
  brokenUrl       String
  anchorText      String?
  topicRelevance  Float?
  suggestedUrl    String?
  httpStatus      Int?
  domainRating    Float?
  status          String   @default("found")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([projectId, status])
  @@index([topicRelevance])
}

// === KONTAKTE ===
model LBContact {
  id              String   @id @default(cuid())
  projectId       String
  project         LBProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  domain          String
  pageUrl         String?
  name            String?
  email           String?   // Verschlüsselt gespeichert via pgcrypto
  phone           String?
  position        String?
  source          String?
  linkedinUrl     String?
  outreachStatus  String   @default("new")
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([projectId])
  @@index([domain])
  @@index([outreachStatus])
}
```

---

## 6. Alle APIs & Endpoints (DataForSEO)

### Backlink-Profil
| Endpoint | Zweck |
|----------|-------|
| `POST /v3/backlinks/summary` | Gesamtübersicht: Total, Dofollow, Nofollow, DR, Referring Domains |
| `POST /v3/backlinks/backlinks/live` | Alle einzelnen Backlinks einer URL |
| `POST /v3/backlinks/anchors/live` | Ankertexte mit Statistiken |
| `POST /v3/backlinks/referring_domains/live` | Verweisende Domains |
| `POST /v3/backlinks/domain_pages/live` | Seiten mit meisten Backlinks |
| `POST /v3/backlinks/timeseries_summary` | Backlink-Entwicklung über Zeit |
| `POST /v3/backlinks/timeseries_new_lost_summary` | Neue vs. verlorene Backlinks |
| `POST /v3/backlinks/history` | Historische Backlink-Daten |

### Gap-Analyse
| Endpoint | Zweck |
|----------|-------|
| `POST /v3/backlinks/competitors` | Wettbewerber finden (ähnliches Backlinkprofil) |
| `POST /v3/backlinks/domain_intersection/live` | Backlink-Gap: Domains die auf Wettbewerber linken, aber nicht auf dich |
| `POST /v3/backlinks/page_intersection/live` | Page-Level Gap-Analyse |

### Broken Links
| Endpoint | Zweck |
|----------|-------|
| `POST /v3/backlinks/broken_backlinks/live` | Kaputte eingehende Links |
| `POST /v3/backlinks/broken_pages/live` | Seiten mit 4xx/5xx Status |

### Brand Mentions
| Endpoint | Zweck |
|----------|-------|
| `POST /v3/content_analysis/search/live` | Web-Mentions nach Keywords |
| `POST /v3/content_analysis/summary/live` | Mention-Statistiken |

### Authentifizierung
```
Authorization: Basic base64(LOGIN:PASSWORD)
Content-Type: application/json
```

---

## 7. n8n Automationen (6 Workflows)

### Workflow 1: Täglicher Backlink-Snapshot
```
Trigger: Schedule (täglich 06:00 UTC)
│
├─ HTTP Request: GET /api/lb/projects?status=active
│  (Liste aller aktiven Projekte)
│
├─ Loop über Projekte:
│  ├─ HTTP Request: POST DataForSEO /v3/backlinks/summary
│  │  Body: { "target": project.domain, "mode": "as_is" }
│  │
│  ├─ HTTP Request: POST /api/lb/webhooks/snapshot
│  │  Headers: { "X-Webhook-Secret": N8N_WEBHOOK_SECRET }
│  │  Body: { projectId, totalBacklinks, dofollow, nofollow, avgDR, ... }
│  │
│  └─ IF: Backlinks gesunken > 10%
│     └─ Send Email: Alert an Projekt-Owner
```

### Workflow 2: Firehose Brand Mention Stream
```
Trigger: SSE Trigger (firehose.com Stream-URL)
│
├─ Parse Event Data (URL, Title, Snippet, Domain)
│
├─ Extract Tag → projectId Mapping
│
├─ HTTP Request: POST /api/lb/webhooks/mentions
│  Headers: { "X-Webhook-Secret": N8N_WEBHOOK_SECRET }
│  Body: { projectId, sourceUrl, sourceDomain, title, snippet, source: "firehose" }
│
└─ IF: Unlinked Mention (hasLink = false)
   └─ Send Email: "Neue Mention ohne Link auf domain.de"
```

### Workflow 3: DataForSEO Mention Scanner (Backup)
```
Trigger: Schedule (alle 6 Stunden)
│
├─ HTTP Request: GET /api/lb/projects?status=active
│
├─ Loop über Projekte:
│  ├─ Parse brandKeywords JSON
│  │
│  ├─ HTTP Request: POST DataForSEO /v3/content_analysis/search/live
│  │  Body: { "keyword": brandKeywords, "search_mode": "as_is" }
│  │
│  └─ Loop über Results:
│     └─ HTTP Request: POST /api/lb/webhooks/mentions
│        Body: { ..., source: "dataforseo" }
```

### Workflow 4: Broken Link Checker
```
Trigger: Schedule (wöchentlich, Montag 03:00)
│
├─ HTTP Request: GET /api/lb/projects?status=active
│
├─ Loop über Projekte:
│  ├─ HTTP Request: POST DataForSEO /v3/backlinks/broken_backlinks/live
│  │  Body: { "target": project.domain }
│  │
│  ├─ HTTP Request: POST Claude API
│  │  Prompt: "Bewerte Themenrelevanz dieser Ankertexte
│  │           zum Thema [project.domain]..."
│  │  → Gibt Relevanz-Score 0-1 zurück
│  │
│  └─ HTTP Request: POST /api/lb/webhooks/broken-links
│     Body: { projectId, sourceUrl, brokenUrl, anchorText, topicRelevance, ... }
```

### Workflow 5: Kontakt-Extraktion (On-Demand)
```
Trigger: Webhook POST von Frontend
Input: { domain, projectId }
│
├─ Step 1: Hunter.io Domain Search
│  GET https://api.hunter.io/v2/domain-search?domain={domain}
│  → E-Mails, Namen, Positionen
│
├─ IF keine Ergebnisse:
│  ├─ Step 2: Website Scraping (Impressum)
│  │  HTTP Request: GET https://{domain}/impressum
│  │  → Parse E-Mail, Telefon, Name
│  │
│  └─ Step 3: Kontaktseite
│     HTTP Request: GET https://{domain}/kontakt
│     → Parse Kontaktdaten
│
└─ HTTP Request: POST /api/lb/webhooks/contacts
   Body: { projectId, contacts: [...] }
```

### Workflow 6: Gap-Analyse (On-Demand)
```
Trigger: Webhook POST von Frontend
Input: { projectId, targetDomain, competitorDomains[] }
│
├─ HTTP Request: POST DataForSEO /v3/backlinks/domain_intersection/live
│  Body: {
│    "targets": {
│      "1": targetDomain,     // "exclude"
│      "2": competitor1,      // "include"
│      "3": competitor2       // "include"
│    }
│  }
│
├─ Filter: DR > 20, aktive Links only
│
└─ HTTP Request: POST /api/lb/webhooks/gap-results
   Body: { projectId, gaps: [...] }
```

---

## 8. Neue Dependencies

```json
{
  "dependencies": {
    "next-auth": "^5.0.0-beta.25",  // Auth.js v5 (aktuellste Version)
    "bcryptjs": "^2.4.3",           // Passwort-Hashing
    "recharts": "^2.12.0",          // Charts
    "@tanstack/react-table": "^8.20.0", // Sortierbare/filterbare Tabellen
    "file-saver": "^2.0.5",         // CSV/VCF Export
    "eventsource": "^2.0.2"         // SSE Client für Firehose (optional)
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/file-saver": "^2.0.7"
  }
}
```

---

## 9. Environment Variables (komplett)

```bash
# === DATABASE ===
DATABASE_URL="postgresql://linkbuilding:SICHERES_PW@localhost:5432/linkbuilding_db"

# === AUTH ===
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://pr.leadsite.de"
ADMIN_INITIAL_EMAIL="admin@leadsite.de"
ADMIN_INITIAL_PASSWORD="..."          # Nur für initialen Seed, danach ändern!

# === EXTERNE APIs ===
ANTHROPIC_API_KEY=""                   # Claude API (Kategorisierung, Relevanz)
DATAFORSEO_LOGIN=""                    # DataForSEO Login
DATAFORSEO_PASSWORD=""                 # DataForSEO Password

# === BRAND MENTIONS ===
FIREHOSE_MANAGEMENT_KEY="fhm_..."     # firehose.com Management Key
FIREHOSE_TAP_TOKEN="fh_..."           # firehose.com Tap Token

# === KONTAKT-EXTRAKTION ===
HUNTER_API_KEY=""                      # Hunter.io API Key

# === n8n ===
N8N_WEBHOOK_SECRET="$(openssl rand -hex 32)"
N8N_BASE_URL="https://n8n.leadsite.de"

# === APP ===
NEXT_PUBLIC_APP_URL="https://pr.leadsite.de"
NODE_ENV="production"
```

---

## 10. Hosting Setup (Schritt-für-Schritt)

### 1. Hetzner Cloud Server bestellen
- Plan: **CX33** (4 vCPU, 8GB RAM, 80GB SSD)
- Location: **Nürnberg (nbg1)** oder **Falkenstein (fsn1)**
- Image: **Ubuntu 24.04**
- Backups aktivieren (+20%)
- SSH Key hinterlegen

### 2. DNS bei Cloudflare einrichten
```
pr.leadsite.de     → A Record → HETZNER_SERVER_IP (Proxy: ON)
n8n.leadsite.de    → A Record → HETZNER_SERVER_IP (Proxy: ON)
```

### 3. Server absichern
```bash
# SSH härten
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Firewall
ufw default deny incoming
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow from DEINE_IP to any port 22
ufw enable

# Automatic Security Updates
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### 4. Docker + Docker Compose installieren
```bash
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin
```

### 5. docker-compose.yml deployen
```yaml
version: '3.8'

services:
  app:
    build: .
    restart: always
    environment:
      - DATABASE_URL=postgresql://linkbuilding:${DB_PASSWORD}@db:5432/linkbuilding_db
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
    networks:
      - internal

  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: linkbuilding
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: linkbuilding_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U linkbuilding"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - internal

  n8n:
    image: n8nio/n8n:latest
    restart: always
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - WEBHOOK_URL=https://n8n.leadsite.de/
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - internal

  caddy:
    image: caddy:2-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - internal

volumes:
  postgres_data:
  n8n_data:
  caddy_data:
  caddy_config:

networks:
  internal:
    driver: bridge
```

### 6. Caddyfile
```
pr.leadsite.de {
    reverse_proxy app:3000
    header {
        -Server
        X-Robots-Tag "noindex, nofollow"
    }
    # Strip exploit header (CVE-2025-29927)
    request_header -x-middleware-subrequest
}

n8n.leadsite.de {
    reverse_proxy n8n:5678
    basicauth * {
        admin $2a$14$BCRYPT_HASH_HERE
    }
}
```

---

## 11. Implementierungs-Reihenfolge

| Phase | Inhalt |
|-------|--------|
| **Phase 1** | PostgreSQL Setup + Auth.js v5 + RBAC + Audit-Log + Security Headers |
| **Phase 2** | Projekt-CRUD + Sidebar Navigation + Projekt-Dashboard |
| **Phase 3** | Backlinkprofil: DataForSEO Integration + Tabelle + Charts + AI-Kategorisierung |
| **Phase 4** | Gap-Analyse: Wettbewerber + AI-Empfehlung + Domain Intersection |
| **Phase 5** | Brand Mentions: Firehose SSE + DataForSEO Content Analysis + Mention-Management |
| **Phase 6** | Broken Links: Discovery + AI-Relevanzcheck + Ersatz-Vorschläge |
| **Phase 7** | Kontakte: Hunter.io + Export CSV/VCF + Outreach-Status |
| **Phase 8** | n8n Webhook-Endpoints + alle 6 Automations-Workflows |
| **Phase 9** | Dashboard KPIs + recharts Charts + Polish + Tests |
| **Phase 10** | Docker Production Build + Hetzner Deployment + Cloudflare Setup |

---

## 12. Mock-Strategie (Entwicklung ohne API-Keys)

Alle externen APIs haben realistische Mock-Fallbacks:

| API | Mock-Verhalten |
|-----|---------------|
| **DataForSEO Backlinks** | 50-200 Backlinks mit realistischen DR, Ankertexten, Kategorien |
| **DataForSEO Gap** | 20-50 Gap-Domains mit DR + Link-Daten |
| **Firehose SSE** | Simulierter Stream mit 1 Event/30 Sekunden |
| **Hunter.io** | 2-5 Kontakte pro Domain mit realistischen Daten |
| **Broken Links** | 5-15 Broken Links mit Relevanz-Scores |
| **Claude AI** | Deterministische Kategorisierung + Relevanz-Antworten |

Das Tool funktioniert **vollständig ohne API-Keys** — ideal für Entwicklung und Demo.
