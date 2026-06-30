const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const express = require("express");
const cors = require("cors");
const { applyMirroredMediaUrls } = require("./mediaMirror");
const { searchModelsHandler } = require("./searchModelsController");
const {
  issueAdminToken,
  requireAdminAuth,
  validateCredentials
} = require("./adminAuth");
const {
  loadBootstrapData,
  loadModelByName,
  loadPoliciesData,
  loadKnowledgeData,
  loadKnowledgeArticlesForModel,
  loadChangelogData,
  loadDocumentationLinksData,
  loadModelMediaData,
  loadModelPlatformChassisData
} = require("./publicContentRepository");
const { getPool } = require("./db");

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

function toText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

app.use(cors({ origin: buildCorsOriginRule(allowedOrigin) }));
app.use(express.json({ limit: "2mb" }));
app.use("/media", express.static(path.join(__dirname, "..", "public", "media")));

function adminLoginHandler(req, res) {
  const username = toText(req.body && req.body.username);
  const password = toText(req.body && req.body.password);

  if (!validateCredentials(username, password)) {
    res.status(401).json({
      ok: false,
      error: "ADMIN_LOGIN_FAILED",
      message: "Invalid admin username or password"
    });
    return;
  }

  res.json({
    ok: true,
    token: issueAdminToken(username)
  });
}

app.post("/api/admin/login", adminLoginHandler);
app.post("/api/auth/login", adminLoginHandler);

app.get("/api/admin/models", requireAdminAuth, async (req, res) => {
  try {
    const data = await loadBootstrapData();
    res.json({
      ok: true,
      items: data.ModelsData || [],
      ModelsData: data.ModelsData || [],
      ModelPlatformChassisData: data.ModelPlatformChassisData || [],
      ModelMediaData: applyMirroredMediaUrls(data.ModelMediaData, getPublicBaseUrl(req)) || {}
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "ADMIN_MODELS_LOAD_FAILED",
      message: error && error.message ? error.message : "Failed to load admin models"
    });
  }
});

function normalizeAdminLookupKey(value) {
  return toText(value).toUpperCase().replace(/[^A-Z0-9]+/g, "");
}

function getAdminModelPayload(body) {
  if (isPlainObject(body && body.model)) {
    return body.model;
  }

  return isPlainObject(body) ? body : {};
}

function getAdminMediaPayload(body) {
  if (isPlainObject(body && body.media)) {
    return body.media;
  }

  return {};
}

function getNestedObject(value, key) {
  return isPlainObject(value && value[key]) ? value[key] : {};
}

function getFirstText(...values) {
  for (const value of values) {
    const text = toText(value);
    if (text) {
      return text;
    }
  }

  return "";
}

function getFirstNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) {
      return number;
    }
  }

  return 0;
}

function inferSizeFromModelName(modelName) {
  const match = toText(modelName).match(/^(\d{2,3})/);
  return match ? Number(match[1]) : 0;
}

function inferSeriesKeyFromModelName(modelName) {
  const text = toText(modelName);
  return text.replace(/^\d{2,3}/, "") || text || "UNKNOWN";
}

function getAdminModelSpecs(model) {
  const specs = isPlainObject(model && model.specs) ? model.specs : {};
  return {
    technicalByCategory: isPlainObject(specs.technicalByCategory) ? specs.technicalByCategory : {},
    ports: Array.isArray(specs.ports) ? specs.ports : [],
    features: isPlainObject(specs.features) ? specs.features : {},
    rawSource: isPlainObject(specs.rawSource) ? specs.rawSource : {}
  };
}

function getAdminMediaImages(mediaPayload) {
  const nestedMedia = getNestedObject(mediaPayload, "media");
  return {
    pageUrl: getFirstText(mediaPayload.pageUrl, nestedMedia.pageUrl),
    frontImageUrl: getFirstText(mediaPayload.frontImageUrl, nestedMedia.frontImageUrl),
    sideImageUrl: getFirstText(mediaPayload.sideImageUrl, nestedMedia.sideImageUrl, nestedMedia.sideViewImageUrl),
    remoteImageUrl: getFirstText(mediaPayload.remoteImageUrl, nestedMedia.remoteImageUrl),
    portsImageUrl: getFirstText(mediaPayload.portsImageUrl, nestedMedia.portsImageUrl)
  };
}

