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
  osInput: document.getElementById("osInput"),
  platformInput: document.getElementById("platformInput"),
  chassisInput: document.getElementById("chassisInput"),
  aspectRatioInput: document.getElementById("aspectRatioInput"),
  backlightInput: document.getElementById("backlightInput"),
  brightnessInput: document.getElementById("brightnessInput"),
  contrastInput: document.getElementById("contrastInput"),
  tiltInput: document.getElementById("tiltInput"),
  heightAdjustInput: document.getElementById("heightAdjustInput"),
  pivotInput: document.getElementById("pivotInput"),
  swivelInput: document.getElementById("swivelInput"),
  vesaInput: document.getElementById("vesaInput"),
  bezelTypeInput: document.getElementById("bezelTypeInput"),
  webcamInput: document.getElementById("webcamInput"),
  speakersInput: document.getElementById("speakersInput"),
  speakerPowerInput: document.getElementById("speakerPowerInput"),
  hdmiInput: document.getElementById("hdmiInput"),
  dpInput: document.getElementById("dpInput"),
  usbCInput: document.getElementById("usbCInput"),
  usbHubInput: document.getElementById("usbHubInput"),
  kvmInput: document.getElementById("kvmInput"),
  adaptiveSyncInput: document.getElementById("adaptiveSyncInput"),
  rj45Input: document.getElementById("rj45Input"),
  audioIoInput: document.getElementById("audioIoInput"),
  wifiInput: document.getElementById("wifiInput"),
  bluetoothInput: document.getElementById("bluetoothInput"),
  boxHdmiCableInput: document.getElementById("boxHdmiCableInput"),
  boxDpCableInput: document.getElementById("boxDpCableInput"),
  boxUsbABInput: document.getElementById("boxUsbABInput"),
  boxUsbCInput: document.getElementById("boxUsbCInput"),
  knowledgeFeaturesInput: document.getElementById("knowledgeFeaturesInput"),
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

function parseLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function setInput(input, value) {
  if (input) {
    input.value = toText(value);
  }
}

