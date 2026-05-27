const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const express = require("express");
const cors = require("cors");
const { loadBootstrapData } = require("./loadJsData");
const { applyMirroredMediaUrls } = require("./mediaMirror");
const { issueAdminToken, requireAdminAuth, validateCredentials } = require("./adminAuth");
const {
  applyUnsetPaths,
  deleteModel,
  findModelIndex,
  loadDocumentationLinksData,
  loadModelMediaData,
  loadModelPlatformChassisData,
  loadModelsData,
  saveDocumentationLinksData,
  saveModelMediaData,
  saveModelPlatformChassisData,
  saveModelsData,
  setModel,
  toText
} = require("./modelsAdminStore");

const app = express();
const port = Number(process.env.PORT || 4000);
const projectRoot = path.resolve(__dirname, "..", "..");
const imageProxyCacheDir = path.join(projectRoot, ".cache", "image-proxy");
const IMAGE_PROXY_MAX_CACHE_BYTES = Number(process.env.IMAGE_PROXY_MAX_CACHE_BYTES || 200 * 1024 * 1024); // 200MB default
const IMAGE_PROXY_RATE_LIMIT_REQS = Number(process.env.IMAGE_PROXY_RATE_LIMIT_REQS || 120); // requests per window
const IMAGE_PROXY_RATE_LIMIT_WINDOW_MS = Number(process.env.IMAGE_PROXY_RATE_LIMIT_WINDOW_MS || 60 * 1000); // 1 minute
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";

fs.mkdirSync(imageProxyCacheDir, { recursive: true });

// Simple in-memory rate limiter per IP for the image proxy endpoint.
const _imageProxyRateMap = new Map(); // ip -> { windowStart, count }
function rateLimitImageProxy(req, res) {
  try {
    const ip = String(req.ip || req.connection && req.connection.remoteAddress || "unknown");
    const now = Date.now();
    const record = _imageProxyRateMap.get(ip) || { windowStart: now, count: 0 };
    if (now - record.windowStart > IMAGE_PROXY_RATE_LIMIT_WINDOW_MS) {
      record.windowStart = now;
      record.count = 0;
    }
    record.count = (record.count || 0) + 1;
    _imageProxyRateMap.set(ip, record);
    if (record.count > IMAGE_PROXY_RATE_LIMIT_REQS) {
      res.status(429).json({ ok: false, error: "RATE_LIMIT_EXCEEDED", message: "Too many requests, slow down" });
      return false;
    }
    return true;
  } catch (e) {
    return true; // fail open on unexpected errors
  }
}

// Cache management helpers
function listCacheEntries() {
  try {
    const files = fs.readdirSync(imageProxyCacheDir).filter((f) => f.endsWith(".bin"));
    return files.map((bin) => {
      const key = bin.replace(/\.bin$/, "");
      const filePath = path.join(imageProxyCacheDir, bin);
      const metaPath = path.join(imageProxyCacheDir, key + ".json");
      let stat = null;
      try {
        stat = fs.statSync(filePath);
      } catch (_e) {
        return null;
      }
      return { key, filePath, metaPath, size: stat.size, mtimeMs: stat.mtimeMs };
    }).filter(Boolean);
  } catch (e) {
    return [];
  }
}

function getTotalCacheSize() {
  try {
    return listCacheEntries().reduce((sum, e) => sum + (e.size || 0), 0);
  } catch (_e) {
    return 0;
  }
}

function enforceCacheSizeLimit() {
  try {
    const maxBytes = Math.max(0, Number(IMAGE_PROXY_MAX_CACHE_BYTES || 0));
    if (!maxBytes || maxBytes <= 0) return;
    let entries = listCacheEntries();
    let total = entries.reduce((s, e) => s + (e.size || 0), 0);
    if (total <= maxBytes) return;

    // Sort by oldest first (mtime ascending) and remove until under limit
    entries = entries.sort((a, b) => (a.mtimeMs || 0) - (b.mtimeMs || 0));
    for (const e of entries) {
      try {
        fs.unlinkSync(e.filePath);
      } catch (_err) {}
      try {
        fs.unlinkSync(e.metaPath);
      } catch (_err) {}
      total -= e.size || 0;
      if (total <= maxBytes) break;
    }
  } catch (e) {
    // swallow errors
  }
}

