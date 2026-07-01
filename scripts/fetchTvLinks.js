#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const mediaPath = path.join(projectRoot, "data", "model-media.js");
const outputPaths = {
  PL: path.join(projectRoot, "data", "tv-links-pl.json"),
  DE: path.join(projectRoot, "data", "tv-links-de.json")
};

const CONCURRENCY_LIMIT = 4;
const REQUEST_TIMEOUT_MS = 15000;
const WAIT_BETWEEN_REQUESTS_MS = 350;

const BROWSER_HEADERS = {
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "pl-PL,pl;q=0.9,de-DE;q=0.8,de;q=0.7,en-US;q=0.6,en;q=0.5",
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
    locale: "",
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
    if (arg === "--locale") {
      options.locale = String(args[index + 1] || "").trim().toUpperCase();
      index += 1;
      continue;
    }
    if (arg.startsWith("--locale=")) {
      options.locale = String(arg.split("=")[1] || "").trim().toUpperCase();
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

function readModelMediaData() {
  const code = fs.readFileSync(mediaPath, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox, { filename: mediaPath });
  return sandbox.window.ModelMediaData || {};
}

function readExistingOutput(locale) {
  const filePath = outputPaths[locale];
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function writeOutput(locale, data) {
  fs.writeFileSync(outputPaths[locale], JSON.stringify(data, null, 2) + "\n", "utf8");
}

function getModelsFromMedia(options) {
  const requested = new Set(options.models.map((model) => String(model || "").trim().toUpperCase()).filter(Boolean));
  const media = readModelMediaData();
  const models = Object.entries(media)
    .map(([modelName, entry]) => ({
      modelName: String(modelName || "").trim(),
      pageUrl: String(entry && entry.pageUrl || "").trim()
    }))
    .filter((entry) => entry.modelName && /^https:\/\/www\.philips\.co\.uk\/c-p\//i.test(entry.pageUrl))
    .filter((entry) => requested.size === 0 || requested.has(entry.modelName.toUpperCase()));

  return options.limit > 0 ? models.slice(0, options.limit) : models;
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToText(html) {
  return decodeHtmlEntities(String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " "));
}

function absoluteUrl(url, pageUrl) {
  const clean = String(url || "").trim().replace(/\s+/g, "");
  if (!clean) {
    return "";
  }
  try {
    return new URL(clean, pageUrl).href;
  } catch (_error) {
    return "";
  }
}

function buildLocalizedSupportUrl(pageUrl, locale) {
  const clean = String(pageUrl || "").trim().replace(/\/+$/, "");
  if (locale === "PL") {
    return clean.replace(/\.co\.uk/i, ".pl") + "/pomoc";
  }
  if (locale === "DE") {
    return clean.replace(/\.co\.uk/i, ".de") + "/support";
  }
  return "";
}

function getHeadersForLocale(locale) {
  return {
    ...BROWSER_HEADERS,
    "Accept-Language": locale === "DE"
      ? "de-DE,de;q=0.9,pl-PL;q=0.7,pl;q=0.6,en-US;q=0.5,en;q=0.4"
      : "pl-PL,pl;q=0.9,de-DE;q=0.7,de;q=0.6,en-US;q=0.5,en;q=0.4"
  };
}

async function fetchHtml(url, locale) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: getHeadersForLocale(locale)
    });
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        url: response.url || url,
        html: ""
      };
    }
    return {
      ok: true,
      status: response.status,
      url: response.url || url,
      html: await response.text()
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      url,
      html: "",
      error
    };
  } finally {
    clearTimeout(timer);
  }
}

function classifyDocument(locale, contextText) {
  const text = decodeHtmlEntities(contextText).toLowerCase();
  if (locale === "PL") {
    if (/skrócona|skrocona/.test(text)) {
      return { title: "Skrócona Instrukcja", category: "Manual", region: "PL", priority: 1 };
    }
    if (/instrukcja/.test(text)) {
      return { title: "Instrukcja Obsługi", category: "Manual", region: "PL", priority: 0 };
    }
    if (/arkusz|informacji/.test(text)) {
      return { title: "Arkusz informacyjny", category: "Declaration", region: "PL", priority: 4 };
    }
    return null;
  }

  if (locale === "DE") {
    if (/kurzanleitung/.test(text)) {
      return { title: "Kurzanleitung", category: "Manual", region: "DE", priority: 1 };
    }
    if (/bedienungsanleitung/.test(text)) {
      return { title: "Bedienungsanleitung", category: "Manual", region: "DE", priority: 0 };
    }
    if (/datenblatt|daten/.test(text)) {
      return { title: "Datenblatt", category: "Declaration", region: "DE", priority: 4 };
    }
  }

  return null;
}

