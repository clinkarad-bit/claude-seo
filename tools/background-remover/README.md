# Background Remover Tool

Ein Windows-Desktop-Tool zum Entfernen von Bildhintergruenden mit KI (U2Net).

## Standalone .exe bauen (kein Python noetig zum Ausfuehren!)

Du brauchst Python nur **einmalig zum Bauen**. Danach laeuft die .exe ohne Python.

### Option A: Ordner-Build (empfohlen, schnellerer Start)

```
build.bat
```

Ergebnis: `dist\BackgroundRemover\BackgroundRemover.exe`
Den ganzen Ordner `dist\BackgroundRemover` auf jeden PC kopieren und starten.

### Option B: Einzelne .exe (einfacher zu verteilen)

```
build_onefile.bat
```

Ergebnis: `dist\BackgroundRemover.exe` (ca. 200-300 MB)
Eine einzige Datei, auf jeden PC kopieren und starten.

### Voraussetzungen zum Bauen

- Windows 10/11
- Python 3.9+ installiert ([python.org/downloads](https://www.python.org/downloads/))
- Bei der Python-Installation **"Add Python to PATH"** ankreuzen

## Verwendung

1. **Bild oeffnen** - PNG, JPG, BMP oder WebP auswaehlen
2. **Modell waehlen** (optional):
   - `u2net` - Standard, gute Qualitaet
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

- Beim ersten Build wird das AI-Modell heruntergeladen (~170 MB)
- Die Verarbeitung laeuft komplett lokal - keine Daten werden hochgeladen
- Ausgabe ist immer PNG mit transparentem Hintergrund
- Die fertige .exe braucht kein Python, kein Internet, keine Installation
