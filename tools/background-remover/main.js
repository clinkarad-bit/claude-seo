const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 500,
    title: "Background Remover",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

// Open file dialog
ipcMain.handle("open-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Bild auswaehlen",
    filters: [
      { name: "Bilder", extensions: ["png", "jpg", "jpeg", "bmp", "webp"] },
      { name: "Alle Dateien", extensions: ["*"] },
    ],
    properties: ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const filePath = result.filePaths[0];
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".bmp": "image/bmp",
    ".webp": "image/webp",
  };
  const mime = mimeTypes[ext] || "image/png";
  const base64 = buffer.toString("base64");

  return {
    path: filePath,
    name: path.basename(filePath),
    dataUrl: `data:${mime};base64,${base64}`,
    buffer: Array.from(buffer),
  };
});

// Remove background
ipcMain.handle("remove-background", async (_event, imageBuffer) => {
  const { removeBackground } = await import("@imgly/background-removal-node");

  const input = new Uint8Array(imageBuffer);
  const blob = await removeBackground(input, {
    output: { format: "image/png", quality: 1 },
  });

  const arrayBuffer = await blob.arrayBuffer();
  return Array.from(new Uint8Array(arrayBuffer));
});

// Save file dialog
ipcMain.handle("save-file", async (_event, { buffer, defaultName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Ergebnis speichern",
    defaultPath: defaultName,
    filters: [
      { name: "PNG (transparent)", extensions: ["png"] },
      { name: "Alle Dateien", extensions: ["*"] },
    ],
  });

  if (result.canceled) return null;

  fs.writeFileSync(result.filePath, Buffer.from(buffer));
  return result.filePath;
});
