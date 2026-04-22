const path = require("node:path");
const express = require("express");
const cors = require("cors");
const { loadBootstrapData } = require("./loadJsData");
const { applyMirroredMediaUrls } = require("./mediaMirror");
const { issueAdminToken, requireAdminAuth, validateCredentials } = require("./adminAuth");
const {
  applyUnsetPaths,
  deleteModel,
  findModelIndex,
  loadModelsData,
  saveModelsData,
  setModel,
  toText
} = require("./modelsAdminStore");

const app = express();
const port = Number(process.env.PORT || 4000);
const projectRoot = path.resolve(__dirname, "..", "..");
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";

function buildCorsOriginRule(value) {
  const raw = String(value || "").trim();
  if (!raw || raw === "*") {
    return "*";
  }

  const origins = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    return "*";
  }

  return origins;
}

app.use(cors({ origin: buildCorsOriginRule(allowedOrigin) }));
app.use(express.json({ limit: "2mb" }));
app.use("/media", express.static(path.join(__dirname, "..", "public", "media")));
app.use("/admin", express.static(path.join(__dirname, "..", "public", "admin")));

function asHttpError(error) {
  const message = error && error.message ? String(error.message) : "Unknown error";
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("not found")) {
    return { status: 404, code: "NOT_FOUND", message };
  }

  if (lowerMessage.includes("exists") || lowerMessage.includes("already") || lowerMessage.includes("conflict")) {
    return { status: 409, code: "CONFLICT", message };
  }

  return { status: 400, code: "BAD_REQUEST", message };
}

function sortedModels(models) {
  return [...models].sort((a, b) => {
    const yearA = Number(a && a.year) || 0;
    const yearB = Number(b && b.year) || 0;
    if (yearA !== yearB) {
      return yearB - yearA;
    }

    return String(a && a.modelName || "").localeCompare(String(b && b.modelName || ""));
  });
}

function getPublicBaseUrl(req) {
  const forwardedProtoRaw = String(req.headers["x-forwarded-proto"] || "").trim();
  const forwardedProto = forwardedProtoRaw ? forwardedProtoRaw.split(",")[0].trim() : "";
  const protocol = forwardedProto || req.protocol || "https";
  return protocol + "://" + req.get("host");
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "callcenter-backend" });
});

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "callcenter-backend",
    message: "Backend is running. Use /health or /api/bootstrap.",
    endpoints: [
      "/health",
      "/api/bootstrap",
      "/api/models",
      "/api/knowledge",
      "/api/policies",
      "/api/changelog",
      "/api/documentation-links"
    ]
  });
});

