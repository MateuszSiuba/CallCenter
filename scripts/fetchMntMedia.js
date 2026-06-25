#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

let puppeteer;
try {
  puppeteer = require("puppeteer");
} catch (error) {
  console.error("\x1b[31mPuppeteer is not installed.\x1b[0m");
  console.error("Install it first with: npm install --save-dev puppeteer");
  process.exit(1);
}

const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public");
const outputPath = path.join(publicDir, "mnt-media-links.json");
const inputCandidates = [
  path.join(publicDir, "mnt-parsed.json"),
  path.join(projectRoot, "mnt-parsed.json")
];

const MOCK_MODELS = ["24B2N3200A", "24G2U", "27G2U"];
const CONCURRENCY_LIMIT = 8;
const BROWSER_RESTART_INTERVAL = 50;
const FLUSH_INTERVAL = 10;
const AOC_DIRECT_SUFFIXES = ["", "_bk", "_00", "_01"];
const PHILIPS_DIRECT_SUFFIXES = ["_00", "_01", "_WT", ""];

const SUPPORT_CONFIG = {
  philips: {
    searchUrls: (modelName) => [
      "https://www.philips.co.uk/c-w/support-home/support-search.html#q=" + encodeURIComponent(modelName),
      "https://www.philips.com/c-w/search.html#q=" + encodeURIComponent(modelName),
      "https://www.philips.co.uk/c-w/support-home.html"
    ],
    directUrls: (modelName) => PHILIPS_DIRECT_SUFFIXES.flatMap((suffix) => [
      "https://www.philips.co.uk/c-p/" + encodeURIComponent(modelName.toUpperCase() + suffix) + "/support",
      "https://www.philips.co.uk/c-p/" + encodeURIComponent(modelName.toUpperCase() + suffix) + "/support-and-manuals"
    ])
  },
  aoc: {
    searchUrls: (modelName) => [
      "https://www.aoc.com/uk/search?q=" + encodeURIComponent(modelName),
      "https://aoc.com/uk/support?search=" + encodeURIComponent(modelName),
      "https://aoc.com/uk/support"
    ],
    directUrls: (modelName) => AOC_DIRECT_SUFFIXES.flatMap((suffix) => [
      "https://www.aoc.com/uk/gaming/monitors/" + encodeURIComponent(modelName.toLowerCase() + suffix),
      "https://www.aoc.com/uk/products/monitors/" + encodeURIComponent(modelName.toLowerCase() + suffix)
    ])
  }
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    limit: 0,
    brand: "",
    force: false,
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
    if (arg === "--brand") {
      options.brand = String(args[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg.startsWith("--brand=")) {
      options.brand = String(arg.split("=")[1] || "").trim();
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      options.models.push(arg.trim());
    }
  }

  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readExistingResults() {
  if (!fs.existsSync(outputPath)) {
    return {};
  }

  try {
    return readJson(outputPath);
  } catch (error) {
    warn("Could not read existing output cache: " + error.message);
    return {};
  }
}

function writeResults(results) {
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf8");
}

function loadInputModels(cliModels, limit) {
  if (cliModels.length > 0) {
    return cliModels.map((modelName) => ({ modelName, brand: inferBrand(modelName) }));
  }

  const inputPath = inputCandidates.find((candidate) => fs.existsSync(candidate));
  if (!inputPath) {
    return MOCK_MODELS.map((modelName) => ({ modelName, brand: inferBrand(modelName) }));
  }

  const parsed = readJson(inputPath);
  const models = parsed
    .map((entry) => ({
      modelName: String(entry && entry.modelName || "").trim(),
      brand: String(entry && (entry.brand || entry.specs && entry.specs.brand) || "").trim()
    }))
    .filter((entry) => entry.modelName);

  return limit > 0 ? models.slice(0, limit) : models;
}

function dedupeModels(models) {
  const seen = new Set();
  return models.filter((model) => {
    const key = String(model.modelName || "").trim().toUpperCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function inferBrand(modelName) {
  const text = String(modelName || "").toUpperCase();
  return /G2|CQ|Q27|CU|U27|AGON|AOC/.test(text) ? "AOC" : "Philips";
}

function normalizeBrand(brand, modelName) {
  const text = String(brand || "").toLowerCase();
  if (text.includes("aoc")) {
    return "aoc";
  }
  if (text.includes("philips")) {
    return "philips";
  }
  return inferBrand(modelName).toLowerCase();
}

function warn(message) {
  console.warn("\x1b[33m" + message + "\x1b[0m");
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function chunkArray(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function compactModelName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function modelSearchTokens(modelName) {
  const compact = compactModelName(modelName);
  return unique([
    compact,
    compact.replace(/^cq/, "c"),
    compact.replace(/^q/, ""),
    compact.replace(/_?00$/, "")
  ]);
}

function shouldKeepLink(title) {
  const text = String(title || "").trim();
  if (!text) {
    return false;
  }

  const normalized = text.toLowerCase();
  const complianceNoise = /\b(ce|eac|cb|iso|whql|rohs|reach|weee|t[üu]v)\b|energy|fiche|declaration/i;
  if (complianceNoise.test(normalized)) {
    return false;
  }

  const unwantedLanguageNames = /(danish|bulgarian|dutch|croatian|czech|finnish|greek|italian|hungarian|french|romanian|portuguese|slovenian|slovak|russian|spanish|turkish|swedish)/i;
  const unwantedLanguageCodes = /\b(da|bg|nl|hr|cs|fi|el|it|hu|fr|ro|pt|sl|sk|ru|es|tr|sv)\b/i;
  const targetLanguages = /\b(pl|polish|en|english|uk|de|german)\b/i;
  if ((unwantedLanguageNames.test(normalized) || unwantedLanguageCodes.test(normalized)) && !targetLanguages.test(normalized)) {
    return false;
  }

  return true;
}

function filterSupportLinks(support) {
  return Object.entries(support || {}).reduce((filtered, [title, href]) => {
    const cleanTitle = String(title || "").replace(/\s+/g, " ").trim();
    if (href && shouldKeepLink(cleanTitle)) {
      filtered[cleanTitle] = href;
    }
    return filtered;
  }, {});
}

function mediaFromImageUrls(imageUrls) {
  const urls = unique(imageUrls || []);
  if (urls.length === 0) {
    return { frontImageUrl: "", sideImageUrl: "", portsImageUrl: "" };
  }
  if (urls.length === 1) {
    return { frontImageUrl: urls[0], sideImageUrl: urls[0], portsImageUrl: urls[0] };
  }
  if (urls.length === 2) {
    return { frontImageUrl: urls[0], sideImageUrl: urls[1], portsImageUrl: urls[1] };
  }
  return {
    frontImageUrl: urls[0],
    sideImageUrl: urls[Math.floor(urls.length / 2)],
    portsImageUrl: urls[urls.length - 1]
  };
}

async function configurePage(page) {
  await page.setViewport({ width: 1366, height: 900 });
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
  await page.setExtraHTTPHeaders({
    "accept-language": "en-GB,en;q=0.9",
    "upgrade-insecure-requests": "1"
  });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });
}

async function wait(page, ms) {
  if (typeof page.waitForTimeout === "function") {
    await page.waitForTimeout(ms);
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function acceptCookies(page) {
  const selectors = [
    "#onetrust-accept-btn-handler",
    "button[id*='accept']",
    "button[class*='accept']",
    "button[aria-label*='Accept' i]",
    "button"
  ];

  for (const selector of selectors) {
    const buttons = await page.$$(selector).catch(() => []);
    for (const button of buttons) {
      const label = await page.evaluate((element) => element.textContent || element.getAttribute("aria-label") || "", button).catch(() => "");
      if (/accept|agree|allow all|zaakceptuj|akceptuj/i.test(label)) {
        await button.click().catch(() => {});
        await wait(page, 700);
        return;
      }
    }
  }
}

async function gotoSafe(page, url) {
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    const status = response ? response.status() : 0;
    if (status >= 400) {
      warn("Navigation returned HTTP " + status + ": " + url);
      return false;
    }
    await acceptCookies(page);
    await wait(page, 1200);
    return true;
  } catch (error) {
    warn("Navigation failed: " + url + " (" + error.message + ")");
    return false;
  }
}

async function submitSearchIfPossible(page, modelName) {
  const selectors = [
    "input[type='search']",
    "input[name='q']",
    "input[name='search']",
    "input[placeholder*='Search' i]",
    "input[aria-label*='Search' i]"
  ];

  for (const selector of selectors) {
    const input = await page.$(selector).catch(() => null);
    if (!input) {
      continue;
    }

    await input.click({ clickCount: 3 }).catch(() => {});
    await input.type(modelName, { delay: 35 }).catch(() => {});
    await page.keyboard.press("Enter").catch(() => {});
    await wait(page, 1800);
    return true;
  }

  return false;
}

async function clickBestModelResult(page, modelName) {
  const clicked = await page.evaluate((needle) => {
    const normalizedNeedle = String(needle || "").toLowerCase();
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const match = anchors.find((anchor) => {
      const text = (anchor.textContent || anchor.getAttribute("href") || "").toLowerCase();
      return text.includes(normalizedNeedle);
    });

    if (!match) {
      return false;
    }

    match.scrollIntoView({ block: "center" });
    match.click();
    return true;
  }, modelName).catch(() => false);

  if (clicked) {
    await wait(page, 2200);
  }

  return clicked;
}

function scoreImage(candidate, modelName) {
  const haystack = [
    candidate.url,
    candidate.alt,
    candidate.title,
    candidate.className
  ].join(" ").toLowerCase();
  const model = String(modelName || "").toLowerCase();
  let score = 0;

  if (model && haystack.includes(model)) score += 8;
  if (/front|product|gallery|hero/.test(haystack)) score += 5;
  if (/side|left|right|profile/.test(haystack)) score += 5;
  if (/port|connect|input|rear|back|bottom|io/.test(haystack)) score += 5;
  if (/logo|icon|sprite|banner|avatar|svg/.test(haystack)) score -= 10;
  if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(candidate.url)) score += 2;
  return score;
}

function classifyImage(candidates, modelName, patterns) {
  return candidates
    .map((candidate) => ({
      ...candidate,
      score: scoreImage(candidate, modelName) + (patterns.some((pattern) => pattern.test([
        candidate.url,
        candidate.alt,
        candidate.title,
        candidate.className
      ].join(" "))) ? 12 : 0)
    }))
    .sort((left, right) => right.score - left.score)[0];
}

function classifyLink(links, patterns) {
  return links.find((link) => {
    const haystack = [link.href, link.text, link.title].join(" ");
    return patterns.some((pattern) => pattern.test(haystack));
  });
}

async function extractMediaAndLinks(page, modelName) {
  return page.evaluate(() => {
    function absoluteUrl(value) {
      try {
        return new URL(value, window.location.href).href;
      } catch (error) {
        return "";
      }
    }

    function srcFromImage(img) {
      const srcset = img.getAttribute("srcset") || "";
      if (srcset) {
        const first = srcset.split(",").map((part) => part.trim().split(/\s+/)[0]).find(Boolean);
        if (first) return absoluteUrl(first);
      }
      return absoluteUrl(img.currentSrc || img.src || img.getAttribute("data-src") || img.getAttribute("data-original") || "");
    }

    const images = Array.from(document.querySelectorAll("img, source"))
      .map((element) => ({
        url: element.tagName.toLowerCase() === "source"
          ? absoluteUrl((element.getAttribute("srcset") || "").split(",")[0].trim().split(/\s+/)[0])
          : srcFromImage(element),
        alt: element.getAttribute("alt") || "",
        title: element.getAttribute("title") || "",
        className: element.getAttribute("class") || ""
      }))
      .filter((image) => image.url && !/^data:/i.test(image.url));

    const links = Array.from(document.querySelectorAll("a[href]"))
      .map((anchor) => ({
        href: absoluteUrl(anchor.getAttribute("href")),
        text: (anchor.textContent || "").trim(),
        title: anchor.getAttribute("title") || ""
      }))
      .filter((link) => link.href);

    return { images, links, pageUrl: window.location.href };
  }).then((raw) => {
    const imageCandidates = unique(raw.images.map((image) => image.url)).map((url) => raw.images.find((image) => image.url === url));
    const linkCandidates = unique(raw.links.map((link) => link.href)).map((href) => raw.links.find((link) => link.href === href));

    const front = classifyImage(imageCandidates, modelName, [/front/i, /hero/i, /product/i]);
    const side = classifyImage(imageCandidates, modelName, [/side/i, /profile/i, /left/i, /right/i]);
    const ports = classifyImage(imageCandidates, modelName, [/ports?/i, /bottom/i, /connect/i, /rear/i, /back/i, /input/i]);

    const manual = classifyLink(linkCandidates, [/manual/i, /user.*guide/i, /\.pdf(\?|$)/i]);
    const drivers = classifyLink(linkCandidates, [/driver/i, /\.zip(\?|$)/i, /\.exe(\?|$)/i]);
    const software = classifyLink(linkCandidates, [/software/i, /firmware/i, /g-?menu/i, /smartcontrol/i]);

    return {
      media: {
        frontImageUrl: front && front.url || "",
        sideImageUrl: side && side.url || "",
        portsImageUrl: ports && ports.url || ""
      },
      supportLinks: {
        manualUrl: manual && manual.href || "",
        driversUrl: drivers && drivers.href || "",
        softwareUrl: software && software.href || ""
      },
      sourceUrl: raw.pageUrl
    };
  });
}

async function gotoAocProductPage(page, modelName) {
  const directUrls = SUPPORT_CONFIG.aoc.directUrls(modelName);

  for (const url of directUrls) {
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      const status = response ? response.status() : 0;
      if (status >= 400) {
        warn("AOC product URL returned HTTP " + status + ": " + url);
        continue;
      }

      await acceptCookies(page);
      await wait(page, 1500);
      return true;
    } catch (error) {
      warn("AOC navigation failed: " + url + " (" + error.message + ")");
    }
  }

  return gotoAocSearchResult(page, modelName);
}

async function gotoAocSearchResult(page, modelName) {
  const searchUrl = "https://www.aoc.com/uk/search?q=" + encodeURIComponent(modelName);
  const loaded = await gotoSafe(page, searchUrl);
  if (!loaded) {
    return false;
  }

  await submitSearchIfPossible(page, modelName);
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll("a[href]")).some((anchor) => {
      const href = String(anchor.getAttribute("href") || "");
      return /\/uk\/(?:gaming\/monitors|products\/monitors)\//i.test(href);
    });
  }, { timeout: 15000 }).catch(() => {});

  const productUrl = await page.evaluate((needle) => {
    function compact(value) {
      return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    function finalSlugFromHref(href) {
      try {
        const url = new URL(href, window.location.href);
        return decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "").toLowerCase();
      } catch (error) {
        return "";
      }
    }

    function slugMatchesToken(slug, token) {
      if (!slug || !token) return false;
      return slug === token || slug.startsWith(token + "_");
    }

    const tokens = Array.from(new Set([
      compact(needle),
      compact(needle).replace(/^cq/, "c"),
      compact(needle).replace(/^q/, ""),
      compact(needle).replace(/_?00$/, "")
    ].filter(Boolean)));

    const candidates = Array.from(document.querySelectorAll("a[href]"))
      .map((anchor) => {
        const href = anchor.getAttribute("href") || "";
        const text = anchor.textContent || "";
        const slug = finalSlugFromHref(href);
        const haystack = compact(href + " " + text);
        const isProduct = /\/uk\/(?:gaming\/monitors|products\/monitors)\//i.test(href);
        const slugScore = tokens.reduce((score, token) => {
          if (slug === token) return Math.max(score, 1000);
          if (slugMatchesToken(slug, token)) return Math.max(score, 900);
          return score;
        }, 0);
        const tokenScore = tokens.reduce((score, token) => score + (token && haystack.includes(token) ? token.length : 0), 0);
        return { href, text, isProduct, score: (isProduct ? 100 : 0) + slugScore + tokenScore };
      })
      .filter((candidate) => candidate.isProduct && candidate.score > 100)
      .sort((left, right) => right.score - left.score);

    const best = candidates[0];
    if (!best) return "";

    try {
      return new URL(best.href, window.location.href).href;
    } catch (error) {
      return "";
    }
  }, modelName).catch(() => "");

  if (!productUrl) {
    warn("AOC search found no product result for " + modelName);
    return false;
  }

  return gotoSafe(page, productUrl);
}

async function extractAocProductImages(page) {
  await page.waitForSelector(".image-carousel__item img, .product-header-item__image, .product-header-item__image img", {
    timeout: 12000
  }).catch(() => {});

  return page.evaluate(() => {
    function absoluteUrl(value) {
      try {
        return new URL(value, window.location.href).href;
      } catch (error) {
        return "";
      }
    }

    function firstFromSrcset(value) {
      return String(value || "")
        .split(",")
        .map((part) => part.trim().split(/\s+/)[0])
        .find(Boolean) || "";
    }

    function imageUrlFromElement(element) {
      if (!element) return "";

      const tagName = element.tagName ? element.tagName.toLowerCase() : "";
      if (tagName === "img") {
        return absoluteUrl(
          element.currentSrc
          || element.src
          || firstFromSrcset(element.getAttribute("srcset"))
          || element.getAttribute("data-src")
          || element.getAttribute("data-original")
          || ""
        );
      }

      const nestedImage = element.querySelector && element.querySelector("img");
      if (nestedImage) {
        return imageUrlFromElement(nestedImage);
      }

      const backgroundImage = window.getComputedStyle(element).backgroundImage || "";
      const match = backgroundImage.match(/url\(["']?([^"')]+)["']?\)/i);
      return match ? absoluteUrl(match[1]) : "";
    }

    const imageElements = Array.from(document.querySelectorAll(".image-carousel__item img, .product-header-item__image, .product-header-item__image img"));
    return Array.from(new Set(imageElements.map(imageUrlFromElement).filter(Boolean)));
  });
}

async function extractAocSupportLinks(page) {
  await page.evaluate(() => {
    const target = document.querySelector("#driversAndManuals");
    if (target) {
      target.scrollIntoView({ block: "start" });
    } else {
      window.scrollTo(0, document.body.scrollHeight * 0.75);
    }
  }).catch(() => {});

  await wait(page, 1500);
  await page.waitForSelector("#driversAndManuals, a[href*='/api/asset'], a.link[href]", { timeout: 12000 }).catch(() => {});

  const support = await page.evaluate(() => {
    function absoluteAocUrl(value) {
      const href = String(value || "").trim();
      if (!href) return "";
      if (href.startsWith("/api/asset")) return "https://www.aoc.com" + href;
      try {
        return new URL(href, window.location.href).href;
      } catch (error) {
        return "";
      }
    }

    function cleanLabel(value) {
      return String(value || "")
        .replace(/\s+/g, " ")
        .replace(/\b(download|file|pdf|zip|exe)\b/gi, "")
        .trim();
    }

    const scope = document.querySelector("#driversAndManuals") || document;
    const links = Array.from(scope.querySelectorAll("a[href]"));
    const support = {};

    links.forEach((anchor) => {
      const href = absoluteAocUrl(anchor.getAttribute("href"));
      if (!href || !/\/api\/asset|\.pdf(\?|$)|\.zip(\?|$)|\.exe(\?|$)/i.test(href)) {
        return;
      }

      const row = anchor.closest("tr, li, article, .row, [class*='download'], [class*='manual'], [class*='driver']") || anchor.parentElement;
      const rowText = cleanLabel(row && row.textContent);
      const anchorText = cleanLabel(anchor.textContent);
      const titleAttr = cleanLabel(anchor.getAttribute("title") || anchor.getAttribute("aria-label"));
      const label = rowText || titleAttr || anchorText || "Download";

      support[label] = href;
    });

    return support;
  });

  return filterSupportLinks(support);
}

async function scrapeAocModel(browser, model) {
  const modelName = model.modelName;
  const page = await browser.newPage();

  await configurePage(page);

  try {
    const loaded = await gotoAocProductPage(page, modelName);
    if (!loaded) {
      warn("No AOC product page found for " + modelName);
      return {
        modelName,
        brand: model.brand || "AOC",
        status: "not_found",
        scrapedAt: new Date().toISOString(),
        media: { frontImageUrl: "", sideImageUrl: "", portsImageUrl: "" },
        support: {},
        sourceUrl: ""
      };
    }

    const imageUrls = await extractAocProductImages(page);
    const support = await extractAocSupportLinks(page);
    const hasAnyResult = imageUrls.length > 0 || Object.keys(support).length > 0;

    if (!hasAnyResult) {
      warn("No AOC media/support results found for " + modelName);
    }

    return {
      modelName,
      brand: model.brand || "AOC",
      status: hasAnyResult ? "ok" : "not_found",
      scrapedAt: new Date().toISOString(),
      media: {
        frontImageUrl: imageUrls[0] || "",
        sideImageUrl: imageUrls[Math.floor(imageUrls.length / 2)] || "",
        portsImageUrl: imageUrls[imageUrls.length - 1] || ""
      },
      support,
      sourceUrl: page.url()
    };
  } finally {
    await page.close().catch(() => {});
  }
}

async function gotoPhilipsProductPage(page, modelName) {
  const directUrls = SUPPORT_CONFIG.philips.directUrls(modelName);

  for (const url of directUrls) {
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      const status = response ? response.status() : 0;
      if (status >= 400) {
        warn("Philips product URL returned HTTP " + status + ": " + url);
        continue;
      }

      await acceptCookies(page);
      await wait(page, 1800);
      return true;
    } catch (error) {
      warn("Philips navigation failed: " + url + " (" + error.message + ")");
    }
  }

  return gotoPhilipsSearchResult(page, modelName);
}