function getAdminMediaSourceMeta(mediaPayload) {
  const sourceMeta = isPlainObject(mediaPayload && mediaPayload.sourceMeta) ? { ...mediaPayload.sourceMeta } : {};
  if (isPlainObject(mediaPayload && mediaPayload.support)) {
    sourceMeta.support = mediaPayload.support;
  }
  if (isPlainObject(mediaPayload && mediaPayload.media)) {
    sourceMeta.media = mediaPayload.media;
  }
  return sourceMeta;
}

async function findAdminSeriesRow(client, id, model) {
  const rawId = toText(id);
  if (/^\d+$/.test(rawId)) {
    const byId = await client.query("SELECT * FROM models_series WHERE id = $1 LIMIT 1", [Number(rawId)]);
    if (byId.rows[0]) {
      return byId.rows[0];
    }
  }

  const candidates = Array.from(new Set([
    rawId,
    toText(model && model.id),
    toText(model && model.modelName),
    ...(Array.isArray(model && model.aliases) ? model.aliases.map(toText) : [])
  ].map(normalizeAdminLookupKey).filter(Boolean)));

  for (const candidate of candidates) {
    const result = await client.query(
      [
        "SELECT s.* FROM models_series s",
        "WHERE s.normalized_canonical_model_name = $1",
        "UNION",
        "SELECT s.* FROM models_series s",
        "JOIN model_variants v ON v.series_id = s.id",
        "WHERE v.normalized_model_name = $1",
        "UNION",
        "SELECT s.* FROM models_series s",
        "JOIN model_aliases a ON a.series_id = s.id",
        "WHERE a.normalized_alias = $1",
        "LIMIT 1"
      ].join(" "),
      [candidate]
    );

    if (result.rows[0]) {
      return result.rows[0];
    }
  }

  return null;
}

async function updateAdminModelInPostgres(id, model, mediaPayload) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const existing = await findAdminSeriesRow(client, id, model);
    if (!existing) {
      await client.query("ROLLBACK");
      return null;
    }

    const modelName = getFirstText(model.modelName, existing.canonical_model_name);
    const brand = getFirstText(model.brand, existing.brand, "Philips");
    const year = getFirstNumber(model.year, existing.year, new Date().getFullYear());
    const canonicalSize = getFirstNumber(model.canonicalSize, existing.canonical_size, Array.isArray(model.availableSizes) ? model.availableSizes[0] : "", inferSizeFromModelName(modelName), 55);
    const seriesKey = getFirstText(model.seriesKey, existing.series_key, inferSeriesKeyFromModelName(modelName));
    const osProfileId = getFirstText(model.osProfileId, model.os, existing.os_profile_id) || null;
    const panelType = getFirstText(model.panelType, model.panel, existing.panel_type) || null;
    const status = ["active", "draft", "archived"].includes(toText(model.status)) ? toText(model.status) : getFirstText(existing.status, "active");
    const notes = getFirstText(model.notes, existing.notes) || null;

    const updatedSeries = await client.query(
      [
        "UPDATE models_series",
        "SET brand = $1, year = $2, canonical_model_name = $3, series_key = $4, canonical_size = $5,",
        "os_profile_id = $6, panel_type = $7, status = $8, notes = $9, updated_at = NOW()",
        "WHERE id = $10",
        "RETURNING id"
      ].join(" "),
      [brand, year, modelName, seriesKey, canonicalSize, osProfileId, panelType, status, notes, existing.id]
    );

    const seriesId = updatedSeries.rows[0].id;
    const specs = getAdminModelSpecs(model);
    await client.query(
      [
        "INSERT INTO model_specs (series_id, technical_by_category, ports, features, raw_source)",
        "VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb)",
        "ON CONFLICT (series_id)",
        "DO UPDATE SET technical_by_category = EXCLUDED.technical_by_category,",
        "ports = EXCLUDED.ports, features = EXCLUDED.features, raw_source = EXCLUDED.raw_source, updated_at = NOW()"
      ].join(" "),
      [
        seriesId,
        JSON.stringify(specs.technicalByCategory),
        JSON.stringify(specs.ports),
        JSON.stringify(specs.features),
        JSON.stringify({ ...specs.rawSource, adminUpdatedAt: new Date().toISOString() })
      ]
    );

    if (isPlainObject(mediaPayload) && Object.keys(mediaPayload).length > 0) {
      const media = getAdminMediaImages(mediaPayload);
      await client.query(
        [
          "INSERT INTO model_media (model_key, page_url, front_image_url, side_image_url, remote_image_url, ports_image_url, source_meta)",
          "VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)",
          "ON CONFLICT (normalized_model_key)",
          "DO UPDATE SET model_key = EXCLUDED.model_key, page_url = EXCLUDED.page_url,",
          "front_image_url = EXCLUDED.front_image_url, side_image_url = EXCLUDED.side_image_url,",
          "remote_image_url = EXCLUDED.remote_image_url, ports_image_url = EXCLUDED.ports_image_url,",
          "source_meta = EXCLUDED.source_meta, updated_at = NOW()"
        ].join(" "),
        [
          modelName,
          media.pageUrl || null,
          media.frontImageUrl || null,
          media.sideImageUrl || null,
          media.remoteImageUrl || null,
          media.portsImageUrl || null,
          JSON.stringify(getAdminMediaSourceMeta(mediaPayload))
        ]
      );
    }

    await client.query("COMMIT");
    return { source: "postgres", id: seriesId, modelName };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

