const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..", "..");
const modelMediaPath = path.join(projectRoot, "data", "model-media.js");
const outputDir = path.join(__dirname, "..", "public", "media", "philips");
const manifestPath = path.join(__dirname, "..", "public", "media", "manifest.json");

function readModelMediaData() {
  const source = fs.readFileSync(modelMediaPath, "utf8");
  const extractionSuffix =
    "\n;globalThis.__EXTRACTED_MODEL_MEDIA__ = " +
    "(typeof ModelMediaData !== 'undefined' ? ModelMediaData : " +
    "(typeof window !== 'undefined' ? window.ModelMediaData : {}));\n";
  const context = { globalThis: {} };
  context.global = context;
  vm.createContext(context);
  vm.runInContext(source + extractionSuffix, context);
  return context.globalThis.__EXTRACTED_MODEL_MEDIA__ || {};
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getPhilipsHash(url) {
  const match = String(url || "").match(/\/is\/image\/philipsconsumer\/([a-z0-9]+)/i);
  return match ? match[1].toLowerCase() : "";
}

function extensionFromContentType(contentType) {
  const normalized = String(contentType || "").toLowerCase();
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg";
  if (normalized.includes("png")) return "png";
  if (normalized.includes("webp")) return "webp";
  if (normalized.includes("gif")) return "gif";
  return "bin";
}

async function downloadImage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "callcenter-media-mirror/1.0"
    }
  });
  if (!response.ok) {
    throw new Error("Failed to fetch " + url + " status=" + response.status);
  }
  const contentType = response.headers.get("content-type") || "";
  const ext = extensionFromContentType(contentType);
  const bytes = Buffer.from(await response.arrayBuffer());
  return { ext, bytes };
}

function collectMediaUrls(modelMediaData) {
  const set = new Set();
  Object.values(modelMediaData || {}).forEach((media) => {
    if (!media || typeof media !== "object") {
      return;
    }
    ["frontImageUrl", "sideImageUrl", "remoteImageUrl", "portsImageUrl"].forEach((field) => {
      const url = String(media[field] || "").trim();
      if (url && /^https?:\/\//i.test(url)) {
        set.add(url);
      }
    });
  });
  return Array.from(set);
}

async function main() {
  ensureDirectory(outputDir);
  ensureDirectory(path.dirname(manifestPath));

  const modelMediaData = readModelMediaData();
  const urls = collectMediaUrls(modelMediaData);
  const manifest = {};
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const url of urls) {
    const hash = getPhilipsHash(url) || Buffer.from(url).toString("hex").slice(0, 24);
    try {
      const { ext, bytes } = await downloadImage(url);
      const fileName = hash + "." + ext;
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, bytes);
      manifest[url] = "/media/philips/" + fileName;
      downloaded += 1;
      console.log("Downloaded:", url, "->", manifest[url]);
    } catch (error) {
      failed += 1;
      skipped += 1;
      console.warn("Skipped:", url, "-", error.message);
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log("Manifest written:", manifestPath);
  console.log("Done. downloaded=" + downloaded + " skipped=" + skipped + " failed=" + failed);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
