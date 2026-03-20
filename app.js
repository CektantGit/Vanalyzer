const API_URL = "https://api.vizbl.us/obj/GetPublic";
const METRICS = ["views", "likes", "viewsShowcase"];
const METRIC_LABELS = {
  views: "views",
  likes: "likes",
  viewsShowcase: "viewsShowcase"
};

let currentBundle = null;
let currentDisplayObjects = [];
let currentRenderedObjects = [];
let chartInstance = null;
let trendChartInstance = null;
let rankingChartInstance = null;
let mixChartInstance = null;
let currentChartEntry = null;
let chartMode = "days";
let currentDeltaFilter = "off";
let currentSort = "metric_desc";
let currentMetric = "views";

const els = {
  statTotal: document.getElementById("statTotal"),
  statVisible: document.getElementById("statVisible"),
  statVisibleSub: document.getElementById("statVisibleSub"),
  statMetricTotal: document.getElementById("statMetricTotal"),
  statAverage: document.getElementById("statAverage"),
  statMedian: document.getElementById("statMedian"),
  statUpdated: document.getElementById("statUpdated"),
  metricTotalTitle: document.getElementById("metricTotalTitle"),
  metricTotalSub: document.getElementById("metricTotalSub"),

  insightLastUpdate: document.getElementById("insightLastUpdate"),
  insightDay: document.getElementById("insightDay"),
  insightWeek: document.getElementById("insightWeek"),
  insightMonth: document.getElementById("insightMonth"),
  insightList: document.getElementById("insightList"),
  benchmarkList: document.getElementById("benchmarkList"),
  topList: document.getElementById("topList"),

  trendSummary: document.getElementById("trendSummary"),
  rankingSummary: document.getElementById("rankingSummary"),
  resultsSummary: document.getElementById("resultsSummary"),
  boardSub: document.getElementById("boardSub"),
  boardViewsDelta: document.getElementById("boardViewsDelta"),
  boardLikesDelta: document.getElementById("boardLikesDelta"),
  boardShowcaseDelta: document.getElementById("boardShowcaseDelta"),
  boardViewsHint: document.getElementById("boardViewsHint"),
  boardLikesHint: document.getElementById("boardLikesHint"),
  boardShowcaseHint: document.getElementById("boardShowcaseHint"),

  totalMetricChartBtn: document.getElementById("totalMetricChartBtn"),
  fileChip: document.getElementById("fileChip"),
  modeChip: document.getElementById("modeChip"),
  metricChip: document.getElementById("metricChip"),
  filterChip: document.getElementById("filterChip"),
  status: document.getElementById("status"),
  grid: document.getElementById("grid"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  metricSelect: document.getElementById("metricSelect"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  resetBtn: document.getElementById("resetBtn"),

  minViewsInput: document.getElementById("minViewsInput"),
  minLikesInput: document.getElementById("minLikesInput"),
  minShowcaseInput: document.getElementById("minShowcaseInput"),
  minMetricInput: document.getElementById("minMetricInput"),
  maxMetricInput: document.getElementById("maxMetricInput"),
  removedSelect: document.getElementById("removedSelect"),

  fileInput: document.getElementById("fileInput"),
  downloadBtn: document.getElementById("downloadBtn"),
  openBtn: document.getElementById("openBtn"),
  updateBtn: document.getElementById("updateBtn"),

  loader: document.getElementById("loader"),
  loaderTitle: document.getElementById("loaderTitle"),
  loaderText: document.getElementById("loaderText"),
  loaderBar: document.getElementById("loaderBar"),
  loaderStep: document.getElementById("loaderStep"),
  loaderPercent: document.getElementById("loaderPercent"),

  chartModal: document.getElementById("chartModal"),
  modalTitle: document.getElementById("modalTitle"),
  modalSub: document.getElementById("modalSub"),
  chartMeta: document.getElementById("chartMeta"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  daysBtn: document.getElementById("daysBtn"),
  monthsBtn: document.getElementById("monthsBtn"),
  boardModal: document.getElementById("boardModal"),
  openBoardBtn: document.getElementById("openBoardBtn"),
  closeBoardBtn: document.getElementById("closeBoardBtn"),

  trendCanvas: document.getElementById("trendCanvas"),
  rankingCanvas: document.getElementById("rankingCanvas"),
  mixCanvas: document.getElementById("mixCanvas"),

  filterDeltaBadge: document.getElementById("filterDeltaBadge"),
  filterButtons: Array.from(document.querySelectorAll(".filter-btn")),
  metricButtons: Array.from(document.querySelectorAll(".metric-btn"))
};

els.downloadBtn.addEventListener("click", downloadFreshBundle);
els.openBtn.addEventListener("click", () => els.fileInput.click());
els.updateBtn.addEventListener("click", updateOpenedBundle);
els.fileInput.addEventListener("change", handleFileOpen);
els.searchInput.addEventListener("input", renderAll);

[els.minViewsInput, els.minLikesInput, els.minShowcaseInput, els.minMetricInput, els.maxMetricInput].forEach((input) => {
  input.addEventListener("input", renderAll);
});

els.removedSelect.addEventListener("change", renderAll);

els.sortSelect.addEventListener("change", () => {
  currentSort = els.sortSelect.value;
  renderAll();
});

els.metricSelect.addEventListener("change", () => {
  setMetric(els.metricSelect.value);
});

els.exportCsvBtn.addEventListener("click", exportCurrentCsv);
els.resetBtn.addEventListener("click", resetUi);
els.totalMetricChartBtn.addEventListener("click", openTotalMetricChart);
els.closeModalBtn.addEventListener("click", closeChartModal);
els.openBoardBtn.addEventListener("click", openBoardModal);
els.closeBoardBtn.addEventListener("click", closeBoardModal);

els.chartModal.addEventListener("click", (e) => {
  if (e.target === els.chartModal) closeChartModal();
});

els.boardModal.addEventListener("click", (e) => {
  if (e.target === els.boardModal) closeBoardModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeChartModal();
  if (e.key === "Escape") closeBoardModal();
});

els.daysBtn.addEventListener("click", () => {
  chartMode = "days";
  updateChartModeButtons();
  if (currentChartEntry) drawChart(currentChartEntry);
});

els.monthsBtn.addEventListener("click", () => {
  chartMode = "months";
  updateChartModeButtons();
  if (currentChartEntry) drawChart(currentChartEntry);
});

els.filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentDeltaFilter = btn.dataset.filter;
    updateFilterButtons();
    renderAll();
  });
});

