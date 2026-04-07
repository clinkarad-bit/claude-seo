const { app, BrowserWindow, ipcMain, dialog, session } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

function createWindow() {
  // Enable SharedArrayBuffer for ONNX runtime (COOP/COEP headers)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Cross-Origin-Opener-Policy": ["same-origin"],
        "Cross-Origin-Embedder-Policy": ["require-corp"],
      },
    });
  });

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

// Open file dialog - returns file info with base64 data
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
    mimeType: mime,
  };
});

// Save file
ipcMain.handle("save-file", async (_event, { dataUrl, defaultName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Ergebnis speichern",
    defaultPath: defaultName,
    filters: [
      { name: "PNG (transparent)", extensions: ["png"] },
      { name: "Alle Dateien", extensions: ["*"] },
    ],
  });

  if (result.canceled) return null;

  // Convert data URL to buffer
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync(result.filePath, Buffer.from(base64, "base64"));
  return result.filePath;
});
