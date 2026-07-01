#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const modelsPath = path.join(projectRoot, "data", "models.js");
const mediaPath = path.join(projectRoot, "data", "model-media.js");
const outputPath = path.join(projectRoot, "data", "discovered-urls.json");

const CONCURRENCY_LIMIT = 4;
const REQUEST_TIMEOUT_MS = 15000;
const WAIT_BETWEEN_REQUESTS_MS = 350;

const BROWSER_HEADERS = {
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9,pl-PL;q=0.7,pl;q=0.6,de-DE;q=0.5,de;q=0.4",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Sec-CH-UA": "\"Google Chrome\";v=\"126\", \"Chromium\";v=\"126\", \"Not/A)Brand\";v=\"24\"",
  "Sec-CH-UA-Mobile": "?0",
  "Sec-CH-UA-Platform": "\"Windows\"",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    limit: 0,
    force: false,
    dryRun: false,
    models: []
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--limit") {
      options.limit = Number(args[index + 1]) || 0;
      index += 1;
      continue;
    }
    if (arg.startsWith("--limit=")) {
      options.limit = Number(arg.split("=")[1]) || 0;
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      options.models.push(arg.trim());
    }
  }

  return options;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBaseModelName(modelName) {
  return String(modelName || "").trim().split("/")[0];
}

function normalizeKey(value) {
  return getBaseModelName(value).toUpperCase().replace(/[^A-Z0-9]+/g, "");
}

function isLikelyTvModelName(modelName) {
  return /^\d{2,3}(OLED|PUS|PFS|PHS|PML|MLED|HFL)[A-Z0-9]+$/i.test(getBaseModelName(modelName));
}

function readJsGlobal(filePath, globalName) {
  const code = fs.readFileSync(filePath, "utf8");
  const sandbox = {
    window: {},
    module: { exports: {} },
    exports: {}
  };
  vm.runInNewContext(code, sandbox, { filename: filePath });
  return sandbox.window[globalName] || sandbox.module.exports[globalName] || sandbox[globalName];
}

function readModelsData() {
  const models = readJsGlobal(modelsPath, "ModelsData");
  if (!Array.isArray(models)) {
    return [];
  }

  return models
    .filter((model) => {
      const moduleName = String(model && (model.module || model.productType || "TV")).toUpperCase();
      return moduleName === "TV";
    })
    .map((model) => getBaseModelName(model && model.modelName))
    .filter((modelName) => modelName && isLikelyTvModelName(modelName));
}

function readKnownMediaKeys() {
  const media = readJsGlobal(mediaPath, "ModelMediaData");
  if (!media || typeof media !== "object" || Array.isArray(media)) {
    return new Set();
  }

  return new Set(Object.keys(media).map((key) => normalizeKey(key)).filter(Boolean));
}

function readExistingOutput() {
  if (!fs.existsSync(outputPath)) {
    return {};
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function writeOutput(data) {
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function getMissingModels(options) {
  const requested = new Set(options.models.map((model) => normalizeKey(model)).filter(Boolean));
  const knownMediaKeys = readKnownMediaKeys();
  const existingOutput = readExistingOutput();
  const discoveredKeys = new Set(Object.keys(existingOutput).map((key) => normalizeKey(key)).filter(Boolean));
  const seen = new Set();
  const missing = [];

  for (const modelName of readModelsData()) {
    const key = normalizeKey(modelName);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);

    if (requested.size > 0 && !requested.has(key)) {
      continue;
    }
    if (!options.force && (knownMediaKeys.has(key) || discoveredKeys.has(key))) {
      continue;
    }
    missing.push(modelName);
  }

  return options.limit > 0 ? missing.slice(0, options.limit) : missing;
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: BROWSER_HEADERS
    });

    if (!response.ok) {
      return { ok: false, status: response.status, url: response.url || url, html: "" };
    }

    return {
      ok: true,
      status: response.status,
      url: response.url || url,
      html: await response.text()
    };
  } catch (error) {
    return { ok: false, status: 0, url, html: "", error };
  } finally {
    clearTimeout(timer);
  }
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/g, "/")
    .replace(/&#47;/g, "/")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;|&#39;/g, "'");
}

function discoverProductUrlFromHtml(modelName, html) {
  const escapedModel = String(modelName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp("href=[\"']([^\"']*/c-p/" + escapedModel + "_[0-9]{2}/[^\"'?<#]+)", "i"),
    new RegExp("(https?:\\/\\/www\\.philips\\.co\\.uk\\/c-p\\/" + escapedModel + "_[0-9]{2}\\/[^\"'\\s?<#]+)", "i"),
    new RegExp("(/c-p/" + escapedModel + "_[0-9]{2}/[^\"'?<#\\s]+)", "i")
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (!match || !match[1]) {
      continue;
    }
    const rawUrl = decodeHtmlEntities(match[1]).trim();
    try {
      return new URL(rawUrl, "https://www.philips.co.uk").href.replace(/\/+$/, "");
    } catch (_error) {
      // Try next pattern.
    }
  }

  return "";
}

async function discoverModelUrl(modelName) {
  const searchUrl = "https://www.philips.co.uk/c-w/search.html?q=" + encodeURIComponent(modelName);
  await sleep(WAIT_BETWEEN_REQUESTS_MS);
  const response = await fetchHtml(searchUrl);

  if (!response.ok) {
    return {
      ok: false,
      reason: response.status === 404 ? "404/Not Found" : "Search fetch failed",
      status: response.status
    };
  }

  const pageUrl = discoverProductUrlFromHtml(modelName, response.html);
  if (!pageUrl) {
    return {
      ok: false,
      reason: "NOT FOUND",
      status: response.status
    };
  }

  return { ok: true, pageUrl };
}

async function runQueue(items, limit, handler) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async (_, workerIndex) => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      await handler(item, workerIndex + 1);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const options = parseArgs();
  const missingModels = getMissingModels(options);
  const output = readExistingOutput();

  console.log("Missing TV models to discover:", missingModels.length);
  console.log("Output:", path.relative(projectRoot, outputPath));

  if (options.dryRun) {
    missingModels.slice(0, 50).forEach((modelName) => {
      console.log("MISSING", modelName);
    });
    if (missingModels.length > 50) {
      console.log("...", missingModels.length - 50, "more");
    }
    return;
  }

  let processed = 0;
  let found = 0;

  await runQueue(missingModels, CONCURRENCY_LIMIT, async (modelName, workerIndex) => {
    console.log("START worker", workerIndex, modelName);
    const result = await discoverModelUrl(modelName);
    processed += 1;

    if (result.ok) {
      output[modelName] = { pageUrl: result.pageUrl };
      found += 1;
      console.log("FOUND", modelName, result.pageUrl);
    } else {
      console.warn("NOT FOUND", modelName, "(" + result.reason + (result.status ? ", " + result.status : "") + ")");
    }

    if (processed % 10 === 0) {
      writeOutput(output);
      console.log("FLUSH", processed, "processed,", found, "found");
    }
  });

  writeOutput(output);
  console.log("DONE", processed, "processed,", found, "found");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