function removeCacheKey(cacheKey) {
  const paths = buildCachedImagePaths(cacheKey);
  try { if (fs.existsSync(paths.filePath)) fs.unlinkSync(paths.filePath); } catch (e) {}
  try { if (fs.existsSync(paths.metaPath)) fs.unlinkSync(paths.metaPath); } catch (e) {}
}

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

function normalizeModelKey(value) {
  return toText(value).toUpperCase();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function findPlatformChassisIndex(rows, modelName) {
  const target = normalizeModelKey(modelName);
  if (!target) {
    return -1;
  }

  return rows.findIndex((row) => normalizeModelKey(row && row.modelName) === target);
}

function findDocumentationModelCode(documentationLinksData, model) {
  const manualsByModel = isPlainObject(documentationLinksData && documentationLinksData.manualsByModel)
    ? documentationLinksData.manualsByModel
    : {};

  const candidateNames = [
    toText(model && model.modelName),
    ...(Array.isArray(model && model.aliases) ? model.aliases.map((item) => toText(item)) : [])
  ].filter(Boolean);

  if (candidateNames.length === 0) {
    return "";
  }

  const keys = Object.keys(manualsByModel);
  for (const candidate of candidateNames) {
    const candidateUpper = normalizeModelKey(candidate);
    const exact = keys.find((key) => normalizeModelKey(key) === candidateUpper);
    if (exact) {
      return exact;
    }

    const prefix = keys.find((key) => normalizeModelKey(key).startsWith(candidateUpper + "/"));
    if (prefix) {
      return prefix;
    }
  }

  return "";
}

function sanitizeMediaEntry(rawValue) {
  const source = isPlainObject(rawValue) ? rawValue : {};
  return {
    pageUrl: toText(source.pageUrl),
    frontImageUrl: toText(source.frontImageUrl),
    sideImageUrl: toText(source.sideImageUrl),
    remoteImageUrl: toText(source.remoteImageUrl),
    portsImageUrl: toText(source.portsImageUrl)
  };
}

function sanitizeManualLinks(rawValue) {
  const items = Array.isArray(rawValue) ? rawValue : [];
  return items
    .map((entry) => {
      if (!isPlainObject(entry)) {
        return null;
      }

      const label = toText(entry.label);
      const url = toText(entry.url);
      if (!label || !url) {
        return null;
      }

      return { label, url };
    })
    .filter(Boolean);
}

function sanitizePlatformChassisEntry(rawValue, fallbackModelName, fallbackYear) {
  if (!isPlainObject(rawValue)) {
    return null;
  }

  const modelName = toText(rawValue.modelName) || toText(fallbackModelName);
  const platform = toText(rawValue.platform);
  const chassis = toText(rawValue.chassis);
  if (!modelName || (!platform && !chassis)) {
    return null;
  }

  const parsedYear = Number(rawValue.year);
  const year = Number.isFinite(parsedYear)
    ? Math.round(parsedYear)
    : Math.round(Number(fallbackYear) || new Date().getFullYear());

  return {
    year,
    modelName,
    platform,
    chassis
  };
}

function buildModelBundleResponse(model, mediaData, documentationLinksData, platformChassisRows) {
  const modelName = toText(model && model.modelName);
  const media = isPlainObject(mediaData && mediaData[modelName])
    ? mediaData[modelName]
    : {};

  const docsCode = findDocumentationModelCode(documentationLinksData, model);
  const manualsByModel = isPlainObject(documentationLinksData && documentationLinksData.manualsByModel)
    ? documentationLinksData.manualsByModel
    : {};
  const documentationLinks = Array.isArray(manualsByModel[docsCode]) ? manualsByModel[docsCode] : [];

  const platformIndex = findPlatformChassisIndex(platformChassisRows, modelName);
  const platformChassis = platformIndex >= 0 ? platformChassisRows[platformIndex] : null;

  return {
    model,
    media,
    documentation: {
      modelCode: docsCode || modelName,
      links: documentationLinks
    },
    platformChassis
  };
}

function saveModelBundle(projectRootPath, currentModelName, bundlePayload) {
  const payload = isPlainObject(bundlePayload) ? bundlePayload : {};
  const models = loadModelsData(projectRootPath);
  const mediaData = loadModelMediaData(projectRootPath);
  const documentationLinksData = loadDocumentationLinksData(projectRootPath);
  const platformChassisRows = loadModelPlatformChassisData(projectRootPath);

  const result = setModel(models, currentModelName, payload.model);
  const model = result.model;
  const newModelName = toText(model.modelName);
  const oldModelName = toText(currentModelName);

  if (oldModelName && normalizeModelKey(oldModelName) !== normalizeModelKey(newModelName)) {
    const oldMedia = mediaData[oldModelName];
    if (isPlainObject(oldMedia) && !isPlainObject(payload.media) && !mediaData[newModelName]) {
      mediaData[newModelName] = oldMedia;
    }
    delete mediaData[oldModelName];
  }

  if (Object.prototype.hasOwnProperty.call(payload, "media")) {
    const mediaEntry = sanitizeMediaEntry(payload.media);
    const hasAnyMediaValue = Object.values(mediaEntry).some(Boolean);
    if (hasAnyMediaValue) {
      mediaData[newModelName] = mediaEntry;
    } else {
      delete mediaData[newModelName];
    }
  }

  const manualsByModel = isPlainObject(documentationLinksData.manualsByModel)
    ? documentationLinksData.manualsByModel
    : {};
  documentationLinksData.manualsByModel = manualsByModel;

  const explicitDocsCode = toText(
    payload.documentationModelCode
    || (isPlainObject(payload.documentation) ? payload.documentation.modelCode : "")
  );
  const existingDocsCode = oldModelName
    ? findDocumentationModelCode(documentationLinksData, { modelName: oldModelName, aliases: [] })
    : "";
  const docsCode = explicitDocsCode || existingDocsCode || findDocumentationModelCode(documentationLinksData, model) || newModelName;

  if (oldModelName && normalizeModelKey(oldModelName) !== normalizeModelKey(newModelName)) {
    const oldDocsCode = findDocumentationModelCode(documentationLinksData, { modelName: oldModelName, aliases: [] });
    if (oldDocsCode && !explicitDocsCode && !manualsByModel[newModelName]) {
      manualsByModel[newModelName] = manualsByModel[oldDocsCode];
      delete manualsByModel[oldDocsCode];
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "documentation") || Object.prototype.hasOwnProperty.call(payload, "documentationLinks")) {
    const rawLinks = isPlainObject(payload.documentation)
      ? payload.documentation.links
      : payload.documentationLinks;
    const links = sanitizeManualLinks(rawLinks);
    if (links.length > 0) {
      manualsByModel[docsCode] = links;
    } else {
      delete manualsByModel[docsCode];
    }
  }

  const oldPlatformIndex = oldModelName ? findPlatformChassisIndex(platformChassisRows, oldModelName) : -1;
  if (oldPlatformIndex >= 0 && oldModelName && normalizeModelKey(oldModelName) !== normalizeModelKey(newModelName)) {
    platformChassisRows[oldPlatformIndex] = {
      ...platformChassisRows[oldPlatformIndex],
      modelName: newModelName
    };
  }

  if (Object.prototype.hasOwnProperty.call(payload, "platformChassis")) {
    const row = sanitizePlatformChassisEntry(payload.platformChassis, newModelName, model.year);
    const targetIndex = findPlatformChassisIndex(platformChassisRows, newModelName);

    if (!row) {
      if (targetIndex >= 0) {
        platformChassisRows.splice(targetIndex, 1);
      }
    } else if (targetIndex >= 0) {
      platformChassisRows[targetIndex] = row;
    } else {
      platformChassisRows.push(row);
    }
  }

  saveModelsData(projectRootPath, models);
  saveModelMediaData(projectRootPath, mediaData);
  saveDocumentationLinksData(projectRootPath, documentationLinksData);
  saveModelPlatformChassisData(projectRootPath, platformChassisRows);

  return {
    action: result.action,
    bundle: buildModelBundleResponse(model, mediaData, documentationLinksData, platformChassisRows)
  };
}

function getPublicBaseUrl(req) {
  const forwardedProtoRaw = String(req.headers["x-forwarded-proto"] || "").trim();
  const forwardedProto = forwardedProtoRaw ? forwardedProtoRaw.split(",")[0].trim() : "";
  const protocol = forwardedProto || req.protocol || "https";
  return protocol + "://" + req.get("host");
}

function buildProxyCacheKey(sourceUrl, width) {
  return crypto.createHash("sha256").update(String(sourceUrl || "") + "|" + String(width || "")).digest("hex");
}

function buildCachedImagePaths(cacheKey) {
  return {
    filePath: path.join(imageProxyCacheDir, cacheKey + ".bin"),
    metaPath: path.join(imageProxyCacheDir, cacheKey + ".json")
  };
}

function normalizeProxyWidth(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(320, Math.round(parsed));
}

function normalizeProxySourceUrl(rawUrl) {
  const candidate = String(rawUrl || "").trim();
  if (!candidate) {
    return null;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" || parsed.hostname !== "images.philips.com" || !parsed.pathname.startsWith("/is/image/")) {
      return null;
    }

    return parsed;
  } catch (_error) {
    return null;
  }
}

