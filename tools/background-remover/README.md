# Background Remover

Ein Windows-Desktop-Tool zum Entfernen von Bildhintergruenden mit KI.

## Windows Installer bauen

Voraussetzung: [Node.js](https://nodejs.org/) installieren (einmalig).

```
build.bat
```

Das erzeugt eine Setup-`.exe` im `dist`-Ordner. Diese installierst du wie jedes
andere Windows-Programm - danach brauchst du weder Node.js noch sonst etwas.

Alternativ portable `.exe` (ohne Installation):

```
npm install
npm run build:portable
```

## Verwendung

1. **Bild oeffnen** oder per **Drag & Drop** ablegen
2. **Hintergrund entfernen** klicken
3. **Speichern unter** - Ergebnis als PNG mit Transparenz speichern

## Features

- KI-basierte Hintergrundentfernung (laeuft komplett lokal)
- Drag & Drop Support
- Vorschau: Original und Ergebnis nebeneinander
- Export als PNG mit transparentem Hintergrund
- Keine Daten werden hochgeladen, alles offline
- Kein Python noetig