function updateAdminModelInJsonFile(id, model) {
  const filePath = path.join(projectRoot, "mnt-parsed.json");
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const rows = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(rows)) {
    return null;
  }

  const targetKeys = Array.from(new Set([
    id,
    model && model.id,
    model && model.modelName
  ].map(normalizeAdminLookupKey).filter(Boolean)));

  const index = rows.findIndex((row) => {
    const rowKeys = [
      row && row.id,
      row && row.modelName
    ].map(normalizeAdminLookupKey).filter(Boolean);
    return rowKeys.some((key) => targetKeys.includes(key));
  });

  if (index < 0) {
    return null;
  }

  rows[index] = {
    ...rows[index],
    ...model,
    id: rows[index].id || model.id,
    modelName: model.modelName || rows[index].modelName
  };
  fs.writeFileSync(filePath, JSON.stringify(rows, null, 2) + "\n", "utf8");
  return { source: "json", modelName: rows[index].modelName };
}

function updateAdminMediaJsonFallback(modelName, mediaPayload) {
  if (!isPlainObject(mediaPayload) || Object.keys(mediaPayload).length === 0) {
    return;
  }

  const candidates = [
    path.join(projectRoot, "public", "mnt-media-links.json"),
    path.join(projectRoot, "public", "data", "model-media.json")
  ];

  const filePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!filePath) {
    return;
  }

  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const current = isPlainObject(payload[modelName]) ? payload[modelName] : {};
  payload[modelName] = {
    ...current,
    ...mediaPayload
  };
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

app.put("/api/admin/models/:id", requireAdminAuth, async (req, res) => {
  const id = toText(req.params && req.params.id);
  const model = getAdminModelPayload(req.body);
  const mediaPayload = getAdminMediaPayload(req.body);

  if (!id || !isPlainObject(model) || !toText(model.modelName)) {
    res.status(400).json({
      ok: false,
      error: "INVALID_MODEL_PAYLOAD",
      message: "Model id and model.modelName are required"
    });
    return;
  }

  try {
    let result = null;

    try {
      result = await updateAdminModelInPostgres(id, model, mediaPayload);
    } catch (dbError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Admin DB update failed, trying JSON fallback:", dbError && dbError.message ? dbError.message : dbError);
      }
    }

    if (!result) {
      result = updateAdminModelInJsonFile(id, model);
      if (result) {
        updateAdminMediaJsonFallback(result.modelName || model.modelName, mediaPayload);
      }
    }

    if (!result) {
      res.status(404).json({
        ok: false,
        error: "MODEL_NOT_FOUND",
        message: "Model not found: " + id
      });
      return;
    }

    res.json({
      ok: true,
      message: "Model updated successfully",
      source: result.source,
      modelName: result.modelName || model.modelName
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "MODEL_UPDATE_FAILED",
      message: error && error.message ? error.message : "Failed to update model"
    });
  }
});

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

function resolveModelMediaEntry(mediaData, model) {
  const modelName = toText(model && model.modelName);
  const seriesKey = toText(model && model.seriesKey);
  const normalizedModelName = normalizeModelKey(modelName);
  const normalizedSeriesKey = normalizeModelKey(seriesKey);
  const mediaByKey = isPlainObject(mediaData) ? mediaData : {};

  return mediaByKey[modelName]
    || mediaByKey[seriesKey]
    || mediaByKey[normalizedModelName]
    || mediaByKey[normalizedSeriesKey]
    || {};
}