function respondWithCachedImage(res, filePath, metaPath, cacheKey) {
  let contentType = "image/jpeg";

  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    if (meta && typeof meta.contentType === "string" && meta.contentType) {
      contentType = meta.contentType;
    }
  } catch (_error) {
    // Fall back to the default JPEG type.
  }

  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("ETag", '"' + cacheKey + '"');
  res.type(contentType);
  res.sendFile(filePath);
}

app.get("/api/image-proxy", async (req, res) => {
  // Basic rate limiting per-IP
  if (!rateLimitImageProxy(req, res)) return;

  const source = normalizeProxySourceUrl(req.query.url);
  if (!source) {
    res.status(400).json({ ok: false, error: "INVALID_SOURCE_URL", message: "Only Philips image URLs are supported" });
    return;
  }

  const width = normalizeProxyWidth(req.query.wid);
  if (width) {
    source.searchParams.set("wid", String(width));
  }

  const sourceUrl = source.toString();
  const cacheKey = buildProxyCacheKey(sourceUrl, width);
  const cachePaths = buildCachedImagePaths(cacheKey);

  if (fs.existsSync(cachePaths.filePath) && fs.existsSync(cachePaths.metaPath)) {
    respondWithCachedImage(res, cachePaths.filePath, cachePaths.metaPath, cacheKey);
    return;
  }

  let timeoutId = null;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 20000);
    const remoteResponse = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8"
      }
    });

    if (!remoteResponse.ok) {
      res.status(remoteResponse.status).json({
        ok: false,
        error: "IMAGE_FETCH_FAILED",
        message: "Upstream image request failed"
      });
      return;
    }

    const contentType = String(remoteResponse.headers.get("content-type") || "image/jpeg");
    if (!contentType.toLowerCase().startsWith("image/")) {
      res.status(502).json({
        ok: false,
        error: "INVALID_IMAGE_RESPONSE",
        message: "Upstream response is not an image"
      });
      return;
    }

    const buffer = Buffer.from(await remoteResponse.arrayBuffer());
    fs.writeFileSync(cachePaths.filePath, buffer);
    fs.writeFileSync(cachePaths.metaPath, JSON.stringify({ sourceUrl, contentType, createdAt: Date.now() }, null, 2));

    // Ensure cache does not grow unbounded.
    try { enforceCacheSizeLimit(); } catch (_e) {}

    respondWithCachedImage(res, cachePaths.filePath, cachePaths.metaPath, cacheKey);
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: "IMAGE_PROXY_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
});

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
      "/api/image-proxy",
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

