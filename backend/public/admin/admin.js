(() => {
  const storageTokenKey = "callcenter-admin-token";

  const state = {
    token: localStorage.getItem(storageTokenKey) || "",
    models: [],
    selectedModel: null,
    selectedBundle: null,
    selectedKey: "",
    activeTab: "specs"
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
    editorTabs: Array.from(document.querySelectorAll(".editor-tab")),
    editorPanes: Array.from(document.querySelectorAll(".editor-pane")),

    modelNameInput: document.getElementById("modelNameInput"),
    yearInput: document.getElementById("yearInput"),
    osProfileInput: document.getElementById("osProfileInput"),
    panelTypeInput: document.getElementById("panelTypeInput"),
    availableSizesInput: document.getElementById("availableSizesInput"),
    aliasesInput: document.getElementById("aliasesInput"),

    platformInput: document.getElementById("platformInput"),
    chassisInput: document.getElementById("chassisInput"),
    vesaInput: document.getElementById("vesaInput"),
    standInput: document.getElementById("standInput"),

    audioChannelsInput: document.getElementById("audioChannelsInput"),
    audioPowerInput: document.getElementById("audioPowerInput"),
    vrrInput: document.getElementById("vrrInput"),
    wifiInput: document.getElementById("wifiInput"),
    bluetoothInput: document.getElementById("bluetoothInput"),

    featureAmbilightInput: document.getElementById("featureAmbilightInput"),
    featureVideoInput: document.getElementById("featureVideoInput"),
    featureAudioInput: document.getElementById("featureAudioInput"),
    featureGamingInput: document.getElementById("featureGamingInput"),
    featureSmartInput: document.getElementById("featureSmartInput"),
    appsInput: document.getElementById("appsInput"),

    dimWithStandInput: document.getElementById("dimWithStandInput"),
    dimWithoutStandInput: document.getElementById("dimWithoutStandInput"),
    dimWeightWithoutInput: document.getElementById("dimWeightWithoutInput"),
    dimWeightWithInput: document.getElementById("dimWeightWithInput"),
    vesaScrewTypeInput: document.getElementById("vesaScrewTypeInput"),
    vesaScrewLengthInput: document.getElementById("vesaScrewLengthInput"),

    pageUrlInput: document.getElementById("pageUrlInput"),
    frontImageInput: document.getElementById("frontImageInput"),
    sideImageInput: document.getElementById("sideImageInput"),
    remoteImageInput: document.getElementById("remoteImageInput"),
    portsImageInput: document.getElementById("portsImageInput"),

    documentationModelCodeInput: document.getElementById("documentationModelCodeInput"),
    documentationLinksInput: document.getElementById("documentationLinksInput"),

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

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function ensureObject(value) {
    if (isPlainObject(value)) {
      return value;
    }

    return {};
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

  function parseDocumentationLinks(text) {
    const rows = parseLines(text);
    return rows
      .map((row) => {
        const separatorIndex = row.indexOf("|");
        if (separatorIndex <= 0) {
          return null;
        }

        const label = toText(row.slice(0, separatorIndex));
        const url = toText(row.slice(separatorIndex + 1));
        if (!label || !url) {
          return null;
        }

        return { label, url };
      })
      .filter(Boolean);
  }

  function formatDocumentationLinks(links) {
    if (!Array.isArray(links)) {
      return "";
    }

    return links
      .map((entry) => {
        if (!isPlainObject(entry)) {
          return "";
        }

        const label = toText(entry.label);
        const url = toText(entry.url);
        if (!label || !url) {
          return "";
        }

        return label + " | " + url;
      })
      .filter(Boolean)
      .join("\n");
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

  function setLoggedInUi(isLoggedIn) {
    els.loginSection.classList.toggle("hidden", isLoggedIn);
    els.adminSection.classList.toggle("hidden", !isLoggedIn);
  }

  function setActiveTab(tabName) {
    const target = toText(tabName) || "specs";
    state.activeTab = target;

    els.editorTabs.forEach((button) => {
      const tab = toText(button.dataset.tab);
      button.classList.toggle("is-active", tab === target);
    });

    els.editorPanes.forEach((pane) => {
      const tab = toText(pane.dataset.pane);
      pane.classList.toggle("hidden", tab !== target);
    });
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
        const year = toText(model && model.year);
        const panel = toText(model && model.panelType);
        const isActive = activeKey && modelName.toUpperCase() === activeKey;

        return ""
          + "<button class=\"model-item " + (isActive ? "active" : "") + "\" data-model=\"" + encodeURIComponent(modelName) + "\" type=\"button\">"
          + "<div class=\"model-name\">" + (modelName || "(no name)") + "</div>"
          + "<div class=\"model-meta\">" + (year || "-") + " | " + (panel || "-") + "</div>"
          + "</button>";
      })
      .join("");

    Array.from(els.modelsList.querySelectorAll(".model-item")).forEach((button) => {
      button.addEventListener("click", async () => {
        const selectedModelName = decodeURIComponent(button.dataset.model || "");
        await loadModelBundle(selectedModelName);
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

  function getDimensionValue(model, keyLabel) {
    const specs = ensureObject(model && model.specs);
    const technicalFlat = ensureObject(specs.technicalFlat);
    const technicalByCategory = ensureObject(specs.technicalByCategory);
    const dimensions = ensureObject(technicalByCategory.Dimensions);

    const flatKey = "Dimensions :: " + keyLabel;
    return toText(technicalFlat[flatKey]) || toText(dimensions[keyLabel]);
  }

  function fillFormFromBundle(bundle) {
    const model = ensureObject(bundle && bundle.model);
    const media = ensureObject(bundle && bundle.media);
    const documentation = ensureObject(bundle && bundle.documentation);
    const platformChassis = ensureObject(bundle && bundle.platformChassis);

    state.selectedBundle = deepClone(bundle);
    state.selectedModel = deepClone(model);
    state.selectedKey = toText(model.modelName);

    const specs = ensureObject(model.specs);
    const features = ensureObject(model.features);

    els.modelNameInput.value = toText(model.modelName);
    els.yearInput.value = toText(model.year);
    els.osProfileInput.value = toText(model.osProfileId);
    els.panelTypeInput.value = toText(model.panelType);
    els.availableSizesInput.value = Array.isArray(model.availableSizes) ? model.availableSizes.join(", ") : "";
    els.aliasesInput.value = Array.isArray(model.aliases) ? model.aliases.join(", ") : "";

    els.platformInput.value = toText(platformChassis.platform);
    els.chassisInput.value = toText(platformChassis.chassis) || toText(specs.chassis);
    els.vesaInput.value = toText(specs.vesa);
    els.standInput.value = toText(specs.stand);

    els.audioChannelsInput.value = toText(model.audioChannels);
    els.audioPowerInput.value = toText(model.audioPower);
    els.vrrInput.value = toText(model.vrrMaxRefreshRate);
    els.wifiInput.value = toText(model.wifiStandard);
    els.bluetoothInput.value = toText(model.bluetoothVersion);

    els.featureAmbilightInput.value = toText(features.ambilight);
    els.featureVideoInput.value = toLines(features.video);
    els.featureAudioInput.value = toLines(features.audio);
    els.featureGamingInput.value = toLines(features.gaming);
    els.featureSmartInput.value = toLines(features.smart);
    els.appsInput.value = toLines(model.apps);

    els.dimWithStandInput.value = getDimensionValue(model, "TV with stand (W x H x D)");
    els.dimWithoutStandInput.value = getDimensionValue(model, "TV without stand (W x H x D)");
    els.dimWeightWithoutInput.value = getDimensionValue(model, "Weight of TV without stand");
    els.dimWeightWithInput.value = getDimensionValue(model, "Weight of TV with stand");
    els.vesaScrewTypeInput.value = toText(specs.vesaScrewType);
    els.vesaScrewLengthInput.value = toText(specs.vesaScrewLengthMm);

    els.pageUrlInput.value = toText(media.pageUrl);
    els.frontImageInput.value = toText(media.frontImageUrl);
    els.sideImageInput.value = toText(media.sideImageUrl);
    els.remoteImageInput.value = toText(media.remoteImageUrl);
    els.portsImageInput.value = toText(media.portsImageUrl);

    els.documentationModelCodeInput.value = toText(documentation.modelCode);
    els.documentationLinksInput.value = formatDocumentationLinks(documentation.links);

    els.jsonOverrideInput.value = "";
    els.unsetPathInput.value = "";

    renderModelList(filterModels());
  }

  function clearForm() {
    state.selectedModel = null;
    state.selectedBundle = null;
    state.selectedKey = "";
    els.modelForm.reset();
    setActiveTab("specs");
    setStatus(els.editorStatus, "Creating a new model.", "");
    renderModelList(filterModels());
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

  function writeDimensionField(specs, label, value) {
    const technicalByCategory = ensureObject(specs.technicalByCategory);
    const dimensions = ensureObject(technicalByCategory.Dimensions);
    const technicalFlat = ensureObject(specs.technicalFlat);

    const normalized = toText(value);
    const flatKey = "Dimensions :: " + label;

    if (normalized) {
      dimensions[label] = normalized;
      technicalFlat[flatKey] = normalized;
    } else {
      delete dimensions[label];
      delete technicalFlat[flatKey];
    }

    if (Object.keys(dimensions).length > 0) {
      technicalByCategory.Dimensions = dimensions;
    } else {
      delete technicalByCategory.Dimensions;
    }

    if (Object.keys(technicalByCategory).length > 0) {
      specs.technicalByCategory = technicalByCategory;
    } else {
      delete specs.technicalByCategory;
    }

    if (Object.keys(technicalFlat).length > 0) {
      specs.technicalFlat = technicalFlat;
    } else {
      delete specs.technicalFlat;
    }
  }

  function buildModelFromForm() {
    const overrideText = toText(els.jsonOverrideInput.value);
    if (overrideText) {
      const parsed = JSON.parse(overrideText);
      if (!isPlainObject(parsed)) {
        throw new Error("JSON override must be a model object");
      }

      return parsed;
    }

    const model = state.selectedModel ? deepClone(state.selectedModel) : {};

    writeTextField(model, "modelName", els.modelNameInput.value);

    const yearText = toText(els.yearInput.value);
    if (yearText) {
      const parsedYear = Number(yearText);
      if (!Number.isFinite(parsedYear)) {
        throw new Error("Year must be a number");
      }
      model.year = Math.round(parsedYear);
    } else {
      delete model.year;
    }

    writeTextField(model, "osProfileId", els.osProfileInput.value);
    writeTextField(model, "panelType", els.panelTypeInput.value);
    writeArrayField(model, "availableSizes", parseCsv(els.availableSizesInput.value));
    writeArrayField(model, "aliases", parseCsv(els.aliasesInput.value));

    writeTextField(model, "audioChannels", els.audioChannelsInput.value);
    writeTextField(model, "audioPower", els.audioPowerInput.value);
    writeTextField(model, "vrrMaxRefreshRate", els.vrrInput.value);
    writeTextField(model, "wifiStandard", els.wifiInput.value);
    writeTextField(model, "bluetoothVersion", els.bluetoothInput.value);

    model.features = ensureObject(model.features);
    writeTextField(model.features, "ambilight", els.featureAmbilightInput.value);
    writeArrayField(model.features, "video", parseLines(els.featureVideoInput.value));
    writeArrayField(model.features, "audio", parseLines(els.featureAudioInput.value));
    writeArrayField(model.features, "gaming", parseLines(els.featureGamingInput.value));
    writeArrayField(model.features, "smart", parseLines(els.featureSmartInput.value));
    if (Object.keys(model.features).length === 0) {
      delete model.features;
    }

    writeArrayField(model, "apps", parseLines(els.appsInput.value));

    model.specs = ensureObject(model.specs);
    writeTextField(model.specs, "stand", els.standInput.value);
    writeTextField(model.specs, "chassis", els.chassisInput.value);
    writeTextField(model.specs, "vesa", els.vesaInput.value);
    writeTextField(model.specs, "vesaScrewType", els.vesaScrewTypeInput.value);
    writeTextField(model.specs, "vesaScrewLengthMm", els.vesaScrewLengthInput.value);

    writeDimensionField(model.specs, "TV with stand (W x H x D)", els.dimWithStandInput.value);
    writeDimensionField(model.specs, "TV without stand (W x H x D)", els.dimWithoutStandInput.value);
    writeDimensionField(model.specs, "Weight of TV without stand", els.dimWeightWithoutInput.value);
    writeDimensionField(model.specs, "Weight of TV with stand", els.dimWeightWithInput.value);

    if (Object.keys(model.specs).length === 0) {
      delete model.specs;
    }

    return model;
  }

  function buildBundlePayload() {
    const model = buildModelFromForm();

    const media = {
      pageUrl: toText(els.pageUrlInput.value),
      frontImageUrl: toText(els.frontImageInput.value),
      sideImageUrl: toText(els.sideImageInput.value),
      remoteImageUrl: toText(els.remoteImageInput.value),
      portsImageUrl: toText(els.portsImageInput.value)
    };

    const documentation = {
      modelCode: toText(els.documentationModelCodeInput.value) || toText(model.modelName),
      links: parseDocumentationLinks(els.documentationLinksInput.value)
    };

    const platformChassis = {
      year: model.year,
      modelName: toText(model.modelName),
      platform: toText(els.platformInput.value),
      chassis: toText(els.chassisInput.value)
    };

    return {
      model,
      media,
      documentation,
      platformChassis
    };
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
    renderModelList(filterModels());
  }

  async function loadModelBundle(modelName) {
    try {
      setStatus(els.editorStatus, "Loading model bundle...", "");
      const response = await api("/api/admin/model-bundle/" + encodeURIComponent(modelName));
      const data = await response.json();
      if (!response.ok || !data.ok || !isPlainObject(data.bundle)) {
        throw new Error(data.message || "Failed to load model details");
      }

      fillFormFromBundle(data.bundle);
      setStatus(els.editorStatus, "Model loaded.", "success");
    } catch (error) {
      setStatus(els.editorStatus, error.message || "Could not load model details.", "error");
    }
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
    setStatus(els.editorStatus, "Saving all sections...", "");

    try {
      const payload = buildBundlePayload();
      const hasSelectedModel = Boolean(state.selectedKey);
      const method = hasSelectedModel ? "PUT" : "POST";
      const path = hasSelectedModel
        ? "/api/admin/model-bundle/" + encodeURIComponent(state.selectedKey)
        : "/api/admin/model-bundle";

      const response = await api(path, {
        method,
        body: payload
      });

      const data = await response.json();
      if (!response.ok || !data.ok || !isPlainObject(data.bundle)) {
        throw new Error(data.message || "Save failed");
      }

      fillFormFromBundle(data.bundle);
      await loadModels();
      setStatus(els.editorStatus, "Model, dimensions, images and docs saved.", "success");
    } catch (error) {
      setStatus(els.editorStatus, error.message || "Save failed", "error");
    }
  }

  async function handleDeleteModel() {
    if (!state.selectedKey) {
      setStatus(els.editorStatus, "Select a model to delete.", "error");
      return;
    }

    const confirmed = window.confirm("Delete whole model " + state.selectedKey + " including linked admin data?");
    if (!confirmed) {
      return;
    }

    setStatus(els.editorStatus, "Deleting model...", "");

    try {
      const response = await api("/api/admin/models/" + encodeURIComponent(state.selectedKey), {
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
    if (!state.selectedKey) {
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
      const response = await api("/api/admin/models/" + encodeURIComponent(state.selectedKey) + "/unset", {
        method: "PATCH",
        body: {
          unsetPaths: [path]
        }
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Delete field failed");
      }

      await loadModelBundle(state.selectedKey);
      setStatus(els.editorStatus, (data.removed && data.removed.length > 0) ? "Field removed." : "Path not found.", "success");
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

    els.editorTabs.forEach((button) => {
      button.addEventListener("click", () => {
        const tabName = toText(button.dataset.tab);
        setActiveTab(tabName);
      });
    });
  }

  bindEvents();
  setActiveTab("specs");
  bootstrapSession();
})();