async function gotoPhilipsSearchResult(page, modelName) {
  const searchUrls = [
    "https://www.philips.co.uk/c-w/search.html#q=" + encodeURIComponent(modelName),
    "https://www.philips.co.uk/c-w/search.html?q=" + encodeURIComponent(modelName),
    "https://www.philips.co.uk/c-w/support-home/support-search.html#q=" + encodeURIComponent(modelName)
  ];

  for (const searchUrl of searchUrls) {
    const loaded = await gotoSafe(page, searchUrl);
    if (!loaded) {
      continue;
    }

    await submitSearchIfPossible(page, modelName);
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll("a[href]")).some((anchor) => {
        const href = String(anchor.getAttribute("href") || "");
        return /\/c-p\//i.test(href);
      });
    }, { timeout: 18000 }).catch(() => {});

    const productUrl = await findPhilipsProductResultUrl(page, modelName);
    if (!productUrl) {
      continue;
    }

    const productLoaded = await gotoSafe(page, productUrl);
    if (!productLoaded) {
      continue;
    }

    await navigateToPhilipsSupportTab(page);
    return true;
  }

  warn("Philips search found no product result for " + modelName);
  return false;
}

async function findPhilipsProductResultUrl(page, modelName) {
  return page.evaluate((needle) => {
    function compact(value) {
      return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    function philipsSlugFromHref(href) {
      try {
        const url = new URL(href, window.location.href);
        const parts = url.pathname.split("/").filter(Boolean);
        const productIndex = parts.findIndex((part) => part.toLowerCase() === "c-p");
        if (productIndex === -1 || !parts[productIndex + 1]) {
          return "";
        }
        return decodeURIComponent(parts[productIndex + 1]).toLowerCase();
      } catch (error) {
        return "";
      }
    }

    function slugMatchesToken(slug, token) {
      if (!slug || !token) return false;
      return slug === token || slug.startsWith(token + "_");
    }

    const compactNeedle = compact(needle);
    const tokens = Array.from(new Set([
      compactNeedle,
      compactNeedle.replace(/_?00$/, ""),
      compactNeedle.replace(/_?01$/, ""),
      compactNeedle.replace(/_?wt$/, "")
    ].filter(Boolean)));

    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const candidates = anchors
      .map((anchor) => {
        const href = anchor.getAttribute("href") || "";
        const text = anchor.textContent || "";
        const isProduct = /\/c-p\//i.test(href);
        const slug = philipsSlugFromHref(href);
        const haystack = compact(href + " " + text);
        const slugScore = tokens.reduce((score, token) => {
          if (slug === token) return Math.max(score, 1000);
          if (slugMatchesToken(slug, token)) return Math.max(score, 900);
          return score;
        }, 0);
        const tokenScore = tokens.reduce((score, token) => score + (token && haystack.includes(token) ? token.length : 0), 0);
        return { href, isProduct, score: (isProduct ? 100 : 0) + slugScore + tokenScore };
      })
      .filter((candidate) => candidate.isProduct)
      .sort((left, right) => right.score - left.score);

    const best = candidates.find((candidate) => candidate.score > 100) || candidates[0];
    if (!best) {
      return "";
    }

    try {
      return new URL(best.href, window.location.href).href;
    } catch (error) {
      return "";
    }
  }, modelName).catch(() => false);
}

async function navigateToPhilipsSupportTab(page) {
  const currentUrl = page.url();
  if (/\/support(?:-and-manuals)?(?:[/?#]|$)/i.test(currentUrl)) {
    return true;
  }

  const supportHref = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const match = anchors.find((anchor) => {
      const href = String(anchor.getAttribute("href") || "");
      const text = String(anchor.textContent || "");
      return /support|manual/i.test(href) || /support|manual/i.test(text);
    });

    if (!match) return "";
    try {
      return new URL(match.getAttribute("href"), window.location.href).href;
    } catch (error) {
      return "";
    }
  }).catch(() => "");

  if (supportHref) {
    await gotoSafe(page, supportHref);
    return true;
  }

  if (/\/c-p\//i.test(currentUrl)) {
    const supportUrl = currentUrl.replace(/\/?$/, "/support");
    await gotoSafe(page, supportUrl);
    return true;
  }

  return false;
}

async function extractPhilipsProductImages(page) {
  await page.waitForSelector("picture, .p-picture img, [class*='image-gallery'] img, li.swiper-slide img, .swiper-slide picture img", {
    timeout: 12000
  }).catch(() => {});

  return page.evaluate(() => {
    function absoluteUrl(value) {
      try {
        return new URL(value, window.location.href).href;
      } catch (error) {
        return "";
      }
    }

    function srcsetCandidates(value) {
      return String(value || "")
        .split(",")
        .map((part) => {
          const pieces = part.trim().split(/\s+/);
          const url = pieces[0] || "";
          const descriptor = pieces[1] || "";
          const widthMatch = descriptor.match(/^(\d+)w$/i);
          const densityMatch = descriptor.match(/^(\d+(?:\.\d+)?)x$/i);
          const score = widthMatch ? Number(widthMatch[1]) : densityMatch ? Number(densityMatch[1]) * 1000 : 1;
          return { url, score };
        })
        .filter((candidate) => candidate.url)
        .sort((left, right) => right.score - left.score);
    }

    function bestFromSrcset(value) {
      const best = srcsetCandidates(value)[0];
      return best ? best.url : "";
    }

    function bestImageUrlFromElement(element) {
      if (!element) return "";

      const tagName = element.tagName ? element.tagName.toLowerCase() : "";
      const picture = tagName === "picture" ? element : element.closest && element.closest("picture");
      const candidates = [];

      if (picture) {
        Array.from(picture.querySelectorAll("source[srcset]")).forEach((source) => {
          candidates.push(...srcsetCandidates(source.getAttribute("srcset")));
        });
      }

      const image = tagName === "img" ? element : element.querySelector && element.querySelector("img");
      if (image) {
        candidates.push(...srcsetCandidates(image.getAttribute("srcset")));
        [
          image.currentSrc,
          image.src,
          image.getAttribute("data-src"),
          image.getAttribute("data-original")
        ].filter(Boolean).forEach((url) => candidates.push({ url, score: 1 }));
      }

      const best = candidates.sort((left, right) => right.score - left.score)[0];
      return absoluteUrl(best && best.url || bestFromSrcset(element.getAttribute && element.getAttribute("srcset")) || "");
    }

    const selectors = [
      "picture",
      ".p-picture img",
      "[class*='image-gallery'] img",
      "li.swiper-slide img",
      "li.swiper-slide picture",
      ".p-picture img",
      ".swiper-slide picture img",
      "picture img"
    ];

    const images = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
    return Array.from(new Set(images.map(bestImageUrlFromElement).filter((url) => {
      return url
        && !/^data:/i.test(url)
        && !/icon|logo|sprite|placeholder|transparent|spinner/i.test(url)
        && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url);
    })));
  });
}