els.metricButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setMetric(btn.dataset.metric);
  });
});

function setStatus(text) {
  els.status.textContent = text;
}

function setMode(text) {
  const value = `Session: ${text}`;
  els.modeChip.textContent = value;
  els.modeChip.title = value;
}

function syncModalOpenState() {
  const hasOpenModal = !els.chartModal.classList.contains("hidden") || !els.boardModal.classList.contains("hidden");
  document.body.classList.toggle("modal-open", hasOpenModal);
}

function setFileChip(text) {
  els.fileChip.textContent = text;
  els.fileChip.title = text;
}

function setFilterChip(text) {
  els.filterChip.textContent = text;
  els.filterChip.title = text;
}

function setMetricChip() {
  const value = `Metric: ${METRIC_LABELS[currentMetric]}`;
  els.metricChip.textContent = value;
  els.metricChip.title = value;
}

function getFilterName(filter) {
  const map = {
    off: "all objects",
    last_update: "growth since last update",
    day: "growth in the last 24 hours",
    week: "growth in the last 7 days",
    month: "growth in the last 30 days"
  };
  return map[filter] || map.off;
}

function getActiveGrowthFilter() {
  return currentDeltaFilter === "off" ? "last_update" : currentDeltaFilter;
}

function updateFilterButtons() {
  els.filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === currentDeltaFilter);
  });
  setFilterChip(`Filter: ${getFilterName(currentDeltaFilter)}`);
}

function updateMetricButtons() {
  els.metricButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.metric === currentMetric);
  });
  els.metricSelect.value = currentMetric;
  setMetricChip();
}

function setMetric(metric) {
  if (!METRICS.includes(metric)) return;
  currentMetric = metric;
  updateMetricButtons();
  renderAll();
}

function formatNum(n) {
  return Number(n || 0).toLocaleString("ru-RU");
}

function formatSignedNum(n) {
  const value = Number(n || 0);
  if (value > 0) return `+${formatNum(value)}`;
  if (value < 0) return `-${formatNum(Math.abs(value))}`;
  return "0";
}

function formatDecimal(n, digits = 1) {
  return Number(n || 0).toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  });
}

function formatDateTimeForFile(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}_${p(date.getHours())}-${p(date.getMinutes())}-${p(date.getSeconds())}`;
}

function formatHumanDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(+d)) return "—";
  return d.toLocaleString("ru-RU");
}

function nowIso() {
  return new Date().toISOString();
}

function showLoader(title, text, percent = 0, step = "") {
  els.loaderTitle.textContent = title;
  els.loaderText.textContent = text;
  els.loaderBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  els.loaderPercent.textContent = `${Math.round(percent)}%`;
  els.loaderStep.textContent = step || "";
  els.loader.classList.remove("hidden");
}

function updateLoader(text, percent, step = "") {
  els.loaderText.textContent = text;
  els.loaderBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  els.loaderPercent.textContent = `${Math.round(percent)}%`;
  els.loaderStep.textContent = step || "";
}

function hideLoader() {
  els.loader.classList.add("hidden");
}

function downloadJson(data, filename) {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
    return true;
  } catch (e) {
    console.error("downloadJson failed", e);
    return false;
  }
}

function downloadText(text, filename, mime = "text/plain;charset=utf-8") {
  try {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
    return true;
  } catch (e) {
    console.error("downloadText failed", e);
    return false;
  }
}

function num(v) {
  return Number(v || 0);
}

function median(list) {
  if (!list.length) return 0;
  const sorted = [...list].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function getViews(obj) {
  return num(obj?.views || obj?.lastViews || 0);
}

function getLikes(obj) {
  return num(obj?.likes || obj?.lastLikes || 0);
}

function getViewsShowcase(obj) {
  return num(obj?.viewsShowcase || obj?.lastViewsShowcase || 0);
}

function getTinuuid(obj) {
  return obj?.tinuuid || obj?.tinUuid || obj?.tinUUID || obj?.uuid || obj?.id || "";
}

function getName(obj) {
  return obj?.name || obj?.title || "Untitled Object";
}

function getPreview(obj) {
  return obj?.mainPreview || obj?.preview || obj?.image || "";
}

function buildGoUrl(tinuuid) {
  if (!tinuuid) return null;
  return `https://go.vizbl.com/en/object/${encodeURIComponent(tinuuid)}`;
}