function setModuleFieldVisibility() {
  document.querySelectorAll("[data-module-field]").forEach((element) => {
    const targetModule = toText(element.getAttribute("data-module-field")).toUpperCase();
    element.classList.toggle("hidden", targetModule && targetModule !== state.activeModule);
  });
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
  setModuleFieldVisibility();
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
  document.querySelectorAll("#modelForm input, #modelForm textarea").forEach((input) => { input.value = ""; });
  els.supportLinksList.innerHTML = "";
  addSupportRow();
  setModuleFieldVisibility();
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

function readSpecValue(model, categoryName, keys) {
  const specs = isPlainObject(model && model.specs) ? model.specs : {};
  const categoryVariants = [
    specs[categoryName],
    specs[categoryName && categoryName.toLowerCase()],
    specs.technicalByCategory && specs.technicalByCategory[categoryName],
    specs.rawSource && specs.rawSource[categoryName]
  ].filter(isPlainObject);

  for (const key of keys) {
    const direct = toText(specs[key]);
    if (direct) return direct;
    for (const category of categoryVariants) {
      const value = toText(category[key]);
      if (value) return value;
    }
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
  setInput(els.modelNameInput, state.selectedModelName);
  setInput(els.brandInput, readModelValue(model, [["brand"], ["specs", "brand"]]));
  setInput(els.yearInput, readModelValue(model, [["year"]]));
  setInput(els.refreshRateInput, readModelValue(model, [["vrrMaxRefreshRate"], ["specs", "maxRefreshRate"], ["specs", "vrrMaxRefreshRate"]]) || readSpecValue(model, "Display/Panel", ["Max Refresh Rate", "Refresh Rate"]));
  setInput(els.panelTypeInput, readModelValue(model, [["panelType"], ["panel"], ["specs", "panelType"], ["specs", "panel"]]) || readSpecValue(model, "Display/Panel", ["Panel", "Panel Type"]));
  setInput(els.resolutionInput, readModelValue(model, [["resolution"], ["specs", "resolution"]]) || readSpecValue(model, "Display/Panel", ["Resolution"]));
  setInput(els.warrantyInput, readModelValue(model, [["warranty"], ["specs", "warranty"]]) || readSpecValue(model, "Display/Panel", ["Warranty"]));
  setInput(els.osInput, readModelValue(model, [["osProfileId"], ["os"], ["specs", "os"]]));
  setInput(els.platformInput, readModelValue(bundle, [["platformChassis", "platform"], ["platform"]]));
  setInput(els.chassisInput, readModelValue(bundle, [["platformChassis", "chassis"], ["chassis"]]));
  setInput(els.aspectRatioInput, readSpecValue(model, "Display/Panel", ["Aspect Ratio", "aspectRatio"]));
  setInput(els.backlightInput, readSpecValue(model, "Display/Panel", ["Backlight", "backlight"]));
  setInput(els.brightnessInput, readSpecValue(model, "Display/Panel", ["Brightness (max)", "brightnessMax", "brightness"]));
  setInput(els.contrastInput, readSpecValue(model, "Display/Panel", ["Contrast (static)", "contrastStatic", "contrast"]));
  setInput(els.tiltInput, readSpecValue(model, "Physical", ["Tilt", "tilt"]));
  setInput(els.heightAdjustInput, readSpecValue(model, "Physical", ["Height Adjust", "heightAdjust"]));
  setInput(els.pivotInput, readSpecValue(model, "Physical", ["Pivot", "pivot"]));
  setInput(els.swivelInput, readSpecValue(model, "Physical", ["Swivel", "swivel"]));
  setInput(els.vesaInput, readSpecValue(model, "Physical", ["VESA Wallmount", "VESA", "vesa"]));
  setInput(els.bezelTypeInput, readSpecValue(model, "Physical", ["Bezel Type", "bezelType"]));
  setInput(els.webcamInput, readSpecValue(model, "Physical", ["Webcam", "webcam"]));
  setInput(els.speakersInput, readSpecValue(model, "Sound", ["Speakers", "speakers"]) || readModelValue(model, [["audioChannels"]]));
  setInput(els.speakerPowerInput, readSpecValue(model, "Sound", ["Speaker power", "Speaker Power", "speakerPower"]) || readModelValue(model, [["audioPower"]]));
  setInput(els.hdmiInput, readSpecValue(model, "Connectivity", ["HDMI Ports", "HDMI", "hdmiPorts"]));
  setInput(els.dpInput, readSpecValue(model, "Connectivity", ["DisplayPort Ports", "Display Port Ports", "DP", "dpPorts"]));
  setInput(els.usbCInput, readSpecValue(model, "Connectivity", ["USB-C", "USB C", "usbC"]));
  setInput(els.usbHubInput, readSpecValue(model, "Connectivity", ["USB Hub", "usbHub"]));
  setInput(els.kvmInput, readSpecValue(model, "Connectivity", ["Built-in KVM", "KVM Switch", "kvmSwitch"]));
  setInput(els.adaptiveSyncInput, readSpecValue(model, "Connectivity", ["Adaptive Sync", "Sync Technology", "syncTechnology"]));
  setInput(els.rj45Input, readSpecValue(model, "Connectivity", ["RJ45", "rj45"]));
  setInput(els.audioIoInput, readSpecValue(model, "Connectivity", ["Headphone out/Audio In", "Audio", "audio"]));
  setInput(els.wifiInput, readModelValue(model, [["wifiStandard"], ["specs", "wifiStandard"]]));
  setInput(els.bluetoothInput, readModelValue(model, [["bluetoothVersion"], ["specs", "bluetoothVersion"]]));
  setInput(els.boxHdmiCableInput, readSpecValue(model, "What's in the box", ["HDMI cable"]));
  setInput(els.boxDpCableInput, readSpecValue(model, "What's in the box", ["Displayport Cable"]));
  setInput(els.boxUsbABInput, readSpecValue(model, "What's in the box", ["USB-A to B Cable"]));
  setInput(els.boxUsbCInput, readSpecValue(model, "What's in the box", ["USB-C Cable"]));
  setInput(els.knowledgeFeaturesInput, Array.isArray(model && model.specs && model.specs.features && model.specs.features.knowledge) ? model.specs.features.knowledge.join("\n") : "");
  setInput(els.frontImageInput, readModelValue(mediaEntry, [["frontImageUrl"], ["media", "frontImageUrl"]]));
  setInput(els.sideImageInput, readModelValue(mediaEntry, [["sideImageUrl"], ["media", "sideImageUrl"]]));
  setInput(els.portsImageInput, readModelValue(mediaEntry, [["portsImageUrl"], ["media", "portsImageUrl"]]));

  els.supportLinksList.innerHTML = "";
  Object.entries(support).forEach(([key, url]) => addSupportRow(parseSupportKey(key, url)));
  if (!els.supportLinksList.children.length) addSupportRow();
  setModuleFieldVisibility();
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

  const physical = {
    tilt: toText(els.tiltInput.value),
    heightAdjust: toText(els.heightAdjustInput.value),
    pivot: toText(els.pivotInput.value),
    swivel: toText(els.swivelInput.value),
    vesa: toText(els.vesaInput.value),
    bezelType: toText(els.bezelTypeInput.value),
    webcam: toText(els.webcamInput.value)
  };
  const sound = {
    speakers: toText(els.speakersInput.value),
    speakerPower: toText(els.speakerPowerInput.value)
  };
  const connectivity = {
    hdmiPorts: toText(els.hdmiInput.value),
    dpPorts: toText(els.dpInput.value),
    usbC: toText(els.usbCInput.value),
    usbHub: toText(els.usbHubInput.value),
    kvmSwitch: toText(els.kvmInput.value),
    adaptiveSync: toText(els.adaptiveSyncInput.value),
    syncTechnology: toText(els.adaptiveSyncInput.value),
    rj45: toText(els.rj45Input.value),
    audio: toText(els.audioIoInput.value)
  };
  const box = {
    "HDMI cable": toText(els.boxHdmiCableInput.value),
    "Displayport Cable": toText(els.boxDpCableInput.value),
    "USB-A to B Cable": toText(els.boxUsbABInput.value),
    "USB-C Cable": toText(els.boxUsbCInput.value)
  };
  const displayPanel = {
    "Panel": toText(els.panelTypeInput.value),
    "Panel Type": toText(els.panelTypeInput.value),
    "Resolution": toText(els.resolutionInput.value),
    "Max Refresh Rate": toText(els.refreshRateInput.value),
    "Warranty": toText(els.warrantyInput.value),
    "Aspect Ratio": toText(els.aspectRatioInput.value),
    "Backlight": toText(els.backlightInput.value),
    "Brightness (max)": toText(els.brightnessInput.value),
    "Contrast (static)": toText(els.contrastInput.value)
  };

  const specs = {
    brand: toText(els.brandInput.value),
    panelType: toText(els.panelTypeInput.value),
    panel: toText(els.panelTypeInput.value),
    resolution: toText(els.resolutionInput.value),
    maxRefreshRate: toText(els.refreshRateInput.value),
    warranty: toText(els.warrantyInput.value),
    aspectRatio: toText(els.aspectRatioInput.value),
    backlight: toText(els.backlightInput.value),
    brightnessMax: toText(els.brightnessInput.value),
    contrastStatic: toText(els.contrastInput.value),
    physical,
    sound,
    connectivity,
    box,
    features: {
      knowledge: parseLines(els.knowledgeFeaturesInput.value)
    },
    technicalByCategory: {
      "Display/Panel": displayPanel,
      "Physical": {
        "Tilt": physical.tilt,
        "Height Adjust": physical.heightAdjust,
        "Pivot": physical.pivot,
        "Swivel": physical.swivel,
        "VESA Wallmount": physical.vesa,
        "Bezel Type": physical.bezelType,
        "Webcam": physical.webcam
      },
      "Sound": {
        "Speakers": sound.speakers,
        "Speaker power": sound.speakerPower
      },
      "Connectivity": {
        "HDMI Ports": connectivity.hdmiPorts,
        "DisplayPort Ports": connectivity.dpPorts,
        "USB-C": connectivity.usbC,
        "USB Hub": connectivity.usbHub,
        "Built-in KVM": connectivity.kvmSwitch,
        "Adaptive Sync": connectivity.adaptiveSync,
        "RJ45": connectivity.rj45,
        "Headphone out/Audio In": connectivity.audio
      },
      "What's in the box": box
    }
  };

  const model = {
    ...(state.selectedModel || {}),
    modelName,
    module: state.activeModule,
    brand: specs.brand,
    year: Number(els.yearInput.value) || undefined,
    osProfileId: toText(els.osInput.value),
    panelType: specs.panelType,
    resolution: specs.resolution,
    vrrMaxRefreshRate: specs.maxRefreshRate,
    warranty: specs.warranty,
    audioChannels: sound.speakers,
    audioPower: sound.speakerPower,
    wifiStandard: toText(els.wifiInput.value),
    bluetoothVersion: toText(els.bluetoothInput.value),
    specs
  };

  const mediaImages = {
    frontImageUrl: toText(els.frontImageInput.value),
    sideImageUrl: toText(els.sideImageInput.value),
    portsImageUrl: toText(els.portsImageInput.value)
  };
  const media = {
    ...mediaImages,
    media: {
      ...mediaImages
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
