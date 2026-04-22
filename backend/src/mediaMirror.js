const fs = require("node:fs");
const path = require("node:path");

const MANIFEST_PATH = path.join(__dirname, "..", "public", "media", "manifest.json");

let cachedManifest = null;
let cachedManifestMtimeMs = 0;

function readManifest() {
  try {
    const stats = fs.statSync(MANIFEST_PATH);
    if (cachedManifest && cachedManifestMtimeMs === stats.mtimeMs) {
      return cachedManifest;
    }

    const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
    const parsed = JSON.parse(raw);
    cachedManifest = parsed && typeof parsed === "object" ? parsed : {};
    cachedManifestMtimeMs = stats.mtimeMs;
    return cachedManifest;
  } catch (_error) {
    return {};
  }
}

function toAbsoluteUrl(publicBaseUrl, relativePath) {
  const base = String(publicBaseUrl || "").replace(/\/+$/, "");
  const rel = "/" + String(relativePath || "").replace(/^\/+/, "");
  if (!base) {
    return rel;
  }
  return base + rel;
}

function rewriteField(value, manifest, publicBaseUrl) {
  const url = String(value || "").trim();
  if (!url) {
    return value;
  }
  const mirroredPath = manifest[url];
  if (!mirroredPath) {
    return value;
  }
  return toAbsoluteUrl(publicBaseUrl, mirroredPath);
}

function applyMirroredMediaUrls(modelMediaData, publicBaseUrl) {
  if (!modelMediaData || typeof modelMediaData !== "object") {
    return modelMediaData;
  }

  const manifest = readManifest();
  const modelEntries = Object.entries(modelMediaData);
  if (modelEntries.length === 0) {
    return modelMediaData;
  }

  const next = {};
  modelEntries.forEach(([modelCode, media]) => {
    if (!media || typeof media !== "object") {
      next[modelCode] = media;
      return;
    }

    next[modelCode] = {
      ...media,
      frontImageUrl: rewriteField(media.frontImageUrl, manifest, publicBaseUrl),
      sideImageUrl: rewriteField(media.sideImageUrl, manifest, publicBaseUrl),
      remoteImageUrl: rewriteField(media.remoteImageUrl, manifest, publicBaseUrl),
      portsImageUrl: rewriteField(media.portsImageUrl, manifest, publicBaseUrl)
    };
  });

  return next;
}

module.exports = {
  applyMirroredMediaUrls
};
