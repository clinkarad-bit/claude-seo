const { ipcRenderer } = require("electron");

const btnOpen = document.getElementById("btn-open");
const btnRemove = document.getElementById("btn-remove");
const btnSave = document.getElementById("btn-save");
const status = document.getElementById("status");
const progressBar = document.getElementById("progress-bar");
const originalContainer = document.getElementById("original-container");
const resultContainer = document.getElementById("result-container");
const dropOverlay = document.getElementById("drop-overlay");

let currentFile = null;
let resultBuffer = null;

// --- Open file ---
btnOpen.addEventListener("click", async () => {
  const file = await ipcRenderer.invoke("open-file");
  if (file) loadImage(file);
});

function loadImage(file) {
  currentFile = file;
  resultBuffer = null;
  btnRemove.disabled = false;
  btnSave.disabled = true;

  originalContainer.innerHTML = `<img src="${file.dataUrl}" alt="Original">`;
  resultContainer.innerHTML = `<div class="placeholder"><div class="icon">&#10024;</div>Ergebnis erscheint hier</div>`;
  resultContainer.classList.remove("has-result");

  status.textContent = `Geladen: ${file.name}`;
}

// --- Remove background ---
btnRemove.addEventListener("click", async () => {
  if (!currentFile) return;

  btnRemove.disabled = true;
  btnSave.disabled = true;
  btnOpen.disabled = true;
  status.textContent = "Hintergrund wird entfernt... bitte warten (kann beim ersten Mal laenger dauern).";
  progressBar.classList.add("indeterminate");

  try {
    const result = await ipcRenderer.invoke("remove-background", currentFile.buffer);
    resultBuffer = result;

    const blob = new Blob([new Uint8Array(result)], { type: "image/png" });
    const url = URL.createObjectURL(blob);

    resultContainer.innerHTML = `<img src="${url}" alt="Ergebnis">`;
    resultContainer.classList.add("has-result");

    btnSave.disabled = false;
    status.textContent = "Fertig! Ergebnis kann gespeichert werden.";
  } catch (err) {
    status.textContent = "Fehler bei der Verarbeitung.";
    alert(`Hintergrundentfernung fehlgeschlagen:\n${err.message || err}`);
  } finally {
    btnRemove.disabled = false;
    btnOpen.disabled = false;
    progressBar.classList.remove("indeterminate");
  }
});

// --- Save ---
btnSave.addEventListener("click", async () => {
  if (!resultBuffer) return;

  const baseName = currentFile.name.replace(/\.[^.]+$/, "");
  const defaultName = `${baseName}_freigestellt.png`;

  const savedPath = await ipcRenderer.invoke("save-file", {
    buffer: resultBuffer,
    defaultName,
  });

  if (savedPath) {
    status.textContent = `Gespeichert: ${savedPath}`;
  }
});

// --- Drag & Drop ---
document.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropOverlay.classList.add("visible");
});

document.addEventListener("dragleave", (e) => {
  if (e.relatedTarget === null) {
    dropOverlay.classList.remove("visible");
  }
});

document.addEventListener("drop", async (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropOverlay.classList.remove("visible");

  const files = e.dataTransfer.files;
  if (files.length === 0) return;

  const file = files[0];
  const validExts = [".png", ".jpg", ".jpeg", ".bmp", ".webp"];
  const ext = file.name.toLowerCase().replace(/.*(\.[^.]+)$/, "$1");

  if (!validExts.includes(ext)) {
    alert("Nicht unterstuetztes Format. Bitte PNG, JPG, BMP oder WebP verwenden.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const arrayBuffer = reader.result;
    const uint8 = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...uint8));
    const mimeTypes = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".bmp": "image/bmp",
      ".webp": "image/webp",
    };
    const mime = mimeTypes[ext] || "image/png";

    loadImage({
      path: file.path,
      name: file.name,
      dataUrl: `data:${mime};base64,${base64}`,
      buffer: Array.from(uint8),
    });
  };
  reader.readAsArrayBuffer(file);
});