async function extractPhilipsSupportLinks(page) {
  await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const target = document.querySelector("#support, #manuals, [id*='manual' i], [class*='manual' i], [class*='document' i]")
      || anchors.find((anchor) => /manual|guide|document|support/i.test(anchor.textContent || ""));
    if (target && target.scrollIntoView) {
      target.scrollIntoView({ block: "start" });
    } else {
      window.scrollTo(0, document.body.scrollHeight * 0.75);
    }
  }).catch(() => {});

  await wait(page, 1600);
  await page.waitForSelector("a[href*='documents.philips.com'], a[href$='.pdf'], a[href*='.pdf']", { timeout: 12000 }).catch(() => {});

  const support = await page.evaluate(() => {
    function absoluteUrl(value) {
      try {
        return new URL(value, window.location.href).href;
      } catch (error) {
        return "";
      }
    }

    function cleanTitle(value) {
      return String(value || "")
        .replace(/\s+/g, " ")
        .replace(/\b(download|pdf|file)\b/gi, "")
        .trim();
    }

    function titleFromCard(anchor) {
      const card = anchor.closest("article, li, .card, .document, .document-card, [class*='document'], [class*='manual'], [class*='download'], .row") || anchor.parentElement;
      if (!card) {
        return "";
      }

      const titleElement = card.querySelector("h1, h2, h3, h4, h5, h6, [class*='title'], [class*='heading']");
      const titleText = cleanTitle(titleElement && titleElement.textContent);
      if (titleText) {
        return titleText;
      }

      const cardText = cleanTitle(card.textContent);
      const anchorText = cleanTitle(anchor.textContent);
      return cleanTitle(cardText.replace(anchorText, ""));
    }

    const support = {};
    const anchors = Array.from(document.querySelectorAll("a[href]"));

    anchors.forEach((anchor) => {
      const href = absoluteUrl(anchor.getAttribute("href"));
      if (!href || !/(documents\.philips\.com|\.pdf(?:\?|$))/i.test(href)) {
        return;
      }

      const label = titleFromCard(anchor)
        || cleanTitle(anchor.getAttribute("title") || anchor.getAttribute("aria-label"))
        || cleanTitle(anchor.textContent)
        || "Document";

      support[label] = href;
    });

    return support;
  });

  return filterSupportLinks(support);
}