function buildViewerUrl(tinuuid) {
  if (!tinuuid) return null;
  return `https://viewer.vizbl.com/${encodeURIComponent(tinuuid)}`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function metricHistoryKey(metric) {
  if (metric === "views") return "history";
  if (metric === "likes") return "likesHistory";
  if (metric === "viewsShowcase") return "viewsShowcaseHistory";
  return "history";
}

function metricLastKey(metric) {
  if (metric === "views") return "lastViews";
  if (metric === "likes") return "lastLikes";
  if (metric === "viewsShowcase") return "lastViewsShowcase";
  return "lastViews";
}

function metricTotalHistoryKey(metric) {
  if (metric === "views") return "totalViewsHistory";
  if (metric === "likes") return "totalLikesHistory";
  if (metric === "viewsShowcase") return "totalViewsShowcaseHistory";
  return "totalViewsHistory";
}

function getItemMetricValue(item, metric = currentMetric) {
  return num(item?.[metricLastKey(metric)]);
}

function sortHistory(history) {
  return [...history].sort((a, b) => new Date(a.capturedAt) - new Date(b.capturedAt));
}

function getItemHistory(item, metric = currentMetric) {
  const key = metricHistoryKey(metric);
  const arr = Array.isArray(item?.[key]) ? item[key] : [];
  return sortHistory(arr);
}

function getBundleTotalHistory(bundle, metric = currentMetric) {
  const key = metricTotalHistoryKey(metric);
  return sortHistory(Array.isArray(bundle?.[key]) ? bundle[key] : []);
}

function ensureMetricFieldsForItem(item) {
  item.lastViews = num(item.lastViews);
  item.lastLikes = num(item.lastLikes);
  item.lastViewsShowcase = num(item.lastViewsShowcase);

  if (!Array.isArray(item.history)) item.history = [];
  if (!Array.isArray(item.likesHistory)) item.likesHistory = [];
  if (!Array.isArray(item.viewsShowcaseHistory)) item.viewsShowcaseHistory = [];

  return item;
}

function upgradeBundleSchema(bundle) {
  if (!bundle || typeof bundle !== "object") return bundle;

  if (!Array.isArray(bundle.objects)) bundle.objects = [];
  if (!Array.isArray(bundle.snapshots)) bundle.snapshots = [];
  if (!Array.isArray(bundle.totalViewsHistory)) bundle.totalViewsHistory = [];
  if (!Array.isArray(bundle.totalLikesHistory)) bundle.totalLikesHistory = [];
  if (!Array.isArray(bundle.totalViewsShowcaseHistory)) bundle.totalViewsShowcaseHistory = [];

  bundle.objects = bundle.objects.map((raw) => {
    const item = JSON.parse(JSON.stringify(raw));

    if (item.lastViews == null) item.lastViews = num(item.views || 0);
    if (item.lastLikes == null) item.lastLikes = num(item.likes || 0);
    if (item.lastViewsShowcase == null) item.lastViewsShowcase = num(item.viewsShowcase || 0);

    if (!Array.isArray(item.history)) {
      item.history = item.lastViews || item.createdAt || bundle.updatedAt
        ? [{ capturedAt: bundle.updatedAt || bundle.createdAt || nowIso(), views: num(item.lastViews) }]
        : [];
    }

    if (!Array.isArray(item.likesHistory)) {
      item.likesHistory = item.lastLikes || item.createdAt || bundle.updatedAt
        ? [{ capturedAt: bundle.updatedAt || bundle.createdAt || nowIso(), views: num(item.lastLikes) }]
        : [];
    }

    if (!Array.isArray(item.viewsShowcaseHistory)) {
      item.viewsShowcaseHistory = item.lastViewsShowcase || item.createdAt || bundle.updatedAt
        ? [{ capturedAt: bundle.updatedAt || bundle.createdAt || nowIso(), views: num(item.lastViewsShowcase) }]
        : [];
    }

    item.removed = Boolean(item.removed);
    return ensureMetricFieldsForItem(item);
  });

  return bundle;
}

function validateBundle(bundle) {
  if (!bundle || typeof bundle !== "object") throw new Error("JSON must be an object.");
  if (!Array.isArray(bundle.objects)) throw new Error("The JSON file must contain an objects array.");
  upgradeBundleSchema(bundle);
  return true;
}

async function fetchAllObjectsWithProgress(titleText = "Loading objects") {
  showLoader(titleText, "Connecting to API...", 2, "Step 1");
  let page = 1;
  let all = [];
  let pagesLoaded = 0;
  const hardLimit = 2000;

  while (page <= hardLimit) {
    updateLoader(`Loading page ${page}...`, Math.min(8 + pagesLoaded * 2, 80), `Page ${page}`);

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} on page ${page}`);

    const data = await res.json();
    const objs = Array.isArray(data?.objs) ? data.objs : [];
    if (!objs.length) break;

    all = all.concat(objs);
    page += 1;
    pagesLoaded += 1;
  }

  updateLoader(`Fetched ${all.length} objects. Preparing data...`, 88, "Building dataset");
  return all;
}

function normalizeApiObjects(rawObjects) {
  return rawObjects.map((obj) => ({
    tinuuid: getTinuuid(obj),
    name: getName(obj),
    mainPreview: getPreview(obj),
    lastViews: getViews(obj),
    lastLikes: getLikes(obj),
    lastViewsShowcase: getViewsShowcase(obj),
    removed: false,
    history: [],
    likesHistory: [],
    viewsShowcaseHistory: []
  })).filter((x) => x.tinuuid);
}

function createBundleFromFreshApi(rawObjects) {
  const capturedAt = nowIso();
  const normalized = normalizeApiObjects(rawObjects);

  normalized.forEach((item) => {
    item.history = [{ capturedAt, views: num(item.lastViews) }];
    item.likesHistory = [{ capturedAt, views: num(item.lastLikes) }];
    item.viewsShowcaseHistory = [{ capturedAt, views: num(item.lastViewsShowcase) }];
  });

  normalized.sort((a, b) => num(b.lastViews) - num(a.lastViews));

  const totalViews = normalized.filter((x) => num(x.lastViews) > 0).reduce((sum, x) => sum + num(x.lastViews), 0);
  const totalLikes = normalized.filter((x) => num(x.lastLikes) > 0).reduce((sum, x) => sum + num(x.lastLikes), 0);
  const totalViewsShowcase = normalized.filter((x) => num(x.lastViewsShowcase) > 0).reduce((sum, x) => sum + num(x.lastViewsShowcase), 0);

  return {
    version: 2,
    source: API_URL,
    createdAt: capturedAt,
    updatedAt: capturedAt,
    totalViewsHistory: [{ capturedAt, views: totalViews }],
    totalLikesHistory: [{ capturedAt, views: totalLikes }],
    totalViewsShowcaseHistory: [{ capturedAt, views: totalViewsShowcase }],
    snapshots: [{
      capturedAt,
      totalObjects: rawObjects.length,
      visibleObjectsViews: normalized.filter((x) => num(x.lastViews) > 0).length,
      visibleObjectsLikes: normalized.filter((x) => num(x.lastLikes) > 0).length,
      visibleObjectsViewsShowcase: normalized.filter((x) => num(x.lastViewsShowcase) > 0).length,
      totalViews,
      totalLikes,
      totalViewsShowcase
    }],
    objects: normalized
  };
}

function pushMetricPoint(historyArr, capturedAt, value) {
  if (!Array.isArray(historyArr)) historyArr = [];
  historyArr.push({ capturedAt, views: num(value) });
  return historyArr;
}

function mergeOpenedBundleWithFreshApi(bundle, rawObjects) {
  validateBundle(bundle);

  const capturedAt = nowIso();
  const freshNorm = normalizeApiObjects(rawObjects);
  const freshMap = new Map(freshNorm.map((x) => [x.tinuuid, x]));
  const bundleMap = new Map();

  bundle.objects.forEach((item) => {
    const cloned = ensureMetricFieldsForItem(JSON.parse(JSON.stringify(item)));
    if (cloned.tinuuid) bundleMap.set(cloned.tinuuid, cloned);
  });

  for (const [id, fresh] of freshMap.entries()) {
    if (!bundleMap.has(id)) {
      bundleMap.set(id, {
        tinuuid: fresh.tinuuid,
        name: fresh.name,
        mainPreview: fresh.mainPreview,
        lastViews: num(fresh.lastViews),
        lastLikes: num(fresh.lastLikes),
        lastViewsShowcase: num(fresh.lastViewsShowcase),
        removed: false,
        history: [{ capturedAt, views: num(fresh.lastViews) }],
        likesHistory: [{ capturedAt, views: num(fresh.lastLikes) }],
        viewsShowcaseHistory: [{ capturedAt, views: num(fresh.lastViewsShowcase) }]
      });
    } else {
      const existing = bundleMap.get(id);
      existing.name = fresh.name;
      existing.mainPreview = fresh.mainPreview;
      existing.lastViews = num(fresh.lastViews);
      existing.lastLikes = num(fresh.lastLikes);
      existing.lastViewsShowcase = num(fresh.lastViewsShowcase);
      existing.removed = false;
      existing.history = pushMetricPoint(existing.history, capturedAt, existing.lastViews);
      existing.likesHistory = pushMetricPoint(existing.likesHistory, capturedAt, existing.lastLikes);
      existing.viewsShowcaseHistory = pushMetricPoint(existing.viewsShowcaseHistory, capturedAt, existing.lastViewsShowcase);
    }
  }

  for (const [id, existing] of bundleMap.entries()) {
    if (!freshMap.has(id)) existing.removed = true;
  }

  const mergedObjects = Array.from(bundleMap.values())
    .map(ensureMetricFieldsForItem)
    .sort((a, b) => num(b.lastViews) - num(a.lastViews));

  const totalViews = mergedObjects.filter((x) => num(x.lastViews) > 0).reduce((sum, x) => sum + num(x.lastViews), 0);
  const totalLikes = mergedObjects.filter((x) => num(x.lastLikes) > 0).reduce((sum, x) => sum + num(x.lastLikes), 0);
  const totalViewsShowcase = mergedObjects.filter((x) => num(x.lastViewsShowcase) > 0).reduce((sum, x) => sum + num(x.lastViewsShowcase), 0);

  const updated = JSON.parse(JSON.stringify(bundle));
  updated.updatedAt = capturedAt;
  updated.snapshots = Array.isArray(updated.snapshots) ? updated.snapshots : [];
  updated.totalViewsHistory = Array.isArray(updated.totalViewsHistory) ? updated.totalViewsHistory : [];
  updated.totalLikesHistory = Array.isArray(updated.totalLikesHistory) ? updated.totalLikesHistory : [];
  updated.totalViewsShowcaseHistory = Array.isArray(updated.totalViewsShowcaseHistory) ? updated.totalViewsShowcaseHistory : [];

  updated.snapshots.push({
    capturedAt,
    totalObjects: rawObjects.length,
    visibleObjectsViews: mergedObjects.filter((x) => num(x.lastViews) > 0).length,
    visibleObjectsLikes: mergedObjects.filter((x) => num(x.lastLikes) > 0).length,
    visibleObjectsViewsShowcase: mergedObjects.filter((x) => num(x.lastViewsShowcase) > 0).length,
    totalViews,
    totalLikes,
    totalViewsShowcase
  });

  updated.totalViewsHistory.push({ capturedAt, views: totalViews });
  updated.totalLikesHistory.push({ capturedAt, views: totalLikes });
  updated.totalViewsShowcaseHistory.push({ capturedAt, views: totalViewsShowcase });
  updated.objects = mergedObjects;

  upgradeBundleSchema(updated);
  return updated;
}

async function downloadFreshBundle() {
  try {
    setMode("creating new JSON");
    const raw = await fetchAllObjectsWithProgress("Create new JSON");
    updateLoader("Building consolidated bundle.json...", 94, "Bundle assembly");

    const bundle = createBundleFromFreshApi(raw);
    currentBundle = bundle;

    updateLoader("Rendering objects...", 98, "Rendering");
    applyBundleToUI(bundle, `bundle_${formatDateTimeForFile()}.json`, "new JSON from API");

    const filename = `bundle_${formatDateTimeForFile()}.json`;
    if (!downloadJson(bundle, filename)) throw new Error("Failed to download JSON.");

    setStatus(`Done. Downloaded ${filename}. Objects visible for ${METRIC_LABELS[currentMetric]}: ${getVisibleObjects(bundle, currentMetric).length}.`);
  } catch (err) {
    console.error(err);
    setStatus(`Failed to create JSON: ${err.message}`);
    setMode("error");
  } finally {
    hideLoader();
  }
}

async function handleFileOpen(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    setMode("opening local JSON");
    showLoader("Open JSON", "Reading local file...", 18, "File read");
    const text = await file.text();
    updateLoader("Parsing JSON...", 45, "Parsing");

    const parsed = JSON.parse(text);
    validateBundle(parsed);

    updateLoader("Preparing interface...", 82, "Rendering");
    currentBundle = parsed;
    applyBundleToUI(parsed, file.name, "local JSON opened");
    els.updateBtn.disabled = false;
    setStatus(`Opened file: ${file.name}.`);
  } catch (err) {
    console.error(err);
    setStatus(`Failed to open JSON: ${err.message}`);
    setMode("error");
  } finally {
    hideLoader();
    e.target.value = "";
  }
}

async function updateOpenedBundle() {
  if (!currentBundle) {
    setStatus("Open a JSON file first.");
    return;
  }

  try {
    setMode("refreshing statistics");
    showLoader("Refresh statistics", "Using the currently opened JSON as the baseline...", 6, "Preparation");
    const raw = await fetchAllObjectsWithProgress("Refresh statistics");
    updateLoader("Merging previous bundle with the latest snapshot...", 90, "History update");

    const updatedBundle = mergeOpenedBundleWithFreshApi(currentBundle, raw);
    currentBundle = updatedBundle;

    updateLoader("Rendering refreshed data...", 97, "Rendering");
    applyBundleToUI(updatedBundle, `bundle_updated_${formatDateTimeForFile()}.json`, "statistics refreshed");

    const filename = `bundle_updated_${formatDateTimeForFile()}.json`;
    if (!downloadJson(updatedBundle, filename)) throw new Error("Failed to download the refreshed JSON.");

    setStatus(`Done. Statistics refreshed and downloaded as ${filename}.`);
  } catch (err) {
    console.error(err);
    setStatus(`Failed to refresh statistics: ${err.message}`);
    setMode("error");
  } finally {
    hideLoader();
  }
}

function getVisibleObjects(bundle, metric = currentMetric) {
  return [...bundle.objects]
    .map(ensureMetricFieldsForItem)
    .filter((x) => getItemMetricValue(x, metric) > 0)
    .sort((a, b) => getItemMetricValue(b, metric) - getItemMetricValue(a, metric));
}

function getObjectDeltaFromLast(item, metric = currentMetric) {
  const history = getItemHistory(item, metric);
  if (history.length < 2) return 0;
  const prev = num(history[history.length - 2]?.views);
  const last = num(history[history.length - 1]?.views);
  return last - prev;
}

function getObjectDeltaForPeriod(item, period, metric = currentMetric) {
  const history = getItemHistory(item, metric);
  if (!history.length) return 0;

  const lastEntry = history[history.length - 1];
  const lastDate = new Date(lastEntry.capturedAt);
  if (Number.isNaN(+lastDate)) return 0;

  const fromDate = new Date(lastDate);
  if (period === "week") fromDate.setDate(fromDate.getDate() - 7);
  else if (period === "month") fromDate.setMonth(fromDate.getMonth() - 1);
  else if (period === "day") fromDate.setHours(fromDate.getHours() - 24);
  else return getObjectDeltaFromLast(item, metric);

  let baseline = null;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const d = new Date(history[i].capturedAt);
    if (d <= fromDate) {
      baseline = history[i];
      break;
    }
  }

  if (!baseline) baseline = history[0];
  return num(lastEntry.views) - num(baseline?.views);
}

function getDeltaByFilter(item, filter, metric = currentMetric) {
  if (filter === "week") return getObjectDeltaForPeriod(item, "week", metric);
  if (filter === "month") return getObjectDeltaForPeriod(item, "month", metric);
  if (filter === "day") return getObjectDeltaForPeriod(item, "day", metric);
  return getObjectDeltaFromLast(item, metric);
}

function getCurrentDelta(item) {
  return getDeltaByFilter(item, getActiveGrowthFilter(), currentMetric);
}

function getMetricDeltaTotal(list, metric, filter = getActiveGrowthFilter()) {
  return list.reduce((sum, item) => sum + getDeltaByFilter(item, filter, metric), 0);
}

function getGrowthLeaders(list, metric = currentMetric, filter = getActiveGrowthFilter()) {
  return [...list]
    .map((item) => ({
      item,
      delta: getDeltaByFilter(item, filter, metric)
    }))
    .sort((a, b) => b.delta - a.delta || getItemMetricValue(b.item, metric) - getItemMetricValue(a.item, metric))
    .slice(0, 5);
}

function getDeltaSum(filter, metric = currentMetric) {
  if (!currentBundle) return 0;
  return getVisibleObjects(currentBundle, metric).reduce((sum, item) => sum + Math.max(0, getDeltaByFilter(item, filter, metric)), 0);
}

function getFilterValues() {
  return {
    minViews: num(els.minViewsInput.value),
    minLikes: num(els.minLikesInput.value),
    minShowcase: num(els.minShowcaseInput.value),
    minMetric: num(els.minMetricInput.value),
    maxMetric: els.maxMetricInput.value === "" ? Infinity : num(els.maxMetricInput.value),
    removed: els.removedSelect.value,
    query: String(els.searchInput.value || "").trim().toLowerCase()
  };
}

function clearFilterInputs() {
  els.searchInput.value = "";
  els.minViewsInput.value = "";
  els.minLikesInput.value = "";
  els.minShowcaseInput.value = "";
  els.minMetricInput.value = "";
  els.maxMetricInput.value = "";
  els.removedSelect.value = "all";
  currentDeltaFilter = "off";
  currentSort = "metric_desc";
  els.sortSelect.value = "metric_desc";
}

function filterObjects(list) {
  const filters = getFilterValues();
  return list.filter((item) => {
    const metricValue = getItemMetricValue(item, currentMetric);
    const hay = `${item.name || ""} ${item.tinuuid || ""} ${buildGoUrl(item.tinuuid) || ""}`.toLowerCase();

    if (filters.query && !hay.includes(filters.query)) return false;
    if (num(item.lastViews) < filters.minViews) return false;
    if (num(item.lastLikes) < filters.minLikes) return false;
    if (num(item.lastViewsShowcase) < filters.minShowcase) return false;
    if (metricValue < filters.minMetric) return false;
    if (metricValue > filters.maxMetric) return false;
    if (filters.removed === "active" && item.removed) return false;
    if (filters.removed === "removed" && !item.removed) return false;
    if (currentDeltaFilter !== "off" && getCurrentDelta(item) <= 0) return false;
    return true;
  });
}

function computeEngagementScore(item) {
  const views = Math.max(1, num(item.lastViews));
  const likes = num(item.lastLikes);
  const showcase = num(item.lastViewsShowcase);
  return (likes * 2 + showcase * 1.2) / views;
}

function applySorting(list) {
  const arr = [...list];
  if (currentSort === "delta_desc") {
    arr.sort((a, b) => getCurrentDelta(b) - getCurrentDelta(a));
    return arr;
  }
  if (currentSort === "engagement_desc") {
    arr.sort((a, b) => computeEngagementScore(b) - computeEngagementScore(a));
    return arr;
  }
  if (currentSort === "name_asc") {
    arr.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ru", { sensitivity: "base" }));
    return arr;
  }
  arr.sort((a, b) => getItemMetricValue(b, currentMetric) - getItemMetricValue(a, currentMetric));
  return arr;
}

function getCurrentList() {
  if (!currentBundle) return [];
  currentDisplayObjects = getVisibleObjects(currentBundle, currentMetric);
  return applySorting(filterObjects(currentDisplayObjects));
}

function ensureRenderableCatalogState(bundle) {
  const fallbackMetric = METRICS.find((metric) => getVisibleObjects(bundle, metric).length > 0);
  if (fallbackMetric && !getVisibleObjects(bundle, currentMetric).length) {
    currentMetric = fallbackMetric;
  }

  let list = applySorting(filterObjects(getVisibleObjects(bundle, currentMetric)));
  if (!list.length && getVisibleObjects(bundle, currentMetric).length) {
    clearFilterInputs();
    list = applySorting(filterObjects(getVisibleObjects(bundle, currentMetric)));
  }

  updateFilterButtons();
  updateMetricButtons();
  return list;
}

function renderStats(bundle) {
  const visible = getVisibleObjects(bundle, currentMetric);
  const totalMetric = visible.reduce((sum, x) => sum + getItemMetricValue(x, currentMetric), 0);
  const values = visible.map((item) => getItemMetricValue(item, currentMetric));
  const average = visible.length ? totalMetric / visible.length : 0;

  els.metricTotalTitle.textContent = `Total ${METRIC_LABELS[currentMetric]}`;
  els.metricTotalSub.textContent = `Total volume for ${METRIC_LABELS[currentMetric]}`;
  els.statVisibleSub.textContent = `Objects with ${METRIC_LABELS[currentMetric]} > 0`;

  els.statTotal.textContent = formatNum(Array.isArray(bundle.objects) ? bundle.objects.length : 0);
  els.statVisible.textContent = formatNum(visible.length);
  els.statMetricTotal.textContent = formatNum(totalMetric);
  els.statAverage.textContent = formatDecimal(average);
  els.statMedian.textContent = formatDecimal(median(values));
  els.statUpdated.textContent = formatHumanDate(bundle.updatedAt);
}

function renderInsights() {
  els.insightLastUpdate.textContent = formatSignedNum(getDeltaSum("last_update", currentMetric));
  els.insightDay.textContent = formatSignedNum(getDeltaSum("day", currentMetric));
  els.insightWeek.textContent = formatSignedNum(getDeltaSum("week", currentMetric));
  els.insightMonth.textContent = formatSignedNum(getDeltaSum("month", currentMetric));
}

function renderFilterDelta() {
  if (!currentBundle || currentDeltaFilter === "off") {
    els.filterDeltaBadge.textContent = "Σ +0";
    return;
  }

  const total = getVisibleObjects(currentBundle, currentMetric).reduce((sum, item) => sum + Math.max(0, getCurrentDelta(item)), 0);
  els.filterDeltaBadge.textContent = `Σ +${formatNum(total)}`;
}

function renderTopList(list) {
  if (!list.length) {
    els.topList.className = "shortlist empty-list";
    els.topList.innerHTML = "No objects match the current filters.";
    return;
  }

  const leaders = getGrowthLeaders(list);
  els.topList.className = "shortlist";
  els.topList.innerHTML = leaders.map(({ item, delta }, index) => {
    const metricValue = getItemMetricValue(item, currentMetric);
    return `
      <button type="button" class="shortlist__item chart-btn" data-id="${escapeHtml(item.tinuuid)}">
        <span class="shortlist__rank">#${index + 1}</span>
        <span class="shortlist__body">
          <strong>${escapeHtml(item.name || "Untitled Object")}</strong>
          <small>${escapeHtml(item.tinuuid || "—")}</small>
        </span>
        <span class="shortlist__metric">
          <strong>${formatSignedNum(delta)}</strong>
          <small>${METRIC_LABELS[currentMetric]} total ${formatNum(metricValue)}</small>
        </span>
      </button>
    `;
  }).join("");

  bindChartButtons(els.topList);
}

function openBoardModal() {
  els.boardModal.classList.remove("hidden");
  syncModalOpenState();
  if (!currentBundle) {
    setStatus("Analytics board opened in preview mode. Load a bundle.json file to populate the board.");
  }
}

function closeBoardModal() {
  els.boardModal.classList.add("hidden");
  syncModalOpenState();
}

function renderNarrative(list) {
  if (!currentBundle) {
    els.boardViewsDelta.textContent = "+0";
    els.boardLikesDelta.textContent = "+0";
    els.boardShowcaseDelta.textContent = "+0";
    els.boardViewsHint.textContent = "No growth data yet";
    els.boardLikesHint.textContent = "No growth data yet";
    els.boardShowcaseHint.textContent = "No growth data yet";
    els.insightList.innerHTML = "<div class=\"info-card\">Load data to populate change totals and top-mover insights.</div>";
    els.benchmarkList.innerHTML = "<div class=\"info-card\">No three-metric snapshot is available yet.</div>";
    return;
  }

  const activeFilter = getActiveGrowthFilter();
  const viewDelta = getMetricDeltaTotal(list, "views", activeFilter);
  const likesDelta = getMetricDeltaTotal(list, "likes", activeFilter);
  const showcaseDelta = getMetricDeltaTotal(list, "viewsShowcase", activeFilter);
  const positiveViews = list.filter((item) => getDeltaByFilter(item, activeFilter, "views") > 0).length;
  const positiveLikes = list.filter((item) => getDeltaByFilter(item, activeFilter, "likes") > 0).length;
  const positiveShowcase = list.filter((item) => getDeltaByFilter(item, activeFilter, "viewsShowcase") > 0).length;
  const leaders = getGrowthLeaders(list, currentMetric, activeFilter);
  const topLeader = leaders[0];
  const positiveGrowthCount = list.filter((item) => getDeltaByFilter(item, activeFilter, currentMetric) > 0).length;
  const removedCount = currentBundle.objects.filter((item) => item.removed).length;
  const metricLeaders = [
    { label: "views", delta: viewDelta },
    { label: "likes", delta: likesDelta },
    { label: "showcase", delta: showcaseDelta }
  ].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  els.boardViewsDelta.textContent = formatSignedNum(viewDelta);
  els.boardLikesDelta.textContent = formatSignedNum(likesDelta);
  els.boardShowcaseDelta.textContent = formatSignedNum(showcaseDelta);
  els.boardViewsHint.textContent = `${formatNum(positiveViews)} objects gained views`;
  els.boardLikesHint.textContent = `${formatNum(positiveLikes)} objects gained likes`;
  els.boardShowcaseHint.textContent = `${formatNum(positiveShowcase)} objects gained showcase`;

  els.insightList.innerHTML = [
    topLeader
      ? `<div class="info-card"><strong>Top mover in ${METRIC_LABELS[currentMetric]}:</strong> ${escapeHtml(topLeader.item.name || topLeader.item.tinuuid)} changed by ${formatSignedNum(topLeader.delta)}.</div>`
      : "<div class=\"info-card\">No top mover is available under the current filters.</div>",
    `<div class="info-card"><strong>Visible movers:</strong> ${formatNum(positiveGrowthCount)} objects show positive ${METRIC_LABELS[currentMetric]} growth.</div>`,
    `<div class="info-card"><strong>Cross-metric leader:</strong> ${metricLeaders[0].label} shows the largest absolute change in the active growth window.</div>`
  ].join("");

  els.benchmarkList.innerHTML = [
    `<div class="benchmark"><span>Objects in view</span><strong>${formatNum(list.length)}</strong></div>`,
    `<div class="benchmark"><span>Removed in bundle</span><strong>${formatNum(removedCount)}</strong></div>`,
    `<div class="benchmark"><span>Total views</span><strong>${formatNum(list.reduce((sum, item) => sum + num(item.lastViews), 0))}</strong></div>`,
    `<div class="benchmark"><span>Total likes</span><strong>${formatNum(list.reduce((sum, item) => sum + num(item.lastLikes), 0))}</strong></div>`,
    `<div class="benchmark"><span>Total showcase</span><strong>${formatNum(list.reduce((sum, item) => sum + num(item.lastViewsShowcase), 0))}</strong></div>`,
    `<div class="benchmark"><span>Strongest change metric</span><strong>${metricLeaders[0].label}</strong></div>`
  ].join("");
}

function getChartBaseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#d8e1f3" } },
      tooltip: {
        backgroundColor: "rgba(11,16,26,.96)",
        titleColor: "#fff",
        bodyColor: "#dbe6f6",
        borderColor: "rgba(255,255,255,.12)",
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: "#90a0bb", maxRotation: 0, autoSkip: true },
        grid: { color: "rgba(255,255,255,.05)" }
      },
      y: {
        ticks: {
          color: "#90a0bb",
          callback: (value) => formatNum(value)
        },
        grid: { color: "rgba(255,255,255,.05)" }
      }
    }
  };
}

function renderOverviewCharts(list) {
  renderTrendChart();
  renderRankingChart(list);
  renderMixChart(list);
}

function renderTrendChart() {
  const history = currentBundle ? getBundleTotalHistory(currentBundle, currentMetric) : [];
  const labels = history.map((entry) => formatPointLabel(entry.capturedAt));
  const values = history.map((entry) => num(entry.views));

  els.trendSummary.textContent = history.length
    ? `${values.length} points · latest value ${formatNum(values.at(-1))}`
    : "No data";

  if (trendChartInstance) trendChartInstance.destroy();
  trendChartInstance = new Chart(els.trendCanvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `Σ ${METRIC_LABELS[currentMetric]}`,
        data: values,
        borderColor: "#7cc4ff",
        backgroundColor: "rgba(79,146,255,.18)",
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 2
      }]
    },
    options: getChartBaseOptions()
  });
}

function renderRankingChart(list) {
  const leaders = getGrowthLeaders(list);
  els.rankingSummary.textContent = leaders.length
    ? `Top ${leaders.length} movers for ${METRIC_LABELS[currentMetric]}`
    : "No data";

  if (rankingChartInstance) rankingChartInstance.destroy();
  rankingChartInstance = new Chart(els.rankingCanvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: leaders.map(({ item }) => truncate(item.name || item.tinuuid || "Object", 22)),
      datasets: [{
        label: `Δ ${METRIC_LABELS[currentMetric]}`,
        data: leaders.map(({ delta }) => delta),
        borderRadius: 10,
        backgroundColor: ["#7cc4ff", "#5aa9ff", "#4f92ff", "#3a7df3", "#58d7ae"]
      }]
    },
    options: {
      ...getChartBaseOptions(),
      plugins: {
        ...getChartBaseOptions().plugins,
        legend: { display: false }
      }
    }
  });
}

function renderMixChart(list) {
  const base = list.length ? list : currentDisplayObjects;
  const totals = [
    Math.abs(getMetricDeltaTotal(base, "views")),
    Math.abs(getMetricDeltaTotal(base, "likes")),
    Math.abs(getMetricDeltaTotal(base, "viewsShowcase"))
  ];

  if (mixChartInstance) mixChartInstance.destroy();
  mixChartInstance = new Chart(els.mixCanvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["views", "likes", "viewsShowcase"],
      datasets: [{
        data: totals,
        backgroundColor: ["#7cc4ff", "#58d7ae", "#ffc857"],
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          labels: { color: "#d8e1f3" }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${formatNum(ctx.parsed)}`
          }
        }
      }
    }
  });
}

