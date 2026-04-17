const path = require("node:path");
const { loadModelsData, toText } = require("./lib/models-io");

const rootDir = path.resolve(__dirname, "..");
const modelsPath = path.join(rootDir, "data", "models.js");

const polishKeywordRegex = /\b(telewizor|wy[sś]wietlacz|d[zź]wi[eę]k|wymiary|zasilanie|akcesoria|funkcje|obraz|g[oł]o[sś]nik|odtwarzane|przek[aą]tna|sterowanie|wsp[oó]łpraca|obs[łl]uga|z[łl][aą]cze|po[lł][aą]czenie|bezprzewodow|szer\.|wys\.|g[łl]\.)\b/i;
const polishDiacriticsRegex = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;

function walk(value, pathKey, collector) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${pathKey}[${index}]`, collector));
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, nested]) => {
      const nextPath = pathKey ? `${pathKey}.${key}` : key;
      walk(nested, nextPath, collector);
    });
    return;
  }

  if (typeof value !== "string") {
    return;
  }

  const text = toText(value, "");
  if (!text) {
    return;
  }

  const hasDiacritics = polishDiacriticsRegex.test(text);
  const hasKeyword = polishKeywordRegex.test(text.toLowerCase());

  if (hasDiacritics || hasKeyword) {
    collector.push({
      path: pathKey,
      value: text,
      reason: [hasDiacritics ? "diacritics" : "", hasKeyword ? "keyword" : ""].filter(Boolean).join("+")
    });
  }
}

function run() {
  const models = loadModelsData(modelsPath);
  const findings = [];

  walk(models, "ModelsData", findings);

  const byReason = findings.reduce((acc, item) => {
    acc.set(item.reason, (acc.get(item.reason) || 0) + 1);
    return acc;
  }, new Map());

  console.log("audit-models-language: summary");
  console.log("models:", models.length);
  console.log("suspected non-English values:", findings.length);
  [...byReason.entries()].forEach(([reason, count]) => {
    console.log(`  - ${reason}: ${count}`);
  });

  if (findings.length > 0) {
    console.log("\nSample findings:");
    findings.slice(0, 80).forEach((item) => {
      console.log(`  - ${item.path} [${item.reason}] -> ${item.value}`);
    });
  }
}

run();
