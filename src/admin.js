const tokenStorageKey = "support-hub-admin-token";

const state = {
  token: sessionStorage.getItem(tokenStorageKey) || localStorage.getItem(tokenStorageKey) || "",
  activeModule: "MNT",
  models: [],
  selectedModel: null,
  selectedModelName: ""
};

const els = {
  toast: document.getElementById("toast"),
  loginView: document.getElementById("loginView"),
  adminView: document.getElementById("adminView"),
  loginForm: document.getElementById("loginForm"),
  usernameInput: document.getElementById("usernameInput"),
  passwordInput: document.getElementById("passwordInput"),
  loginButton: document.getElementById("loginButton"),
  logoutBtn: document.getElementById("logoutBtn"),
  refreshModelsBtn: document.getElementById("refreshModelsBtn"),
  moduleTabs: Array.from(document.querySelectorAll("[data-module-tab]")),
  modelSearchInput: document.getElementById("modelSearchInput"),
  modelOptions: document.getElementById("modelOptions"),
  modelCountLabel: document.getElementById("modelCountLabel"),
  loadModelBtn: document.getElementById("loadModelBtn"),
  newModelBtn: document.getElementById("newModelBtn"),
  saveModelBtn: document.getElementById("saveModelBtn"),
  editorTitle: document.getElementById("editorTitle"),
  modelNameInput: document.getElementById("modelNameInput"),
  brandInput: document.getElementById("brandInput"),
  yearInput: document.getElementById("yearInput"),
  refreshRateInput: document.getElementById("refreshRateInput"),
  panelTypeInput: document.getElementById("panelTypeInput"),
  resolutionInput: document.getElementById("resolutionInput"),
  warrantyInput: document.getElementById("warrantyInput"),
  platformInput: document.getElementById("platformInput"),
  chassisInput: document.getElementById("chassisInput"),
  frontImageInput: document.getElementById("frontImageInput"),
  sideImageInput: document.getElementById("sideImageInput"),
  portsImageInput: document.getElementById("portsImageInput"),
  addSupportLinkBtn: document.getElementById("addSupportLinkBtn"),
  supportLinksList: document.getElementById("supportLinksList")
};

function getApiBaseUrl() {
  const config = window.SupportHubConfig && typeof window.SupportHubConfig === "object" ? window.SupportHubConfig : {};
  return String(config.apiBaseUrl || "").trim().replace(/\/+$/, "");
}

function apiUrl(path) {
  const base = getApiBaseUrl();
  return base + (path.startsWith("/") ? path : "/" + path);
}

function toText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function showToast(message, type = "success") {
  if (!els.toast) return;
  const isError = type === "error";
  els.toast.textContent = message;
  els.toast.className = "fixed right-4 top-4 z-50 max-w-sm rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl "
    + (isError ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700");
  els.toast.classList.remove("hidden");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.add("hidden"), 3200);
}

function setLoggedIn(isLoggedIn) {
  els.loginView.classList.toggle("hidden", isLoggedIn);
  els.adminView.classList.toggle("hidden", !isLoggedIn);
}

async function parseJsonResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    return { message: text || response.statusText };
  }
}

