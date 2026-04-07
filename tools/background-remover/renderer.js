const { ipcRenderer } = require("electron");

const btnOpen = document.getElementById("btn-open");
const btnRemove = document.getElementById("btn-remove");
const btnSave = document.getElementById("btn-save");
const statusEl = document.getElementById("status");
const progressBar = document.getElementById("progress-bar");
const originalContainer = document.getElementById("original-container");
const resultContainer = document.getElementById("result-container");
const dropOverlay = document.getElementById("drop-overlay");

let currentFile = null;
let resultDataUrl = null;

// --- Open file ---
btnOpen.addEventListener("click", async () => {
  const file = await ipcRenderer.invoke("open-file");
  if (file) loadImage(file);
});

function loadImage(file) {
  currentFile = file;
  resultDataUrl = null;
  btnRemove.disabled = false;
  btnSave.disabled = true;

  originalContainer.innerHTML = `<img src="${file.dataUrl}" alt="Original">`;
  resultContainer.innerHTML = `<div class="placeholder"><div class="icon">&#10024;</div>Ergebnis erscheint hier</div>`;
  resultContainer.classList.remove("has-result");

  statusEl.textContent = `Geladen: ${file.name}`;
}

// --- Remove background ---
btnRemove.addEventListener("click", async () => {
  if (!currentFile) return;

  btnRemove.disabled = true;
  btnSave.disabled = true;
  btnOpen.disabled = true;
  statusEl.textContent = "Hintergrund wird entfernt... bitte warten (kann beim ersten Mal laenger dauern).";
  progressBar.classList.add("indeterminate");

  try {
    resultDataUrl = await ipcRenderer.invoke(
      "remove-background",
      currentFile.dataUrl,
      currentFile.mimeType
    );

    resultContainer.innerHTML = `<img src="${resultDataUrl}" alt="Ergebnis">`;
    resultContainer.classList.add("has-result");

    btnSave.disabled = false;
    statusEl.textContent = "Fertig! Ergebnis kann gespeichert werden.";
  } catch (err) {
    statusEl.textContent = "Fehler bei der Verarbeitung.";
    console.error("Background removal error:", err);
    alert(`Hintergrundentfernung fehlgeschlagen:\n${err.message || err}`);
  } finally {
    btnRemove.disabled = false;
    btnOpen.disabled = false;
    progressBar.classList.remove("indeterminate");
  }
});

// --- Save ---
btnSave.addEventListener("click", async () => {
  if (!resultDataUrl) return;

  const baseName = currentFile.name.replace(/\.[^.]+$/, "");
  const defaultName = `${baseName}_freigestellt.png`;

  const savedPath = await ipcRenderer.invoke("save-file", {
    dataUrl: resultDataUrl,
    defaultName,
  });

  if (savedPath) {
    statusEl.textContent = `Gespeichert: ${savedPath}`;
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
    loadImage({
      path: file.path,
      name: file.name,
      dataUrl: reader.result,
      mimeType: file.type || "image/png",
    });
  };
  reader.readAsDataURL(file);
});