app.get("/api/bootstrap", (req, res) => {
  try {
    const data = loadBootstrapData(projectRoot);
    res.json({
      ...data,
      ModelMediaData: applyMirroredMediaUrls(data.ModelMediaData, getPublicBaseUrl(req))
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "BOOTSTRAP_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.get("/api/models", (req, res) => {
  try {
    const data = loadBootstrapData(projectRoot);
    res.json({
      ok: true,
      ModelsData: data.ModelsData || [],
      ModelPlatformChassisData: data.ModelPlatformChassisData || [],
      ModelMediaData: applyMirroredMediaUrls(data.ModelMediaData, getPublicBaseUrl(req)) || {}
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "MODELS_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.get("/api/knowledge", (_req, res) => {
  try {
    const data = loadBootstrapData(projectRoot);
    res.json({
      ok: true,
      KnowledgeBaseData: data.KnowledgeBaseData || [],
      TroubleshootingData: data.TroubleshootingData || {}
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "KNOWLEDGE_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.get("/api/policies", (_req, res) => {
  try {
    const data = loadBootstrapData(projectRoot);
    res.json({
      ok: true,
      PoliciesData: data.PoliciesData || {}
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "POLICIES_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.get("/api/changelog", (_req, res) => {
  try {
    const data = loadBootstrapData(projectRoot);
    res.json({
      ok: true,
      ChangelogEntriesData: data.ChangelogEntriesData || []
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "CHANGELOG_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.get("/api/documentation-links", (_req, res) => {
  try {
    const data = loadBootstrapData(projectRoot);
    res.json({
      ok: true,
      DocumentationLinksData: data.DocumentationLinksData || {}
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "DOCUMENTATION_LINKS_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.post("/api/admin/login", (req, res) => {
  const username = toText(req.body && req.body.username);
  const password = toText(req.body && req.body.password);

  if (!validateCredentials(username, password)) {
    res.status(401).json({
      ok: false,
      error: "ADMIN_LOGIN_FAILED",
      message: "Invalid admin credentials"
    });
    return;
  }

  const token = issueAdminToken(username);
  res.json({
    ok: true,
    token,
    user: {
      username
    }
  });
});

app.get("/api/admin/session", requireAdminAuth, (req, res) => {
  res.json({
    ok: true,
    user: req.adminUser
  });
});

app.get("/api/admin/models", requireAdminAuth, (req, res) => {
  try {
    const queryText = toText(req.query && req.query.q).toLowerCase();
    const models = sortedModels(loadModelsData(projectRoot));
    const filtered = queryText
      ? models.filter((model) => String(model && model.modelName || "").toLowerCase().includes(queryText))
      : models;

    res.json({
      ok: true,
      count: filtered.length,
      items: filtered
    });
  } catch (error) {
    const mapped = asHttpError(error);
    res.status(mapped.status).json({
      ok: false,
      error: mapped.code,
      message: mapped.message
    });
  }
});

app.get("/api/admin/models/:modelName", requireAdminAuth, (req, res) => {
  try {
    const modelName = toText(req.params.modelName);
    const models = loadModelsData(projectRoot);
    const index = findModelIndex(models, modelName);

    if (index < 0) {
      res.status(404).json({
        ok: false,
        error: "NOT_FOUND",
        message: "Model not found"
      });
      return;
    }

    res.json({
      ok: true,
      item: models[index]
    });
  } catch (error) {
    const mapped = asHttpError(error);
    res.status(mapped.status).json({
      ok: false,
      error: mapped.code,
      message: mapped.message
    });
  }
});

app.post("/api/admin/models", requireAdminAuth, (req, res) => {
  try {
    const incoming = req.body && req.body.model;
    const models = loadModelsData(projectRoot);
    const result = setModel(models, "", incoming);
    saveModelsData(projectRoot, models);

    res.status(201).json({
      ok: true,
      action: result.action,
      item: result.model
    });
  } catch (error) {
    const mapped = asHttpError(error);
    res.status(mapped.status).json({
      ok: false,
      error: mapped.code,
      message: mapped.message
    });
  }
});

app.put("/api/admin/models/:modelName", requireAdminAuth, (req, res) => {
  try {
    const modelName = toText(req.params.modelName);
    const incoming = req.body && req.body.model;
    const models = loadModelsData(projectRoot);
    const result = setModel(models, modelName, incoming);
    saveModelsData(projectRoot, models);

    res.json({
      ok: true,
      action: result.action,
      item: result.model
    });
  } catch (error) {
    const mapped = asHttpError(error);
    res.status(mapped.status).json({
      ok: false,
      error: mapped.code,
      message: mapped.message
    });
  }
});

app.patch("/api/admin/models/:modelName/unset", requireAdminAuth, (req, res) => {
  try {
    const modelName = toText(req.params.modelName);
    const unsetPaths = Array.isArray(req.body && req.body.unsetPaths)
      ? req.body.unsetPaths
      : [];

    const models = loadModelsData(projectRoot);
    const index = findModelIndex(models, modelName);
    if (index < 0) {
      res.status(404).json({
        ok: false,
        error: "NOT_FOUND",
        message: "Model not found"
      });
      return;
    }

    const item = models[index];
    const result = applyUnsetPaths(item, unsetPaths);
    saveModelsData(projectRoot, models);

    res.json({
      ok: true,
      removed: result.removed,
      item
    });
  } catch (error) {
    const mapped = asHttpError(error);
    res.status(mapped.status).json({
      ok: false,
      error: mapped.code,
      message: mapped.message
    });
  }
});

app.delete("/api/admin/models/:modelName", requireAdminAuth, (req, res) => {
  try {
    const modelName = toText(req.params.modelName);
    const models = loadModelsData(projectRoot);
    const removed = deleteModel(models, modelName);

    if (!removed) {
      res.status(404).json({
        ok: false,
        error: "NOT_FOUND",
        message: "Model not found"
      });
      return;
    }

    saveModelsData(projectRoot, models);

    res.json({
      ok: true,
      removed
    });
  } catch (error) {
    const mapped = asHttpError(error);
    res.status(mapped.status).json({
      ok: false,
      error: mapped.code,
      message: mapped.message
    });
  }
});

app.listen(port, () => {
  console.log("CallCenter backend listening on http://localhost:" + String(port));
});