async function request(path, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = "Bearer " + state.token;
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers
  });
  const data = await parseJsonResponse(response);

  if (!response.ok || data.ok === false) {
    const message = data.message || data.error || "Request failed (" + response.status + ")";
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

async function login(username, password) {
  const payload = JSON.stringify({ username, password });
  const loginEndpoints = ["/api/auth/login", "/api/admin/login"];
  let lastError = null;

  for (const endpoint of loginEndpoints) {
    try {
      const data = await request(endpoint, {
        method: "POST",
        body: payload,
        headers: { Authorization: "" }
      });
      const token = data.token || data.jwt || data.accessToken || data.adminToken;
      if (!token) {
        throw new Error("Login response did not include a JWT token.");
      }
      state.token = token;
      sessionStorage.setItem(tokenStorageKey, token);
      return data;
    } catch (error) {
      lastError = error;
      if (error.status && error.status !== 404) break;
    }
  }

  throw lastError || new Error("Login failed.");
}

function getModelName(model) {
  return toText(model && (model.modelName || model.name || model.model && model.model.modelName));
}

function getModelModule(model) {
  return toText(model && (model.module || model.productType || model.type || model.model && model.model.module)).toUpperCase() || "TV";
}

function normalizeModelsPayload(data) {
  const items = Array.isArray(data.items) ? data.items
    : Array.isArray(data.ModelsData) ? data.ModelsData
      : Array.isArray(data.models) ? data.models
        : Array.isArray(data) ? data
          : [];
  return items.map((item) => isPlainObject(item.bundle) ? item.bundle.model || item.bundle : item);
}

async function loadModels() {
  const data = await request("/api/admin/models", { method: "GET" });
  state.models = normalizeModelsPayload(data);
  renderModelOptions();
}

function renderModelOptions() {
  const filtered = state.models.filter((model) => getModelModule(model) === state.activeModule || state.activeModule === "TV" && getModelModule(model) !== "MNT");
  els.modelOptions.innerHTML = filtered
    .map((model) => "<option value=\"" + getModelName(model).replace(/"/g, "&quot;") + "\"></option>")
    .join("");
  els.modelCountLabel.textContent = String(filtered.length) + " " + state.activeModule + " models loaded";
}

function setActiveModule(moduleName) {
  state.activeModule = moduleName;
  els.moduleTabs.forEach((tab) => {
    const isActive = tab.dataset.moduleTab === moduleName;
    tab.classList.toggle("bg-white", isActive);
    tab.classList.toggle("shadow-sm", isActive);
    tab.classList.toggle("text-brand-700", isActive);
    tab.classList.toggle("text-slate-600", !isActive);
  });
  renderModelOptions();
  clearForm();
}

function addSupportRow(row = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = "grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[150px_120px_1fr_auto]";
  wrapper.innerHTML = `
    <label class="block">
      <span class="text-xs font-semibold text-slate-600">Category</span>
      <select data-support-category class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm">
        <option>Manual</option>
        <option>Driver</option>
        <option>Declaration</option>
        <option>Firmware</option>
        <option>Software</option>
      </select>
    </label>
    <label class="block">
      <span class="text-xs font-semibold text-slate-600">Language</span>
      <select data-support-language class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm">
        <option>Global</option>
        <option>PL</option>
        <option>EN</option>
        <option>DE</option>
      </select>
    </label>
    <label class="block">
      <span class="text-xs font-semibold text-slate-600">URL</span>
      <input data-support-url type="url" class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm" placeholder="https://...">
    </label>
    <button type="button" data-remove-support-row class="self-end rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Remove</button>
  `;
  wrapper.querySelector("[data-support-category]").value = row.category || "Manual";
  wrapper.querySelector("[data-support-language]").value = row.language || "Global";
  wrapper.querySelector("[data-support-url]").value = row.url || "";
  wrapper.querySelector("[data-remove-support-row]").addEventListener("click", () => wrapper.remove());
  els.supportLinksList.appendChild(wrapper);
}

function clearForm() {
  state.selectedModel = null;
  state.selectedModelName = "";
  els.editorTitle.textContent = "Add New " + state.activeModule + " Model";
  [
    els.modelNameInput, els.brandInput, els.yearInput, els.refreshRateInput, els.panelTypeInput,
    els.resolutionInput, els.warrantyInput, els.platformInput, els.chassisInput,
    els.frontImageInput, els.sideImageInput, els.portsImageInput
  ].forEach((input) => { input.value = ""; });
  els.supportLinksList.innerHTML = "";
  addSupportRow();
}

function readModelValue(model, paths) {
  for (const path of paths) {
    let current = model;
    for (const key of path) current = current && current[key];
    const text = toText(current);
    if (text) return text;
  }
  return "";
}

function fillFormFromBundle(bundle) {
  const model = isPlainObject(bundle && bundle.model) ? bundle.model : bundle;
  const specs = isPlainObject(model && model.specs) ? model.specs : {};
  const mediaEntry = isPlainObject(bundle && bundle.media) ? bundle.media : isPlainObject(bundle && bundle.media && bundle.media.media) ? bundle.media.media : {};
  const support = isPlainObject(bundle && bundle.support) ? bundle.support : isPlainObject(bundle && bundle.media && bundle.media.support) ? bundle.media.support : {};

  state.selectedModel = model;
  state.selectedModelName = getModelName(model);
  els.editorTitle.textContent = "Editing " + state.selectedModelName;
  els.modelNameInput.value = state.selectedModelName;
  els.brandInput.value = readModelValue(model, [["brand"], ["specs", "brand"]]);
  els.yearInput.value = readModelValue(model, [["year"]]);
  els.refreshRateInput.value = readModelValue(model, [["vrrMaxRefreshRate"], ["specs", "maxRefreshRate"], ["specs", "vrrMaxRefreshRate"]]);
  els.panelTypeInput.value = readModelValue(model, [["panelType"], ["panel"], ["specs", "panelType"], ["specs", "panel"]]);
  els.resolutionInput.value = readModelValue(model, [["resolution"], ["specs", "resolution"]]);
  els.warrantyInput.value = readModelValue(model, [["warranty"], ["specs", "warranty"]]);
  els.platformInput.value = readModelValue(bundle, [["platformChassis", "platform"], ["platform"]]);
  els.chassisInput.value = readModelValue(bundle, [["platformChassis", "chassis"], ["chassis"]]);
  els.frontImageInput.value = readModelValue(mediaEntry, [["frontImageUrl"], ["media", "frontImageUrl"]]);
  els.sideImageInput.value = readModelValue(mediaEntry, [["sideImageUrl"], ["media", "sideImageUrl"]]);
  els.portsImageInput.value = readModelValue(mediaEntry, [["portsImageUrl"], ["media", "portsImageUrl"]]);

  els.supportLinksList.innerHTML = "";
  Object.entries(support).forEach(([key, url]) => addSupportRow(parseSupportKey(key, url)));
  if (!els.supportLinksList.children.length) addSupportRow();
}

function parseSupportKey(key, url) {
  const text = toText(key);
  const bracket = text.match(/^\[(PL|EN|DE)\]\s*(.+)$/i);
  if (bracket) return { language: bracket[1].toUpperCase(), category: bracket[2], url };
  const paren = text.match(/^(.+?)\s*\((pl|en|de)\)$/i);
  if (paren) return { language: paren[2].toUpperCase(), category: paren[1], url };
  return { language: "Global", category: text || "Manual", url };
}

function buildSupportKey(row) {
  if (state.activeModule === "TV") {
    return row.language === "Global" ? row.category : "[" + row.language + "] " + row.category;
  }
  return row.language === "Global" ? row.category : row.category + " (" + row.language.toLowerCase() + ")";
}

function readSupportRows() {
  const support = {};
  Array.from(els.supportLinksList.children).forEach((row) => {
    const category = toText(row.querySelector("[data-support-category]").value);
    const language = toText(row.querySelector("[data-support-language]").value) || "Global";
    const url = toText(row.querySelector("[data-support-url]").value);
    if (!category || !url) return;
    support[buildSupportKey({ category, language })] = url;
  });
  return support;
}

function buildModelPayload() {
  const modelName = toText(els.modelNameInput.value);
  if (!modelName) throw new Error("Model Name is required.");

  const specs = {
    brand: toText(els.brandInput.value),
    panelType: toText(els.panelTypeInput.value),
    resolution: toText(els.resolutionInput.value),
    maxRefreshRate: toText(els.refreshRateInput.value),
    warranty: toText(els.warrantyInput.value)
  };

  const model = {
    ...(state.selectedModel || {}),
    modelName,
    module: state.activeModule,
    brand: specs.brand,
    year: Number(els.yearInput.value) || undefined,
    panelType: specs.panelType,
    resolution: specs.resolution,
    vrrMaxRefreshRate: specs.maxRefreshRate,
    warranty: specs.warranty,
    specs
  };

  const media = {
    media: {
      frontImageUrl: toText(els.frontImageInput.value),
      sideImageUrl: toText(els.sideImageInput.value),
      portsImageUrl: toText(els.portsImageInput.value)
    },
    support: readSupportRows()
  };

  return {
    module: state.activeModule,
    modelName,
    previousModelName: state.selectedModelName || "",
    model,
    media,
    support: media.support,
    platformChassis: {
      modelName,
      platform: toText(els.platformInput.value),
      chassis: toText(els.chassisInput.value),
      year: Number(els.yearInput.value) || undefined
    }
  };
}

async function loadSelectedModel() {
  const modelName = toText(els.modelSearchInput.value);
  if (!modelName) return showToast("Choose a model first.", "error");

  const listModel = state.models.find((model) => getModelName(model).toLowerCase() === modelName.toLowerCase());
  state.selectedModelName = modelName;

  try {
    const data = await request("/api/admin/model-bundle/" + encodeURIComponent(modelName), { method: "GET" });
    fillFormFromBundle(data.bundle || data.item || data);
  } catch (error) {
    fillFormFromBundle(listModel || { modelName, module: state.activeModule });
    showToast("Loaded local model data; detailed bundle endpoint was unavailable.", "error");
  }
}

async function saveModel() {
  const payload = buildModelPayload();
  const isEditing = Boolean(state.selectedModelName);
  const endpoint = isEditing ? "/api/admin/models/" + encodeURIComponent(state.selectedModelName) : "/api/admin/models";
  const method = isEditing ? "PUT" : "POST";

  const fallbackEndpoint = isEditing ? "/api/admin/model-bundle/" + encodeURIComponent(state.selectedModelName) : "/api/admin/model-bundle";

  try {
    const data = await request(endpoint, { method, body: JSON.stringify(payload) });
    showToast("Model saved successfully.");
    state.selectedModelName = payload.modelName;
    await loadModels().catch(() => {});
    return data;
  } catch (primaryError) {
    const data = await request(fallbackEndpoint, { method, body: JSON.stringify(payload) });
    showToast("Model saved successfully.");
    state.selectedModelName = payload.modelName;
    await loadModels().catch(() => {});
    return data;
  }
}

async function bootAdmin() {
  if (!state.token) {
    setLoggedIn(false);
    clearForm();
    return;
  }

  setLoggedIn(true);
  clearForm();
  try {
    await loadModels();
  } catch (error) {
    showToast(error.message || "Failed to load models.", "error");
  }
}

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.loginButton.disabled = true;
  els.loginButton.textContent = "Signing in...";
  try {
    await login(els.usernameInput.value, els.passwordInput.value);
    setLoggedIn(true);
    showToast("Logged in successfully.");
    await loadModels();
    clearForm();
  } catch (error) {
    showToast(error.message || "Login failed.", "error");
  } finally {
    els.loginButton.disabled = false;
    els.loginButton.textContent = "Login";
  }
});

els.logoutBtn.addEventListener("click", () => {
  state.token = "";
  sessionStorage.removeItem(tokenStorageKey);
  localStorage.removeItem(tokenStorageKey);
  setLoggedIn(false);
  showToast("Logged out.");
});

els.moduleTabs.forEach((tab) => tab.addEventListener("click", () => setActiveModule(tab.dataset.moduleTab)));
els.refreshModelsBtn.addEventListener("click", () => loadModels().then(() => showToast("Models refreshed.")).catch((error) => showToast(error.message, "error")));
els.loadModelBtn.addEventListener("click", loadSelectedModel);
els.newModelBtn.addEventListener("click", clearForm);
els.addSupportLinkBtn.addEventListener("click", () => addSupportRow());
els.saveModelBtn.addEventListener("click", () => saveModel().catch((error) => showToast(error.message || "Save failed.", "error")));

bootAdmin();
