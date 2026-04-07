const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

function getResourcesPath() {
  // In packaged app, node_modules is inside app.asar
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "app.asar.unpacked", "node_modules", "@imgly", "background-removal-node", "dist");
  }
  return path.join(__dirname, "node_modules", "@imgly", "background-removal-node", "dist");
}

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
    mimeType: mime,
  };
});

// Remove background in main process
ipcMain.handle("remove-background", async (_event, base64Data, mimeType) => {
  const { removeBackground } = await import("@imgly/background-removal-node");

  // Convert base64 to buffer
  const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, "");
  const inputBuffer = Buffer.from(base64Clean, "base64");

  // Create a Blob from the buffer
  const inputBlob = new Blob([inputBuffer], { type: mimeType || "image/png" });

  const resultBlob = await removeBackground(inputBlob, {
    output: { format: "image/png", quality: 1 },
    publicPath: getResourcesPath() + "/",
  });

  const arrayBuffer = await resultBlob.arrayBuffer();
  const resultBase64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:image/png;base64,${resultBase64}`;
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

  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync(result.filePath, Buffer.from(base64, "base64"));
  return result.filePath;
});
