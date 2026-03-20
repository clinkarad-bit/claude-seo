# SEOPilot - Komplette Deployment-Anleitung

Schritt-für-Schritt-Anleitung zum Aufsetzen der SEOPilot-App auf einem Hetzner-Server mit n8n-Automationen.

---

## Inhaltsverzeichnis

1. [Hetzner Server bestellen](#1-hetzner-server-bestellen)
2. [Server einrichten](#2-server-einrichten)
3. [Domain & DNS konfigurieren](#3-domain--dns-konfigurieren)
4. [App deployen mit Docker](#4-app-deployen-mit-docker)
5. [SSL-Zertifikat einrichten](#5-ssl-zertifikat-einrichten)
6. [n8n installieren & konfigurieren](#6-n8n-installieren--konfigurieren)
7. [API-Keys einrichten](#7-api-keys-einrichten)
8. [n8n Workflows erstellen](#8-n8n-workflows-erstellen)
9. [WordPress/Webflow verbinden](#9-wordpresswebflow-verbinden)
10. [Monitoring & Wartung](#10-monitoring--wartung)

---

## 1. Hetzner Server bestellen

### Was du brauchst
- Einen Hetzner-Account: https://www.hetzner.com
- Eine Domain (z.B. bei INWX, Cloudflare, oder direkt bei Hetzner)

### Server bestellen

1. Gehe zu https://www.hetzner.com/cloud
2. Klicke auf **"Server hinzufügen"**
3. Wähle folgende Einstellungen:

| Einstellung | Empfehlung |
|---|---|
| **Standort** | Falkenstein (DE) oder Nürnberg (DE) |
| **Image** | Ubuntu 24.04 |
| **Typ** | CPX21 (3 vCPU, 4 GB RAM, 80 GB SSD) - ca. 8€/Monat |
| **Netzwerk** | IPv4 aktivieren |
| **SSH-Key** | Einen SSH-Key hinzufügen (sicherer als Passwort) |
| **Name** | z.B. `seopilot-prod` |

4. Klicke auf **"Server erstellen"**
5. Notiere dir die **IP-Adresse** des Servers

### SSH-Key erstellen (falls noch keinen hast)

Öffne dein Terminal (Mac/Linux) oder PowerShell (Windows):

```bash
# SSH-Key generieren
ssh-keygen -t ed25519 -C "deine-email@example.com"

# Öffentlichen Key anzeigen (diesen bei Hetzner einfügen)
cat ~/.ssh/id_ed25519.pub
```

---

## 2. Server einrichten

### Per SSH verbinden

```bash
ssh root@DEINE-SERVER-IP
```

### System updaten & Basics installieren

```bash
# System updaten
apt update && apt upgrade -y

# Wichtige Tools installieren
apt install -y curl git ufw fail2ban htop

# Firewall einrichten
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Fail2ban starten (Schutz vor Brute-Force)
systemctl enable fail2ban
systemctl start fail2ban
```

### Docker installieren

```bash
# Docker installieren
curl -fsSL https://get.docker.com | sh

# Docker Compose installieren (ist in neueren Docker-Versionen integriert)
docker --version
docker compose version

# Docker beim Systemstart starten
systemctl enable docker
```

### Neuen Benutzer anlegen (optional aber empfohlen)

```bash
# Benutzer anlegen
adduser seopilot
usermod -aG docker seopilot
usermod -aG sudo seopilot

# Als neuer Benutzer einloggen
su - seopilot
```

---

## 3. Domain & DNS konfigurieren

### DNS-Einträge setzen

Gehe zu deinem Domain-Registrar und erstelle diese DNS-Einträge:

| Typ | Name | Wert | TTL |
|---|---|---|---|
| A | seopilot | DEINE-SERVER-IP | 3600 |
| A | n8n | DEINE-SERVER-IP | 3600 |

Beispiel: Wenn deine Domain `meine-agentur.de` ist:
- `seopilot.meine-agentur.de` → Deine Server-IP
- `n8n.meine-agentur.de` → Deine Server-IP

**Warte 5-10 Minuten**, bis die DNS-Einträge propagiert sind.

Prüfe mit:
```bash
ping seopilot.meine-agentur.de
```

---

## 4. App deployen mit Docker

### Projekt auf den Server klonen

```bash
cd /home/seopilot
git clone https://github.com/clinkarad-bit/claude-seo.git seopilot
cd seopilot
```

### Environment-Variablen konfigurieren

```bash
cp .env.example .env
nano .env
```

Fülle die `.env` Datei aus:

```env
# Datenbank
DATABASE_URL=file:./prod.db

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...dein-key...
OPENAI_API_KEY=sk-...dein-key...

# SEO Data
DATAFORSEO_LOGIN=dein-login
DATAFORSEO_PASSWORD=dein-passwort

# App
NEXT_PUBLIC_APP_URL=https://seopilot.meine-agentur.de
NODE_ENV=production

# n8n Webhook URL (wird in Schritt 6 konfiguriert)
N8N_WEBHOOK_URL=https://n8n.meine-agentur.de
```

### Docker Compose für Produktion

Erstelle/aktualisiere die `docker-compose.yml`:

```bash
nano docker-compose.yml
```

```yaml
version: '3.8'

services:
  seopilot:
    build: .
    container_name: seopilot-app
    restart: always
    ports:
      - "3000:3000"
    volumes:
      - sqlite_data:/app/prisma
      - uploads_data:/app/public/uploads
    environment:
      - DATABASE_URL=file:./prod.db
      - NODE_ENV=production
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  n8n:
    image: n8nio/n8n:latest
    container_name: seopilot-n8n
    restart: always
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
    environment:
      - N8N_HOST=n8n.meine-agentur.de
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.meine-agentur.de/
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=SICHERES-PASSWORT-HIER
      - GENERIC_TIMEZONE=Europe/Berlin

volumes:
  sqlite_data:
  uploads_data:
  n8n_data:
```

### App starten

```bash
# Bauen und starten
docker compose up -d --build

# Logs prüfen
docker compose logs -f seopilot

# Status prüfen
docker compose ps
```

Die App läuft jetzt auf Port 3000, n8n auf Port 5678.

---

## 5. SSL-Zertifikat einrichten

### Nginx als Reverse Proxy installieren

```bash
# Nginx installieren
apt install -y nginx certbot python3-certbot-nginx

# Nginx-Config für SEOPilot erstellen
nano /etc/nginx/sites-available/seopilot
```

```nginx
server {
    listen 80;
    server_name seopilot.meine-agentur.de;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}

server {
    listen 80;
    server_name n8n.meine-agentur.de;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        chunked_transfer_encoding off;
        proxy_buffering off;
    }
}
```

```bash
# Config aktivieren
ln -s /etc/nginx/sites-available/seopilot /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Config testen
nginx -t

# Nginx neustarten
systemctl restart nginx
```

### SSL mit Let's Encrypt

```bash
# SSL-Zertifikat für beide Domains holen
certbot --nginx -d seopilot.meine-agentur.de -d n8n.meine-agentur.de

# E-Mail eingeben und Bedingungen akzeptieren
# Certbot konfiguriert Nginx automatisch für HTTPS

# Auto-Renewal testen
certbot renew --dry-run
```

Jetzt erreichst du die App unter `https://seopilot.meine-agentur.de` und n8n unter `https://n8n.meine-agentur.de`.

---

## 6. n8n installieren & konfigurieren

n8n läuft bereits als Docker-Container (siehe Schritt 4). Jetzt konfigurieren wir die Workflows.

### Erster Login

1. Öffne `https://n8n.meine-agentur.de`
2. Erstelle dein Admin-Konto
3. Du siehst das n8n Dashboard

### Credentials einrichten

Gehe in n8n zu **Settings → Credentials** und erstelle:

| Credential | Typ | Werte |
|---|---|---|
| **Anthropic Claude** | HTTP Header Auth | Header: `x-api-key`, Value: dein Anthropic Key |
| **DataForSEO** | HTTP Basic Auth | Username + Password |
| **SEOPilot API** | HTTP Header Auth | Header: `Cookie`, Value: `lb-session=DEIN-SESSION-TOKEN` |
| **SMTP** | SMTP | Dein E-Mail-Server (Gmail, Mailgun, etc.) |

---

## 7. API-Keys einrichten

### Anthropic Claude API

1. Gehe zu https://console.anthropic.com
2. Klicke auf **API Keys** → **Create Key**
3. Kopiere den Key und trage ihn in `.env` ein als `ANTHROPIC_API_KEY`
4. **Kosten**: ca. $3-15/Monat bei normalem Gebrauch

### DataForSEO API

1. Registriere dich bei https://dataforseo.com
2. Gehe zu **Dashboard** → **API Credentials**
3. Kopiere Login + Password in `.env`
4. **Kosten**: Pay-as-you-go, ca. $0.75 pro 1000 Keyword-Abfragen

DataForSEO wird verwendet für:
- **Keyword Research** (`/v3/keywords_data/google_ads/search_volume/live`)
- **SERP Analysis** (`/v3/serp/google/organic/live/regular`)
- **Backlink Data** (`/v3/backlinks/backlinks/live`)
- **Domain Metrics** (`/v3/backlinks/summary/live`)
- **Competitor Analysis** (`/v3/backlinks/competitors/live`)
- **Rank Tracking** (`/v3/serp/google/organic/live/regular`)
- **Content Gap** (`/v3/backlinks/domain_intersection/live`)

### Google Search Console (optional)

1. Gehe zu https://console.cloud.google.com
2. Erstelle ein Projekt
3. Aktiviere die **Search Console API**
4. Erstelle OAuth 2.0 Credentials
5. Verbinde in den SEOPilot-Einstellungen

### Perplexity API (optional, für Research)

1. Gehe zu https://docs.perplexity.ai
2. Erstelle einen API-Key
3. Trage ihn in den SEOPilot-Einstellungen ein

---

## 8. n8n Workflows erstellen

Hier sind die wichtigsten Automationen, die du in n8n einrichten solltest:

### Workflow 1: Wöchentlicher Ranking-Report

```
Trigger: Cron (Montag 9:00)
→ HTTP Request: GET seopilot-api/rank-tracker?customerId=X
→ Code Node: Report-Daten aufbereiten
→ HTTP Request: POST seopilot-api/reports (Report speichern)
→ Send Email: Report an Admin + Nutzer senden
```

**So erstellst du den Workflow:**

1. In n8n: **Add Workflow** → Name: "Wöchentlicher Ranking Report"
2. **Schedule Trigger** hinzufügen:
   - Trigger Interval: Every Week
   - Day: Monday
   - Hour: 9
3. **HTTP Request** Node:
   - Method: GET
   - URL: `https://seopilot.meine-agentur.de/api/rank-tracker?customerId={{$json.customerId}}`
   - Authentication: Header Auth (Cookie)
4. **Code** Node (JavaScript):
   ```javascript
   const rankings = $input.first().json;
   const winners = rankings.filter(r => r.trend === 'up');
   const losers = rankings.filter(r => r.trend === 'down');

   return {
     subject: `SEO Report KW ${new Date().getWeek()} - ${winners.length} Winner, ${losers.length} Loser`,
     html: `<h2>Ranking Report</h2>
       <h3>Winner (${winners.length})</h3>
       <ul>${winners.map(w => `<li>${w.keyword}: Position ${w.previousPosition} → ${w.currentPosition}</li>`).join('')}</ul>
       <h3>Loser (${losers.length})</h3>
       <ul>${losers.map(l => `<li>${l.keyword}: Position ${l.previousPosition} → ${l.currentPosition}</li>`).join('')}</ul>`
   };
   ```
5. **Send Email** Node:
   - To: admin@deine-agentur.de
   - Subject: `{{$json.subject}}`
   - HTML: `{{$json.html}}`

### Workflow 2: Monatliches Competitor-Screening

```
Trigger: Cron (1. des Monats, 6:00)
→ HTTP Request: GET seopilot-api/competitors?customerId=X
→ Loop: Für jeden Competitor
  → HTTP Request: POST seopilot-api/competitors/{id}/screen
→ HTTP Request: POST seopilot-api/reports
→ Send Email: Competitor-Report senden
```

### Workflow 3: Content-Generierung Pipeline

```
Trigger: Webhook (von SEOPilot ausgelöst)
→ HTTP Request: SERP-Analyse für Keyword (DataForSEO)
→ HTTP Request: PAA-Fragen abrufen (DataForSEO)
→ HTTP Request: WDF*IDF Analyse (DataForSEO)
→ Code Node: Daten zusammenführen
→ HTTP Request: Claude API → Outline generieren
→ HTTP Request: POST seopilot-api/articles/{id} (Outline speichern)
→ Wait: Auf User-Approval warten (Webhook)
→ HTTP Request: Claude API → Artikel generieren (2-Pass)
→ HTTP Request: PATCH seopilot-api/articles/{id} (Artikel speichern)
```

### Workflow 4: Tägliches Rank-Tracking

```
Trigger: Cron (täglich 7:00)
→ HTTP Request: GET seopilot-api/rank-tracker?customerId=X
→ Loop: Für jedes Keyword
  → HTTP Request: DataForSEO SERP Position
→ HTTP Request: POST seopilot-api/rank-tracker/measure
→ Code Node: Winner/Loser identifizieren
→ IF: Große Änderungen?
  → Send Email: Alert an Admin
```

### Workflow 5: Content-Gap Monatliche Analyse

```
Trigger: Cron (15. des Monats, 6:00)
→ HTTP Request: GET Competitors für Kunden
→ HTTP Request: DataForSEO Domain Intersection
→ Code Node: Gaps identifizieren
→ HTTP Request: POST seopilot-api/content-gap
→ Send Email: Content-Gap Report
```

### Workflow 6: Bildgenerierung

```
Trigger: Webhook (von Artikel-Editor ausgelöst)
→ HTTP Request: OpenAI DALL-E oder Stable Diffusion
→ Code Node: Bild speichern
→ HTTP Request: PATCH seopilot-api/articles/{id} (Bild zuordnen)
```

---

## 9. WordPress/Webflow verbinden

### WordPress verbinden

1. Installiere auf deiner WordPress-Seite das Plugin: **Application Passwords** (ist in WP 5.6+ integriert)
2. Gehe zu **Benutzer → Profil → Anwendungspasswörter**
3. Erstelle ein neues Passwort für "SEOPilot"
4. In SEOPilot: **Einstellungen → WordPress-Verbindungen**
   - Site URL: `https://deine-website.de`
   - API Key: `benutzername:anwendungspasswort` (Base64-encoded)
5. Klicke **Verbinden** - SEOPilot testet die Verbindung

**Was dann möglich ist:**
- Artikel direkt aus SEOPilot nach WordPress publishen
- Bestehende Seiten/URLs automatisch erkennen (für Keyword-Coverage)
- Bilder direkt in die WordPress-Mediathek hochladen

### Webflow verbinden

1. Gehe zu https://webflow.com/dashboard → **Integrations**
2. Erstelle einen **API Token** mit CMS-Zugriffsrechten
3. In SEOPilot: **Einstellungen → Webflow**
   - Site ID: (findest du in Webflow unter Projekt-Settings)
   - API Key: dein Token
4. Klicke **Verbinden**

---

## 10. Monitoring & Wartung

### Automatische Updates

```bash
# Update-Script erstellen
nano /home/seopilot/update.sh
```

```bash
#!/bin/bash
cd /home/seopilot/seopilot
git pull origin main
docker compose up -d --build
echo "Update completed at $(date)" >> /var/log/seopilot-updates.log
```

```bash
chmod +x /home/seopilot/update.sh
```

### Backups einrichten

```bash
# Backup-Script
nano /home/seopilot/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/seopilot/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Datenbank sichern
docker cp seopilot-app:/app/prisma/prod.db $BACKUP_DIR/db_$DATE.db

# Uploads sichern
docker cp seopilot-app:/app/public/uploads $BACKUP_DIR/uploads_$DATE

# n8n Workflows sichern
docker cp seopilot-n8n:/home/node/.n8n $BACKUP_DIR/n8n_$DATE

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE" >> /var/log/seopilot-backups.log
```

```bash
chmod +x /home/seopilot/backup.sh

# Tägliches Backup per Cron
crontab -e
# Füge hinzu:
# 0 3 * * * /home/seopilot/backup.sh
```

### Server-Monitoring

```bash
# Ressourcen prüfen
htop

# Docker Container Status
docker compose ps

# Logs ansehen
docker compose logs -f --tail=100 seopilot
docker compose logs -f --tail=100 n8n

# Disk Space prüfen
df -h
```

### Häufige Probleme & Lösungen

| Problem | Lösung |
|---|---|
| App startet nicht | `docker compose logs seopilot` prüfen |
| SSL-Zertifikat abgelaufen | `certbot renew` ausführen |
| Datenbank voll | Alte Performance-Daten bereinigen |
| n8n Workflows stoppen | n8n Container neu starten: `docker compose restart n8n` |
| Langsame Performance | Server upgraden auf CPX31 (4 vCPU, 8 GB RAM) |

---

## Kosten-Übersicht

| Dienst | Kosten/Monat |
|---|---|
| Hetzner Server (CPX21) | ~8€ |
| Domain | ~1€ |
| Anthropic Claude API | ~5-20€ (je nach Nutzung) |
| DataForSEO | ~10-50€ (je nach Abfragen) |
| SSL (Let's Encrypt) | Kostenlos |
| n8n (Self-hosted) | Kostenlos |
| **Gesamt** | **~25-80€/Monat** |

---

## Erste Schritte nach dem Deployment

1. **Admin-Account erstellen**: Öffne `https://seopilot.meine-agentur.de/login` und registriere dich
2. **API-Keys eintragen**: Gehe zu Einstellungen → API-Verbindungen
3. **Ersten Kunden anlegen**: Dashboard → Neuen Kunden anlegen
4. **Keyword-Map erstellen**: Keywords → Neue Keyword-Map
5. **n8n Workflows aktivieren**: n8n Dashboard → Workflows aktivieren
6. **Team einladen**: Einstellungen → Nutzerverwaltung → Neuen Nutzer anlegen

Viel Erfolg mit SEOPilot! Bei Fragen gerne melden.