function extractDocumentLinks(locale, html, pageUrl) {
  const documents = [];
  const seen = new Set();
  const linkPattern = /<a\b[^>]+href=["']([^"']+\.pdf(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const fallbackHrefPattern = /href=["']([^"']+\.pdf(?:\?[^"']*)?)["']/gi;

  function addDocument(rawUrl, index, anchorHtml) {
    const url = absoluteUrl(rawUrl, pageUrl);
    if (!url || seen.has(url)) {
      return;
    }

    const start = Math.max(0, index - 1200);
    const end = Math.min(html.length, index + 2200);
    const contextText = htmlToText([html.slice(start, end), anchorHtml || ""].join(" "));
    const classification = classifyDocument(locale, contextText);
    if (!classification) {
      return;
    }

    seen.add(url);
    documents.push({
      title: classification.title,
      url,
      category: classification.category,
      region: classification.region,
      _priority: classification.priority
    });
  }

  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    addDocument(match[1], match.index, match[0] + " " + match[2]);
  }
  while ((match = fallbackHrefPattern.exec(html)) !== null) {
    addDocument(match[1], match.index, "");
  }

  return documents
    .sort((left, right) => left._priority - right._priority || left.title.localeCompare(right.title))
    .map(({ _priority, ...document }) => document);
}

async function fetchLinksForModel(model, locale) {
  const url = buildLocalizedSupportUrl(model.pageUrl, locale);
  if (!url) {
    return { ok: false, reason: "Invalid source URL" };
  }

  await sleep(WAIT_BETWEEN_REQUESTS_MS);
  const response = await fetchHtml(url, locale);
  if (!response.ok) {
    return {
      ok: false,
      reason: response.status === 404 ? "404/Not Found" : "Fetch failed",
      status: response.status,
      url
    };
  }

  const links = extractDocumentLinks(locale, response.html, response.url);
  if (links.length === 0) {
    return { ok: false, reason: "No PDFs", status: response.status, url: response.url };
  }

  return { ok: true, url: response.url, links };
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

async function runLocale(locale, models, options) {
  const output = readExistingOutput(locale);
  let processed = 0;
  let found = 0;

  console.log("Locale:", locale, "models:", models.length, "output:", path.relative(projectRoot, outputPaths[locale]));

  if (options.dryRun) {
    models.slice(0, 20).forEach((model) => {
      console.log("MODEL", locale, model.modelName, buildLocalizedSupportUrl(model.pageUrl, locale));
    });
    if (models.length > 20) {
      console.log("...", models.length - 20, "more");
    }
    return;
  }

  await runQueue(models, CONCURRENCY_LIMIT, async (model, workerIndex) => {
    if (!options.force && Array.isArray(output[model.modelName]) && output[model.modelName].some((entry) => entry && entry.region === locale && entry.url)) {
      console.log("SKIP", locale, model.modelName, "(already has links)");
      return;
    }

    console.log("START", locale, "worker", workerIndex, model.modelName);
    const result = await fetchLinksForModel(model, locale);
    processed += 1;

    if (result.ok) {
      output[model.modelName] = result.links;
      found += 1;
      console.log("FOUND", locale, model.modelName, result.links.map((link) => link.title).join(", "));
    } else {
      console.warn("MISS ", locale, model.modelName, "(" + result.reason + (result.status ? ", " + result.status : "") + ")");
    }

    if (processed % 10 === 0) {
      writeOutput(locale, output);
      console.log("FLUSH", locale, processed, "processed,", found, "found");
    }
  });

  writeOutput(locale, output);
  console.log("DONE", locale, processed, "processed,", found, "found");
}

async function main() {
  const options = parseArgs();
  const models = getModelsFromMedia(options);
  const locales = options.locale && ["PL", "DE"].includes(options.locale)
    ? [options.locale]
    : ["PL", "DE"];

  console.log("TV media models to inspect:", models.length);
  for (const locale of locales) {
    await runLocale(locale, models, options);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