app.get("/api/admin/model-bundle/:modelName", requireAdminAuth, (req, res) => {
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

    const mediaData = loadModelMediaData(projectRoot);
    const documentationLinksData = loadDocumentationLinksData(projectRoot);
    const platformChassisRows = loadModelPlatformChassisData(projectRoot);
    const bundle = buildModelBundleResponse(models[index], mediaData, documentationLinksData, platformChassisRows);

    res.json({
      ok: true,
      bundle
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

app.post("/api/admin/model-bundle", requireAdminAuth, (req, res) => {
  try {
    const saved = saveModelBundle(projectRoot, "", req.body);
    res.status(201).json({
      ok: true,
      action: saved.action,
      bundle: saved.bundle,
      item: saved.bundle.model
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

app.put("/api/admin/model-bundle/:modelName", requireAdminAuth, (req, res) => {
  try {
    const modelName = toText(req.params.modelName);
    const saved = saveModelBundle(projectRoot, modelName, req.body);
    res.json({
      ok: true,
      action: saved.action,
      bundle: saved.bundle,
      item: saved.bundle.model
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

    const mediaData = loadModelMediaData(projectRoot);
    delete mediaData[toText(removed.modelName)];

    const documentationLinksData = loadDocumentationLinksData(projectRoot);
    const manualsByModel = isPlainObject(documentationLinksData.manualsByModel)
      ? documentationLinksData.manualsByModel
      : {};
    documentationLinksData.manualsByModel = manualsByModel;

    const removedNames = [
      toText(removed.modelName),
      ...(Array.isArray(removed.aliases) ? removed.aliases.map((item) => toText(item)) : [])
    ].filter(Boolean);
    Object.keys(manualsByModel).forEach((docsCode) => {
      const docsKey = normalizeModelKey(docsCode);
      const shouldDelete = removedNames.some((name) => {
        const modelKey = normalizeModelKey(name);
        return docsKey === modelKey || docsKey.startsWith(modelKey + "/");
      });

      if (shouldDelete) {
        delete manualsByModel[docsCode];
      }
    });

    const platformChassisRows = loadModelPlatformChassisData(projectRoot);
    const platformIndex = findPlatformChassisIndex(platformChassisRows, removed.modelName);
    if (platformIndex >= 0) {
      platformChassisRows.splice(platformIndex, 1);
    }

    saveModelsData(projectRoot, models);
    saveModelMediaData(projectRoot, mediaData);
    saveDocumentationLinksData(projectRoot, documentationLinksData);
    saveModelPlatformChassisData(projectRoot, platformChassisRows);

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

// Admin: purge image-proxy cache. If `key` is provided (body.key or query.key) it removes that entry,
// otherwise it clears the whole cache. Protected by admin auth.
app.post("/api/admin/image-proxy/purge", requireAdminAuth, (req, res) => {
  try {
    const key = toText(req.body && req.body.key) || toText(req.query && req.query.key);
    if (key) {
      removeCacheKey(key);
      res.json({ ok: true, action: "removed", key });
      return;
    }

    // remove all cache files
    const entries = listCacheEntries();
    let removed = 0;
    for (const e of entries) {
      try { fs.unlinkSync(e.filePath); removed++; } catch (_e) {}
      try { fs.unlinkSync(e.metaPath); } catch (_e) {}
    }

    res.json({ ok: true, action: "cleared", removed });
  } catch (error) {
    res.status(500).json({ ok: false, error: "PURGE_FAILED", message: error && error.message ? error.message : "Unknown" });
  }
});

app.listen(port, () => {
  console.log("CallCenter backend listening on http://localhost:" + String(port));
});
