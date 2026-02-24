const STORAGE_KEY = "equipment-hours-entries-v1";

const form = document.getElementById("entry-form");
const entriesContainer = document.getElementById("entries");
const emptyMessage = document.getElementById("empty-message");
const template = document.getElementById("entry-template");
const downloadCsvButton = document.getElementById("download-csv");
const downloadJsonButton = document.getElementById("download-json");
const clearAllButton = document.getElementById("clear-all");

const initialDate = new Date().toISOString().split("T")[0];
document.getElementById("entry-date").value = initialDate;

let entries = loadEntries();
renderEntries();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const photoFile = formData.get("photo");

  const entry = {
    id: crypto.randomUUID(),
    unitNumber: formData.get("unitNumber")?.toString().trim(),
    assetName: formData.get("assetName")?.toString().trim(),
    meterHours: Number(formData.get("meterHours")),
    entryDate: formData.get("entryDate"),
    notes: formData.get("notes")?.toString().trim() || "-",
    photoDataUrl: photoFile instanceof File && photoFile.size > 0
      ? await fileToDataURL(photoFile)
      : "",
  };

  entries.unshift(entry);
  saveEntries();
  renderEntries();

  form.reset();
  document.getElementById("entry-date").value = initialDate;
});

downloadCsvButton.addEventListener("click", () => {
  if (entries.length === 0) return;

  const header = ["Unit Number", "Asset Name", "Meter Hours", "Date", "Notes"];
  const rows = entries.map((entry) => [
    entry.unitNumber,
    entry.assetName,
    entry.meterHours,
    entry.entryDate,
    entry.notes.replaceAll('"', '""'),
  ]);

  const csvString = [header, ...rows]
    .map((row) => row.map((value) => `"${value}"`).join(","))
    .join("\n");

  downloadFile(csvString, "equipment-hours-datasheet.csv", "text/csv;charset=utf-8;");
});

downloadJsonButton.addEventListener("click", () => {
  if (entries.length === 0) return;
  const content = JSON.stringify(entries, null, 2);
  downloadFile(content, "equipment-hours-data.json", "application/json;charset=utf-8;");
});

clearAllButton.addEventListener("click", () => {
  if (!confirm("Delete all saved entries?")) return;
  entries = [];
  saveEntries();
  renderEntries();
});

function renderEntries() {
  entriesContainer.innerHTML = "";
  emptyMessage.hidden = entries.length > 0;

  for (const entry of entries) {
    const node = template.content.cloneNode(true);

    node.querySelector(".entry-title").textContent = entry.assetName;
    node.querySelector(".entry-date").textContent = formatDate(entry.entryDate);
    node.querySelector(".entry-unit").textContent = entry.unitNumber;
    node.querySelector(".entry-hours").textContent = `${entry.meterHours.toFixed(1)} h`;
    node.querySelector(".entry-notes").textContent = entry.notes;

    const photo = node.querySelector(".entry-photo");
    if (entry.photoDataUrl) {
      photo.src = entry.photoDataUrl;
      photo.hidden = false;
    } else {
      photo.hidden = true;
    }

    node.querySelector(".remove").addEventListener("click", () => {
      entries = entries.filter((item) => item.id !== entry.id);
      saveEntries();
      renderEntries();
    });

    entriesContainer.appendChild(node);
  }
}

function loadEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString();
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