async function scrapePhilipsModel(browser, model) {
  const modelName = model.modelName;
  const page = await browser.newPage();

  await configurePage(page);

  try {
    const loaded = await gotoPhilipsProductPage(page, modelName);
    if (!loaded) {
      warn("No Philips product page found for " + modelName);
      return {
        modelName,
        brand: model.brand || "Philips",
        status: "not_found",
        scrapedAt: new Date().toISOString(),
        media: { frontImageUrl: "", sideImageUrl: "", portsImageUrl: "" },
        support: {},
        sourceUrl: ""
      };
    }

    const imageUrls = await extractPhilipsProductImages(page);
    const media = mediaFromImageUrls(imageUrls);
    await navigateToPhilipsSupportTab(page);
    const support = await extractPhilipsSupportLinks(page);
    const hasAnyResult = imageUrls.length > 0 || Object.keys(support).length > 0;

    if (!hasAnyResult) {
      warn("No Philips media/support results found for " + modelName);
    }

    return {
      modelName,
      brand: model.brand || "Philips",
      status: hasAnyResult ? "ok" : "not_found",
      scrapedAt: new Date().toISOString(),
      media,
      support,
      sourceUrl: page.url()
    };
  } finally {
    await page.close().catch(() => {});
  }
}

async function scrapeModel(browser, model) {
  const modelName = model.modelName;
  const brandKey = normalizeBrand(model.brand, modelName);
  if (brandKey === "aoc") {
    return scrapeAocModel(browser, model);
  }
  if (brandKey === "philips") {
    return scrapePhilipsModel(browser, model);
  }

  const config = SUPPORT_CONFIG[brandKey] || SUPPORT_CONFIG.philips;
  const page = await browser.newPage();

  await configurePage(page);

  const urls = [
    ...config.directUrls(modelName),
    ...config.searchUrls(modelName)
  ];

  try {
    for (const url of urls) {
      const loaded = await gotoSafe(page, url);
      if (!loaded) continue;

      await submitSearchIfPossible(page, modelName);
      await clickBestModelResult(page, modelName);
      await wait(page, 1400);

      const extracted = await extractMediaAndLinks(page, modelName);
      const hasAnyResult = Object.values(extracted.media).some(Boolean) || Object.values(extracted.supportLinks).some(Boolean);
      if (hasAnyResult) {
        return {
          modelName,
          brand: model.brand || inferBrand(modelName),
          status: "ok",
          scrapedAt: new Date().toISOString(),
          ...extracted
        };
      }
    }

    warn("No media/support results found for " + modelName);
    return {
      modelName,
      brand: model.brand || inferBrand(modelName),
      status: "not_found",
      scrapedAt: new Date().toISOString(),
      media: { frontImageUrl: "", sideImageUrl: "", portsImageUrl: "" },
      supportLinks: { manualUrl: "", driversUrl: "", softwareUrl: "" },
      sourceUrl: ""
    };
  } finally {
    await page.close().catch(() => {});
  }
}