function renderCurrent() {
  if (!currentBundle) {
    els.grid.innerHTML = "";
    currentRenderedObjects = [];
    els.emptyState.classList.remove("hidden");
    els.resultsSummary.textContent = "0 cards";
    els.boardSub.textContent = "Open a bundle to see change totals and top movers across views, likes, and showcase.";
    renderTopList([]);
    renderNarrative([]);
    renderOverviewCharts([]);
    return;
  }

  const list = getCurrentList();
  currentRenderedObjects = list;
  els.grid.innerHTML = "";
  els.resultsSummary.textContent = `${formatNum(list.length)} cards`;

  renderTopList(list);
  renderNarrative(list);
  renderOverviewCharts(list);
  els.boardSub.textContent = `${formatNum(list.length)} visible objects · board is focused on ${METRIC_LABELS[currentMetric]} movers.`;

  if (!list.length) {
    els.emptyState.classList.remove("hidden");
    return;
  }

  els.emptyState.classList.add("hidden");

  list.forEach((item, index) => {
    const goUrl = buildGoUrl(item.tinuuid);
    const viewerUrl = buildViewerUrl(item.tinuuid);
    const preview = item.mainPreview
      ? `<img src="${escapeHtml(item.mainPreview)}" alt="${escapeHtml(item.name)}">`
      : `<div class="catalog-row__fallback">No preview</div>`;

    const card = document.createElement("article");
    card.className = "catalog-row";
    card.innerHTML = `
      <div class="catalog-row__media">
        ${preview}
        <span class="catalog-row__rank">#${index + 1}</span>
      </div>
      <div class="catalog-row__title">
        <h3>${escapeHtml(item.name || "Untitled Object")}</h3>
        <p>${escapeHtml(item.tinuuid || "—")}</p>
        <small>${item.removed ? "Removed from latest API snapshot" : "Live in latest API snapshot"}</small>
      </div>

        <div class="catalog-row__stat">
          <span class="catalog-row__label">views</span>
          <strong>${formatNum(item.lastViews)}</strong>
          <small>${formatSignedNum(getDeltaByFilter(item, getActiveGrowthFilter(), "views"))}</small>
        </div>

        <div class="catalog-row__stat">
          <span class="catalog-row__label">likes</span>
          <strong>${formatNum(item.lastLikes)}</strong>
          <small>${formatSignedNum(getDeltaByFilter(item, getActiveGrowthFilter(), "likes"))}</small>
        </div>

        <div class="catalog-row__stat">
          <span class="catalog-row__label">showcase</span>
          <strong>${formatNum(item.lastViewsShowcase)}</strong>
          <small>${formatSignedNum(getDeltaByFilter(item, getActiveGrowthFilter(), "viewsShowcase"))}</small>
        </div>

        <div class="catalog-row__actions">
          ${goUrl
            ? `<a class="btn btn--ghost btn--small" href="${escapeHtml(goUrl)}" target="_blank" rel="noopener noreferrer">Open object</a>`
            : `<button type="button" class="btn btn--ghost btn--small" disabled>Open object</button>`}
        ${viewerUrl
          ? `<a class="btn btn--primary btn--small" href="${escapeHtml(viewerUrl)}" target="_blank" rel="noopener noreferrer">3D viewer</a>`
          : `<button type="button" class="btn btn--ghost btn--small" disabled>3D viewer</button>`}
          <button type="button" class="btn btn--secondary btn--small chart-btn" data-id="${escapeHtml(item.tinuuid)}">Chart</button>
        </div>
    `;
    els.grid.appendChild(card);
  });

  bindChartButtons(els.grid);
}

