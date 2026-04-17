const path = require("node:path");
const {
  loadModelsData,
  saveModelsData,
  toText
} = require("./lib/models-io");

const rootDir = path.resolve(__dirname, "..");
const modelsPath = path.join(rootDir, "data", "models.js");

const replacements = [
  ["Google TV\u2122", "Google TV"],
  ["Google TVâ„˘", "Google TV"],
  ["Google OS", "Google TV"],
  ["TITAN OS", "Titan OS"],
  ["Â®", ""],
  ["â„˘", ""],
  ["â€“", "-"],
  ["â€”", "-"],
  ["â€", "\""],
  ["\uFEFF", ""]
];

const osAliases = new Map([
  ["TITAN OS", "Titan OS"],
  ["GOOGLE TV", "Google TV"],
  ["GOOGLE TV™", "Google TV"],
  ["GOOGLE OS", "Google TV"],
  ["ANDROID TV", "Google TV"]
]);

function normalizeOsLabel(value) {
  const text = toText(value, "").replace(/\s+/g, " ").trim();

  if (!text) {
    return "";
  }

  return osAliases.get(text.toUpperCase()) || text;
}

function normalizeString(value, stats) {
  let nextValue = value;

  replacements.forEach(([from, to]) => {
    if (!nextValue.includes(from)) {
      return;
    }
    nextValue = nextValue.split(from).join(to);
    stats.stringReplacements += 1;
  });

  const compacted = nextValue.replace(/\s+/g, " ").trim();
  if (compacted !== value) {
    stats.trimmedStrings += 1;
  }

  return compacted;
}

function dedupePrimitiveArray(values, stats) {
  const output = [];
  const seen = new Set();

  values.forEach((item) => {
    const key = `${typeof item}::${String(item)}`;
    if (seen.has(key)) {
      stats.deduplicatedArrayItems += 1;
      return;
    }
    seen.add(key);
    output.push(item);
  });

  return output;
}

function deepNormalize(value, stats, pathKey) {
  if (Array.isArray(value)) {
    const normalizedItems = value
      .map((item, index) => deepNormalize(item, stats, `${pathKey}[${index}]`))
      .filter((item) => item !== "");

    if (pathKey.endsWith("availableSizes")) {
      const asStrings = normalizedItems
        .map((item) => toText(item, "").replace(/[^0-9]/g, ""))
        .filter(Boolean);
      const uniqueSorted = Array.from(new Set(asStrings)).sort((a, b) => Number(a) - Number(b));
      return uniqueSorted;
    }

    if (normalizedItems.every((item) => ["string", "number", "boolean"].includes(typeof item))) {
      return dedupePrimitiveArray(normalizedItems, stats);
    }

    return normalizedItems;
  }

  if (value && typeof value === "object") {
    const output = {};
    Object.entries(value).forEach(([key, nested]) => {
      const nextPath = pathKey ? `${pathKey}.${key}` : key;
      let nextValue = deepNormalize(nested, stats, nextPath);

      if (key === "osProfileId") {
        const normalizedOs = normalizeOsLabel(toText(nextValue, ""));
        if (normalizedOs !== nextValue) {
          stats.normalizedOsLabels += 1;
        }
        nextValue = normalizedOs;
      }

      output[key] = nextValue;
    });

    return output;
  }

  if (typeof value === "string") {
    return normalizeString(value, stats);
  }

  return value;
}

function run() {
  const models = loadModelsData(modelsPath);
  const stats = {
    stringReplacements: 0,
    trimmedStrings: 0,
    deduplicatedArrayItems: 0,
    normalizedOsLabels: 0
  };

  const normalized = deepNormalize(models, stats, "ModelsData");
  saveModelsData(modelsPath, normalized);

  console.log("normalize-models-data: done");
  console.log("string replacements:", stats.stringReplacements);
  console.log("trimmed strings:", stats.trimmedStrings);
  console.log("deduplicated array items:", stats.deduplicatedArrayItems);
  console.log("normalized os labels:", stats.normalizedOsLabels);
}

run();
