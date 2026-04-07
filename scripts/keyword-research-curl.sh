#!/bin/bash
# DataForSEO Keyword Research for apv messtecc
# Uses curl with HTTP/1.1 to avoid sandbox HTTP/2 issues

AUTH="Y2FybG9zQGNhc29hLmRlOjJhMWRlMjU4M2YwNzFlMTU="
API="https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live"
OUTDIR="/home/user/claude-seo/scripts/results"
mkdir -p "$OUTDIR"

fetch_keywords() {
  local name="$1"
  local keywords="$2"
  local outfile="$OUTDIR/${name}.json"

  echo "Fetching: $name ..."
  curl -s --http1.1 -m 60 -X POST "$API" \
    -H "Authorization: Basic $AUTH" \
    -H "Content-Type: application/json" \
    -d "[{\"keywords\":$keywords,\"language_name\":\"German\",\"location_code\":2276}]" \
    > "$outfile" 2>&1
  echo "  -> saved to $outfile"
  sleep 1
}

# Cluster 1: Heizkostenabrechnung allgemein
fetch_keywords "01_heizkostenabrechnung" '["heizkostenabrechnung","nebenkostenabrechnung","heizkostenabrechnung erstellen","heizkostenabrechnung erstellen lassen","heizkostenabrechnung dienstleister","heizkostenabrechnung service","heizkostenabrechnung anbieter","heizkostenabrechnung firma","betriebskostenabrechnung","betriebskostenabrechnung erstellen","nebenkostenabrechnung erstellen lassen","heizkostenabrechnung kosten","heizkostenabrechnung preis","heizkostenverordnung","heizkosten abrechnen","heizkostenabrechnung vermieter","heizkostenabrechnung mietwohnung","warmwasserabrechnung","heizkosten verbrauchsabhängig","heizkostenabrechnung unternehmen"]'

# Cluster 2: Messdienst allgemein
fetch_keywords "02_messdienst" '["messdienst","messdienstleister","messtechnik","messservice","messdienst heizkosten","messdienst heizkostenabrechnung","abrechnungsdienst heizkosten","abrechnungsservice","energieservice","submetering","messdienstleister vergleich","messdienstleister kosten"]'

# Cluster 3: Messtechnik Produkte
fetch_keywords "03_messtechnik" '["heizkostenverteiler","wasserzähler","wärmemengenzähler","rauchwarnmelder","rauchmelder pflicht","rauchmelder wartung","wasserzähler einbauen","wasserzähler ablesen","wasserzähler austauschen","wasserzähler eichung","wärmezähler","heizkostenverteiler ablesen","heizkostenverteiler funktion","funk heizkostenverteiler","funkablesung","fernablesung heizkosten","smart metering","rauchwarnmelder wartung","rauchwarnmelder pflicht bayern"]'

# Cluster 4: Lokal München
fetch_keywords "04_muenchen" '["messdienst münchen","heizkostenabrechnung münchen","messdienstleister münchen","nebenkostenabrechnung münchen","heizkosten abrechnung münchen","wasserzähler münchen","rauchwarnmelder münchen","messtechnik münchen","heizkostenverteiler münchen","energieservice münchen","betriebskostenabrechnung münchen","messdienst bayern","heizkostenabrechnung bayern","messdienst süddeutschland","messdienstleister bayern","messdienst oberbayern","heizkostenabrechnung stuttgart","messdienst stuttgart"]'

# Cluster 5: Hausverwaltung
fetch_keywords "05_hausverwaltung" '["heizkostenabrechnung hausverwaltung","messdienst hausverwaltung","nebenkostenabrechnung hausverwaltung","hausverwaltung heizkostenabrechnung","weg verwaltung heizkostenabrechnung","weg abrechnung","hausverwaltung messdienst","hausverwaltung nebenkostenabrechnung","mietverwaltung heizkostenabrechnung","hausverwaltung abrechnung","betriebskostenabrechnung hausverwaltung","weg verwalter abrechnung"]'

# Cluster 6: Eigentümer
fetch_keywords "06_eigentuemer" '["heizkostenabrechnung eigentümer","heizkostenabrechnung mehrfamilienhaus","nebenkostenabrechnung mehrfamilienhaus","heizkostenabrechnung vermieter pflicht","heizkosten abrechnen vermieter","betriebskosten abrechnen vermieter","nebenkostenabrechnung vermieter","nebenkostenabrechnung erstellen vermieter","heizkostenabrechnung eigentumswohnung","heizkostenabrechnung wohnungseigentümer","heizkosten mehrfamilienhaus"]'

# Cluster 7: Bauträger
fetch_keywords "07_bautraeger" '["messtechnik neubau","heizkostenverteiler neubau","messkonzept neubau","erstausstattung messtechnik","wasserzähler neubau","rauchwarnmelder neubau","bauträger messtechnik","neubau heizkostenabrechnung","erstausstattung heizkostenverteiler","messtechnik erstinstallation"]'

# Cluster 8: Wechsel / Unzufriedenheit
fetch_keywords "08_wechsel" '["messdienst wechseln","heizkostenabrechnung anbieter wechseln","messdienstleister wechseln","techem alternative","ista alternative","brunata alternative","minol alternative","messdienst kündigen","heizkostenabrechnung fehler","heizkostenabrechnung fehlerhaft","heizkostenabrechnung prüfen","heizkostenabrechnung zu hoch","nebenkostenabrechnung zu hoch","heizkosten zu hoch","messdienst unzufrieden","messdienst kosten zu hoch","messdienst vergleich","heizkostenabrechnung reklamation","heizkostenabrechnung widerspruch","messdienst beschwerde"]'

echo ""
echo "=== Alle Abfragen abgeschlossen ==="