function bindChartButtons(scope) {
  scope.querySelectorAll(".chart-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const entry = currentBundle?.objects.find((x) => x.tinuuid === id);
      if (!entry) return;
      openChartModal(entry);
    });
  });
}

function exportCurrentCsv() {
  if (!currentRenderedObjects.length) {
    setStatus("No data available for CSV export.");
    return;
  }

  const rows = [[
    "rank",
    "name",
    "tinuuid",
    "selected_metric",
    "metric_value",
    "delta",
    "views",
    "likes",
    "viewsShowcase",
    "engagement_score",
    "removed",
    "viewer_url",
    "go_url"
  ]];

  currentRenderedObjects.forEach((item, index) => {
    const delta = currentDeltaFilter === "off" ? getObjectDeltaFromLast(item, currentMetric) : getCurrentDelta(item);
    rows.push([
      index + 1,
      item.name || "",
      item.tinuuid || "",
      currentMetric,
      getItemMetricValue(item, currentMetric),
      delta || 0,
      item.lastViews || 0,
      item.lastLikes || 0,
      item.lastViewsShowcase || 0,
      formatDecimal(computeEngagementScore(item), 4),
      item.removed ? "true" : "false",
      buildViewerUrl(item.tinuuid) || "",
      buildGoUrl(item.tinuuid) || ""
    ]);
  });

  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const filename = `vizbl_export_${currentMetric}_${formatDateTimeForFile()}.csv`;
  if (downloadText(csv, filename, "text/csv;charset=utf-8")) {
    setStatus(`CSV exported: ${filename}.`);
  } else {
    setStatus("Failed to export CSV.");
  }
}