function createEmptyErrorResult(model, brand, error) {
  return {
    modelName: model.modelName,
    brand,
    status: "error",
    error: error.message,
    scrapedAt: new Date().toISOString(),
    media: { frontImageUrl: "", sideImageUrl: "", portsImageUrl: "" },
    support: {},
    supportLinks: { manualUrl: "", driversUrl: "", softwareUrl: "" },
    sourceUrl: ""
  };
}

function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"]
  });
}

async function main() {
  const options = parseArgs();
  const requestedBrand = options.brand ? normalizeBrand(options.brand, options.brand) : "";
  const inputModels = dedupeModels(loadInputModels(options.models, options.limit))
    .filter((model) => !requestedBrand || normalizeBrand(model.brand, model.modelName) === requestedBrand);
  fs.mkdirSync(publicDir, { recursive: true });

  const results = readExistingResults();
  const models = options.force
    ? inputModels
    : inputModels.filter((model) => !(results[model.modelName] && results[model.modelName].status === "ok"));
  const skippedCount = options.force ? 0 : inputModels.length - models.length;

  console.log("Loaded " + inputModels.length + " monitor model(s).");
  if (requestedBrand) {
    console.log("Brand filter active: " + requestedBrand);
  }
  if (options.force) {
    console.log("Force mode active: cached ok entries will be overwritten.");
  }
  console.log("Skipping " + skippedCount + " cached ok model(s).");
  console.log("Scraping " + models.length + " remaining model(s) with concurrency " + CONCURRENCY_LIMIT + ".");

  if (models.length === 0) {
    writeResults(results);
    console.log("Nothing to scrape. Cache is already complete: " + outputPath);
    return;
  }

  let completedCount = 0;
  let dirtyCount = 0;

  function flushResults(force) {
    if (!force && dirtyCount < FLUSH_INTERVAL) {
      return;
    }
    writeResults(results);
    console.log("Flushed " + Object.keys(results).length + " result(s) to " + outputPath);
    dirtyCount = 0;
  }

  const browserGroups = chunkArray(models, BROWSER_RESTART_INTERVAL);

  for (let groupIndex = 0; groupIndex < browserGroups.length; groupIndex += 1) {
    const group = browserGroups[groupIndex];
    console.log("Launching browser cycle " + String(groupIndex + 1) + "/" + String(browserGroups.length) + " for " + group.length + " model(s)...");

    const browser = await launchBrowser();
    let nextIndex = 0;

    async function worker(workerIndex) {
      while (nextIndex < group.length) {
        const model = group[nextIndex];
        nextIndex += 1;
        const brand = model.brand || inferBrand(model.modelName);
        console.log("START worker " + workerIndex + " " + model.modelName + " (" + brand + ")");

        try {
          const result = await scrapeModel(browser, model);
          console.log("DONE  " + model.modelName + " [" + result.status + "]");
          results[model.modelName] = result;
        } catch (error) {
          warn("Failed to scrape " + model.modelName + ": " + error.message);
          console.log("FAIL  " + model.modelName);
          results[model.modelName] = createEmptyErrorResult(model, brand, error);
        } finally {
          completedCount += 1;
          dirtyCount += 1;
          flushResults(false);
        }
      }
    }

    try {
      const workerCount = Math.min(CONCURRENCY_LIMIT, group.length);
      await Promise.all(Array.from({ length: workerCount }, (_, index) => worker(index + 1)));
    } finally {
      await browser.close().catch(() => {});
      flushResults(true);
    }

    console.log("Completed " + completedCount + "/" + models.length + " uncached model(s).");
  }

  if (dirtyCount > 0) {
    flushResults(true);
  }

  console.log("Wrote " + outputPath);
}
main().catch((error) => {
  console.error("\x1b[31mScraper crashed:\x1b[0m", error);
  process.exit(1);
});
