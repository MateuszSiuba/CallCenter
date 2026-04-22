(() => {
  const storageTokenKey = "callcenter-admin-token";

  const state = {
    token: localStorage.getItem(storageTokenKey) || "",
    models: [],
    selectedModel: null,
    selectedKey: ""
  };

  const els = {
    loginSection: document.getElementById("loginSection"),
    adminSection: document.getElementById("adminSection"),
    loginForm: document.getElementById("loginForm"),
    usernameInput: document.getElementById("usernameInput"),
    passwordInput: document.getElementById("passwordInput"),
    loginStatus: document.getElementById("loginStatus"),

    searchInput: document.getElementById("searchInput"),
    refreshBtn: document.getElementById("refreshBtn"),
    newModelBtn: document.getElementById("newModelBtn"),
    logoutBtn: document.getElementById("logoutBtn"),

    modelCountBadge: document.getElementById("modelCountBadge"),
    modelsList: document.getElementById("modelsList"),

    modelForm: document.getElementById("modelForm"),
    modelNameInput: document.getElementById("modelNameInput"),
    yearInput: document.getElementById("yearInput"),
    osProfileInput: document.getElementById("osProfileInput"),
    panelTypeInput: document.getElementById("panelTypeInput"),
    availableSizesInput: document.getElementById("availableSizesInput"),
    chassisInput: document.getElementById("chassisInput"),
    standInput: document.getElementById("standInput"),
    audioChannelsInput: document.getElementById("audioChannelsInput"),
    audioPowerInput: document.getElementById("audioPowerInput"),
    vrrInput: document.getElementById("vrrInput"),
    wifiInput: document.getElementById("wifiInput"),
    bluetoothInput: document.getElementById("bluetoothInput"),
    aliasesInput: document.getElementById("aliasesInput"),
    featureAmbilightInput: document.getElementById("featureAmbilightInput"),
    featureVideoInput: document.getElementById("featureVideoInput"),
    featureAudioInput: document.getElementById("featureAudioInput"),
    featureGamingInput: document.getElementById("featureGamingInput"),
    featureSmartInput: document.getElementById("featureSmartInput"),
    appsInput: document.getElementById("appsInput"),
    jsonOverrideInput: document.getElementById("jsonOverrideInput"),
    unsetPathInput: document.getElementById("unsetPathInput"),
    deleteBtn: document.getElementById("deleteBtn"),
    unsetFieldBtn: document.getElementById("unsetFieldBtn"),
    editorStatus: document.getElementById("editorStatus")
  };

  function setStatus(element, message, type) {
    element.textContent = message || "";
    element.className = "status" + (type ? " " + type : "");
  }

  function toText(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value).trim();
  }

  function parseCsv(text) {
    return toText(text)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function parseLines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function toLines(values) {
    return Array.isArray(values) ? values.join("\n") : "";
  }

  function api(path, options = {}, requireAuth = true) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    if (requireAuth && state.token) {
      headers.Authorization = "Bearer " + state.token;
    }

    return fetch(path, {
      method: options.method || "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    });
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function setLoggedInUi(isLoggedIn) {
    els.loginSection.classList.toggle("hidden", isLoggedIn);
    els.adminSection.classList.toggle("hidden", !isLoggedIn);
  }

  function renderModelList(models) {
    els.modelCountBadge.textContent = String(models.length);

    if (models.length === 0) {
      els.modelsList.innerHTML = "<p class=\"muted\">No models found.</p>";
      return;
    }

    const activeKey = toText(state.selectedModel && state.selectedModel.modelName).toUpperCase();

    els.modelsList.innerHTML = models
      .map((model) => {
        const modelName = toText(model && model.modelName);
        const isActive = activeKey && modelName.toUpperCase() === activeKey;
        const year = toText(model && model.year);
        const panel = toText(model && model.panelType);

        return `
          <button class="model-item ${isActive ? "active" : ""}" data-model="${encodeURIComponent(modelName)}" type="button">
            <div class="model-name">${modelName || "(no name)"}</div>
            <div class="model-meta">${year || "-"} | ${panel || "-"}</div>
          </button>
        `;
      })
      .join("");

    Array.from(els.modelsList.querySelectorAll(".model-item")).forEach((button) => {
      button.addEventListener("click", () => {
        const modelName = decodeURIComponent(button.dataset.model || "");
        const model = state.models.find((item) => toText(item && item.modelName).toUpperCase() === modelName.toUpperCase());
        if (!model) {
          return;
        }

        state.selectedModel = deepClone(model);
        state.selectedKey = toText(model.modelName);
        fillFormFromModel(state.selectedModel);
        renderModelList(filterModels());
      });
    });
  }

  function filterModels() {
    const query = toText(els.searchInput.value).toLowerCase();
    if (!query) {
      return state.models;
    }

    return state.models.filter((model) => toText(model && model.modelName).toLowerCase().includes(query));
  }

  function ensureObject(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }

    return {};
  }

  function writeTextField(target, key, value) {
    const normalized = toText(value);
    if (normalized) {
      target[key] = normalized;
      return;
    }

    delete target[key];
  }

  function writeArrayField(target, key, values) {
    if (values.length > 0) {
      target[key] = values;
      return;
    }

    delete target[key];
  }

  function buildModelFromForm() {
    const overrideText = toText(els.jsonOverrideInput.value);
    if (overrideText) {
      const parsed = JSON.parse(overrideText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("JSON override must be a model object");
      }

      return parsed;
    }

    const model = state.selectedModel ? deepClone(state.selectedModel) : {};

    writeTextField(model, "modelName", els.modelNameInput.value);

    const yearText = toText(els.yearInput.value);
    if (yearText) {
      const year = Number(yearText);
      if (!Number.isFinite(year)) {
        throw new Error("Year must be a number");
      }

      model.year = Math.round(year);
    } else {
      delete model.year;
    }

    writeTextField(model, "osProfileId", els.osProfileInput.value);
    writeTextField(model, "panelType", els.panelTypeInput.value);
    writeArrayField(model, "availableSizes", parseCsv(els.availableSizesInput.value));
    writeArrayField(model, "aliases", parseCsv(els.aliasesInput.value));
    writeArrayField(model, "apps", parseLines(els.appsInput.value));

    writeTextField(model, "audioChannels", els.audioChannelsInput.value);
    writeTextField(model, "audioPower", els.audioPowerInput.value);
    writeTextField(model, "wifiStandard", els.wifiInput.value);
    writeTextField(model, "bluetoothVersion", els.bluetoothInput.value);
    writeTextField(model, "vrrMaxRefreshRate", els.vrrInput.value);

    model.specs = ensureObject(model.specs);
    writeTextField(model.specs, "chassis", els.chassisInput.value);
    writeTextField(model.specs, "stand", els.standInput.value);
    if (Object.keys(model.specs).length === 0) {
      delete model.specs;
    }

    model.features = ensureObject(model.features);
    writeTextField(model.features, "ambilight", els.featureAmbilightInput.value);
    writeArrayField(model.features, "video", parseLines(els.featureVideoInput.value));
    writeArrayField(model.features, "audio", parseLines(els.featureAudioInput.value));
    writeArrayField(model.features, "gaming", parseLines(els.featureGamingInput.value));
    writeArrayField(model.features, "smart", parseLines(els.featureSmartInput.value));
    if (Object.keys(model.features).length === 0) {
      delete model.features;
    }

    return model;
  }

  function fillFormFromModel(model) {
    const item = model || {};
    const specs = ensureObject(item.specs);
    const features = ensureObject(item.features);

    els.modelNameInput.value = toText(item.modelName);
    els.yearInput.value = toText(item.year);
    els.osProfileInput.value = toText(item.osProfileId);
    els.panelTypeInput.value = toText(item.panelType);
    els.availableSizesInput.value = Array.isArray(item.availableSizes) ? item.availableSizes.join(", ") : "";
    els.aliasesInput.value = Array.isArray(item.aliases) ? item.aliases.join(", ") : "";

    els.chassisInput.value = toText(specs.chassis);
    els.standInput.value = toText(specs.stand);

    els.audioChannelsInput.value = toText(item.audioChannels);
    els.audioPowerInput.value = toText(item.audioPower);
    els.vrrInput.value = toText(item.vrrMaxRefreshRate);
    els.wifiInput.value = toText(item.wifiStandard);
    els.bluetoothInput.value = toText(item.bluetoothVersion);

    els.featureAmbilightInput.value = toText(features.ambilight);
    els.featureVideoInput.value = toLines(features.video);
    els.featureAudioInput.value = toLines(features.audio);
    els.featureGamingInput.value = toLines(features.gaming);
    els.featureSmartInput.value = toLines(features.smart);

    els.appsInput.value = toLines(item.apps);
    els.jsonOverrideInput.value = "";
    els.unsetPathInput.value = "";
  }

  function clearForm() {
    state.selectedModel = null;
    state.selectedKey = "";
    els.modelForm.reset();
    setStatus(els.editorStatus, "Creating a new model.", "");
    renderModelList(filterModels());
  }

  async function loadModels() {
    const response = await api("/api/admin/models");
    if (response.status === 401) {
      throw new Error("Session expired. Please login again.");
    }

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.message || "Failed to load models");
    }

    state.models = Array.isArray(data.items) ? data.items : [];
    const filtered = filterModels();
    renderModelList(filtered);
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setStatus(els.loginStatus, "Signing in...", "");

    try {
      const response = await api("/api/admin/login", {
        method: "POST",
        body: {
          username: els.usernameInput.value,
          password: els.passwordInput.value
        }
      }, false);

      const data = await response.json();
      if (!response.ok || !data.ok || !data.token) {
        throw new Error(data.message || "Login failed");
      }

      state.token = data.token;
      localStorage.setItem(storageTokenKey, state.token);
      setLoggedInUi(true);
      setStatus(els.loginStatus, "", "");
      await loadModels();
      clearForm();
      setStatus(els.editorStatus, "Logged in successfully.", "success");
    } catch (error) {
      setStatus(els.loginStatus, error.message || "Login failed", "error");
    }
  }

  async function bootstrapSession() {
    if (!state.token) {
      setLoggedInUi(false);
      return;
    }

    try {
      const response = await api("/api/admin/session");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error("Session invalid");
      }

      setLoggedInUi(true);
      await loadModels();
      clearForm();
      setStatus(els.editorStatus, "Session restored.", "success");
    } catch (_error) {
      localStorage.removeItem(storageTokenKey);
      state.token = "";
      setLoggedInUi(false);
      setStatus(els.loginStatus, "Session expired. Please login.", "error");
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setStatus(els.editorStatus, "Saving model...", "");

    try {
      const payload = buildModelFromForm();
      const hasSelected = Boolean(state.selectedModel && state.selectedModel.modelName);
      const endpoint = hasSelected
        ? "/api/admin/models/" + encodeURIComponent(state.selectedModel.modelName)
        : "/api/admin/models";
      const method = hasSelected ? "PUT" : "POST";

      const response = await api(endpoint, {
        method,
        body: {
          model: payload
        }
      });

      const data = await response.json();
      if (!response.ok || !data.ok || !data.item) {
        throw new Error(data.message || "Save failed");
      }

      state.selectedModel = deepClone(data.item);
      state.selectedKey = toText(data.item.modelName);
      fillFormFromModel(state.selectedModel);
      await loadModels();
      setStatus(els.editorStatus, "Model saved.", "success");
    } catch (error) {
      setStatus(els.editorStatus, error.message || "Save failed", "error");
    }
  }

  async function handleDeleteModel() {
    if (!state.selectedModel || !state.selectedModel.modelName) {
      setStatus(els.editorStatus, "Select a model to delete.", "error");
      return;
    }

    const confirmed = window.confirm("Delete model " + state.selectedModel.modelName + "?");
    if (!confirmed) {
      return;
    }

    setStatus(els.editorStatus, "Deleting model...", "");

    try {
      const response = await api("/api/admin/models/" + encodeURIComponent(state.selectedModel.modelName), {
        method: "DELETE"
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Delete failed");
      }

      clearForm();
      await loadModels();
      setStatus(els.editorStatus, "Model deleted.", "success");
    } catch (error) {
      setStatus(els.editorStatus, error.message || "Delete failed", "error");
    }
  }

  async function handleUnsetField() {
    if (!state.selectedModel || !state.selectedModel.modelName) {
      setStatus(els.editorStatus, "Select a model first.", "error");
      return;
    }

    const path = toText(els.unsetPathInput.value);
    if (!path) {
      setStatus(els.editorStatus, "Provide a field path to delete.", "error");
      return;
    }

    setStatus(els.editorStatus, "Deleting field path...", "");

    try {
      const response = await api("/api/admin/models/" + encodeURIComponent(state.selectedModel.modelName) + "/unset", {
        method: "PATCH",
        body: {
          unsetPaths: [path]
        }
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Delete field failed");
      }

      state.selectedModel = deepClone(data.item);
      fillFormFromModel(state.selectedModel);
      await loadModels();
      setStatus(els.editorStatus, data.removed && data.removed.length > 0 ? "Field removed." : "Path not found.", "success");
    } catch (error) {
      setStatus(els.editorStatus, error.message || "Delete field failed", "error");
    }
  }

  function handleLogout() {
    localStorage.removeItem(storageTokenKey);
    state.token = "";
    state.models = [];
    clearForm();
    setLoggedInUi(false);
    setStatus(els.loginStatus, "Logged out.", "");
  }

  function bindEvents() {
    els.loginForm.addEventListener("submit", handleLoginSubmit);
    els.modelForm.addEventListener("submit", handleSave);
    els.deleteBtn.addEventListener("click", handleDeleteModel);
    els.unsetFieldBtn.addEventListener("click", handleUnsetField);
    els.refreshBtn.addEventListener("click", async () => {
      try {
        await loadModels();
        setStatus(els.editorStatus, "List refreshed.", "success");
      } catch (error) {
        setStatus(els.editorStatus, error.message || "Refresh failed", "error");
      }
    });

    els.newModelBtn.addEventListener("click", clearForm);
    els.logoutBtn.addEventListener("click", handleLogout);
    els.searchInput.addEventListener("input", () => renderModelList(filterModels()));
  }

  bindEvents();
  bootstrapSession();
})();