function resetUi() {
  currentDeltaFilter = "off";
  currentSort = "metric_desc";
  currentMetric = "views";
  els.searchInput.value = "";
  els.sortSelect.value = "metric_desc";
  els.metricSelect.value = "views";
  els.minViewsInput.value = "";
  els.minLikesInput.value = "";
  els.minShowcaseInput.value = "";
  els.minMetricInput.value = "";
  els.maxMetricInput.value = "";
  els.removedSelect.value = "all";
  updateFilterButtons();
  updateMetricButtons();
  renderAll();
  setStatus("Filters, search, sorting, and metric were reset.");
}

function openChartModal(entry) {
  currentChartEntry = entry;
  chartMode = "days";
  updateChartModeButtons();
  els.modalTitle.textContent = `${entry.name || "Chart"} · ${METRIC_LABELS[currentMetric]}`;
  els.modalSub.textContent = `TINUUID: ${entry.tinuuid || "—"}`;
  els.chartModal.classList.remove("hidden");
  syncModalOpenState();
  drawChart(entry);
}

function openTotalMetricChart() {
  if (!currentBundle) {
    setStatus("No bundle.json file is loaded.");
    return;
  }

  const totalHistory = getBundleTotalHistory(currentBundle, currentMetric);
  if (!totalHistory.length) {
    setStatus(`No total-history data found for ${METRIC_LABELS[currentMetric]}.`);
    return;
  }

  currentChartEntry = {
    name: `Total ${METRIC_LABELS[currentMetric]} across all objects`,
    tinuuid: `TOTAL_${currentMetric}`,
    __isTotalMetric: true
  };

  chartMode = "days";
  updateChartModeButtons();
  els.modalTitle.textContent = `Total ${METRIC_LABELS[currentMetric]} across all objects`;
  els.modalSub.textContent = `Historical total of ${METRIC_LABELS[currentMetric]} across all objects`;
  els.chartModal.classList.remove("hidden");
  syncModalOpenState();
  drawChart(currentChartEntry);
}

