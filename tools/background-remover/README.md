# Background Remover Tool

Ein Windows-Desktop-Tool zum Entfernen von Bildhintergruenden mit KI (U2Net).

## Installation

```bash
# Python 3.9+ erforderlich
pip install -r requirements.txt
```

## Verwendung

```bash
python background_remover.py
```

1. **Bild oeffnen** - PNG, JPG, BMP oder WebP auswaehlen
2. **Modell waehlen** (optional):
   - `u2net` - Standard, gute Qualitaet (Standard)
   - `u2net_human_seg` - Optimiert fuer Personen
   - `isnet-general-use` - Neueres Modell, oft bessere Ergebnisse
   - `silueta` - Schneller, kleineres Modell
3. **Hintergrund entfernen** klicken
4. **Speichern unter** - Ergebnis als PNG mit Transparenz speichern

## Modelle

| Modell | Beschreibung |
|---|---|
| `u2net` | Standard-Modell, gute Allround-Qualitaet |
| `u2netp` | Leichtgewicht-Version von u2net |
| `u2net_human_seg` | Speziell fuer Personen optimiert |
| `isnet-general-use` | Neueres Modell, haeufig bessere Kanten |
| `isnet-anime` | Optimiert fuer Anime/Illustrationen |
| `silueta` | Kompaktes, schnelles Modell |

## Hinweise

- Beim ersten Start wird das gewaehlte Modell heruntergeladen (~170 MB fuer u2net)
- Die Verarbeitung laeuft komplett lokal - keine Daten werden hochgeladen
- Ausgabe ist immer PNG mit transparentem Hintergrund