function matchesKnowledgeArticle(article, model, platformChassis) {
  const modelOsProfileId = toText(model && model.osProfileId);
  const chassis = toText(platformChassis && platformChassis.chassis);
  const matchOs = Array.isArray(article && article.matchOs) ? article.matchOs : [];
  const matchChassis = Array.isArray(article && article.matchChassis) ? article.matchChassis : [];
  const osMatches = matchOs.length === 0 || (modelOsProfileId && matchOs.includes(modelOsProfileId));
  const chassisMatches = matchChassis.length === 0 || (chassis && matchChassis.includes(chassis));
  return osMatches && chassisMatches;
}

function buildModelBundleResponse(model, mediaData, documentationLinksData, platformChassisRows, knowledgeArticles) {
  const modelName = toText(model && model.modelName);
  const media = resolveModelMediaEntry(mediaData, model);

  const docsCode = findDocumentationModelCode(documentationLinksData, model);
  const manualsByModel = isPlainObject(documentationLinksData && documentationLinksData.manualsByModel)
    ? documentationLinksData.manualsByModel
    : {};
  const documentationLinks = Array.isArray(manualsByModel[docsCode]) ? manualsByModel[docsCode] : [];

  const platformIndex = findPlatformChassisIndex(platformChassisRows, modelName);
  const platformChassis = platformIndex >= 0 ? platformChassisRows[platformIndex] : null;
  const relatedKnowledgeArticles = Array.isArray(knowledgeArticles)
    ? knowledgeArticles.filter((article) => matchesKnowledgeArticle(article, model, platformChassis))
    : [];

  return {
    model,
    media,
    documentation: {
      modelCode: docsCode || modelName,
      links: documentationLinks
    },
    platformChassis,
    knowledgeArticles: relatedKnowledgeArticles
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
      "/api/models/search",
      "/api/models/:modelName",
      "/api/knowledge",
      "/api/troubleshooting",
      "/api/policies",
      "/api/changelog",
      "/api/documentation-links"
    ]
  });
});

app.get("/api/bootstrap", async (req, res) => {
  try {
    const data = await loadBootstrapData();
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

app.get("/api/models", async (req, res) => {
  try {
    const data = await loadBootstrapData();
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

app.get("/api/models/search", searchModelsHandler);

app.get("/api/models/:modelName", async (req, res) => {
  try {
    const modelName = toText(req.params.modelName);
    const [model, mediaData, documentationLinksData, platformChassisRows] = await Promise.all([
      loadModelByName(modelName),
      loadModelMediaData(),
      loadDocumentationLinksData(),
      loadModelPlatformChassisData()
    ]);

    if (!model) {
      res.status(404).json({
        ok: false,
        error: "NOT_FOUND",
        message: "Model not found"
      });
      return;
    }

    const modelPlatformChassis = Array.isArray(platformChassisRows)
      ? platformChassisRows.find((entry) => toText(entry && entry.modelName) === toText(model && model.modelName)) || null
      : null;
    const knowledgeArticles = await loadKnowledgeArticlesForModel({
      osProfileId: model && model.osProfileId,
      platformChassis: modelPlatformChassis
    });

    res.json({
      ok: true,
      bundle: buildModelBundleResponse(
        model,
        applyMirroredMediaUrls(mediaData, getPublicBaseUrl(req)),
        documentationLinksData || {},
        platformChassisRows || [],
        knowledgeArticles || []
      )
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

app.get("/api/knowledge", async (_req, res) => {
  try {
    const [knowledgeData] = await Promise.all([loadKnowledgeData()]);
    res.json({
      ok: true,
      KnowledgeBaseData: knowledgeData || [],
      TroubleshootingData: {}
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "KNOWLEDGE_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.get("/api/troubleshooting", async (_req, res) => {
  try {
    res.json({
      ok: true,
      TroubleshootingData: {}
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "TROUBLESHOOTING_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.get("/api/policies", async (_req, res) => {
  try {
    const policiesData = await loadPoliciesData();
    res.json({
      ok: true,
      PoliciesData: policiesData || []
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "POLICIES_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.get("/api/changelog", async (_req, res) => {
  try {
    const changelogData = await loadChangelogData();
    res.json({
      ok: true,
      ChangelogEntriesData: changelogData || []
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "CHANGELOG_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.get("/api/documentation-links", async (_req, res) => {
  try {
    const documentationLinksData = await loadDocumentationLinksData();
    res.json({
      ok: true,
      DocumentationLinksData: documentationLinksData || {}
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "DOCUMENTATION_LINKS_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.listen(port, () => {
  console.log("CallCenter backend listening on http://localhost:" + String(port));
});