function closeChartModal() {
  els.chartModal.classList.add("hidden");
  syncModalOpenState();
}

function updateChartModeButtons() {
  els.daysBtn.classList.toggle("active", chartMode === "days");
  els.monthsBtn.classList.toggle("active", chartMode === "months");
}

function drawChart(entry) {
  let history = [];
  if (entry.__isTotalMetric) history = getBundleTotalHistory(currentBundle, currentMetric);
  else history = getItemHistory(entry, currentMetric);

  let labels = [];
  let values = [];

  if (chartMode === "days") {
    labels = history.map((x) => formatPointLabel(x.capturedAt));
    values = history.map((x) => num(x.views));
    els.chartMeta.textContent = `Points: ${values.length} · Metric: ${METRIC_LABELS[currentMetric]} · Mode: day snapshots`;
  } else {
    const grouped = groupByMonth(history);
    labels = grouped.labels;
    values = grouped.values;
    els.chartMeta.textContent = `Points: ${values.length} · Metric: ${METRIC_LABELS[currentMetric]} · Mode: monthly view`;
  }

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(document.getElementById("chartCanvas").getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: METRIC_LABELS[currentMetric],
        data: values,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        backgroundColor: "rgba(90,169,255,.14)",
        borderColor: "rgba(124,196,255,1)",
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "rgba(124,196,255,1)"
      }]
    },
    options: getChartBaseOptions()
  });
}

function formatPointLabel(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function groupByMonth(history) {
  const map = new Map();
  history.forEach((x) => {
    const d = new Date(x.capturedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, num(x.views));
  });
  const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return {
    labels: entries.map(([k]) => k),
    values: entries.map(([, v]) => v)
  };
}

function truncate(text, length) {
  if (String(text).length <= length) return text;
  return `${String(text).slice(0, length - 1)}…`;
}

function applyBundleToUI(bundle, fileLabel, modeLabel) {
  validateBundle(bundle);
  currentBundle = bundle;
  currentDisplayObjects = ensureRenderableCatalogState(bundle);
  setFileChip(`File: ${fileLabel}`);
  setMode(modeLabel);
  els.updateBtn.disabled = false;
  renderAll();
}

function renderAll() {
  if (!currentBundle) {
    renderCurrent();
    renderFilterDelta();
    renderInsights();
    setMetricChip();
    return;
  }

  renderStats(currentBundle);
  renderInsights();
  renderCurrent();
  renderFilterDelta();
  setMetricChip();
}

updateFilterButtons();
updateMetricButtons();
renderFilterDelta();
renderInsights();
setMode("idle");
renderCurrent();
