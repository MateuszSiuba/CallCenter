const path = require("node:path");
const { loadModelsData, toText } = require("./lib/models-io");

const rootDir = path.resolve(__dirname, "..");
const modelsPath = path.join(rootDir, "data", "models.js");

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

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function listMojibakeMatches(input) {
  const text = toText(input, "");
  const patterns = ["Â", "â„", "â€“", "�"];
  return patterns.filter((token) => text.includes(token));
}

function run() {
  const models = loadModelsData(modelsPath);
  const errors = [];
  const warnings = [];

  const byModelName = new Map();
  const osCounts = new Map();

  models.forEach((model, index) => {
    const modelName = toText(model.modelName, "");
    const year = Number(model.year);
    const modelPath = `ModelsData[${index}](${modelName || "<empty>"})`;

    if (!modelName) {
      errors.push(`${modelPath}: missing modelName`);
    }

    if (!Number.isFinite(year) || year < 2000 || year > 2100) {
      errors.push(`${modelPath}: invalid year '${model.year}'`);
    }

    if (!Array.isArray(model.availableSizes) || model.availableSizes.length === 0) {
      warnings.push(`${modelPath}: missing availableSizes`);
    } else {
      const normalizedSizes = model.availableSizes
        .map((size) => toText(size, "").replace(/[^0-9]/g, ""))
        .filter(Boolean);
      const badSizes = normalizedSizes.filter((size) => !/^\d{2,3}$/.test(size));
      if (badSizes.length > 0) {
        errors.push(`${modelPath}: invalid sizes: ${badSizes.join(", ")}`);
      }

      const modelSize = toText(modelName.match(/^\d{2,3}/)?.[0], "");
      if (modelSize && !normalizedSizes.includes(modelSize)) {
        warnings.push(`${modelPath}: model size '${modelSize}' not present in availableSizes`);
      }
    }

    const osProfileId = toText(model.osProfileId, "");
    const normalizedOs = normalizeOsLabel(osProfileId);
    if (!osProfileId) {
      warnings.push(`${modelPath}: empty osProfileId`);
    } else {
      osCounts.set(normalizedOs, (osCounts.get(normalizedOs) || 0) + 1);
      if (normalizedOs !== osProfileId) {
        warnings.push(`${modelPath}: non-canonical osProfileId '${osProfileId}' (expected '${normalizedOs}')`);
      }
    }

    if (!toText(model.panelType, "")) {
      warnings.push(`${modelPath}: empty panelType`);
    }

    if (!isPlainObject(model.specs)) {
      warnings.push(`${modelPath}: specs missing or invalid object`);
    }

    const stringFields = [
      model.modelName,
      model.osProfileId,
      model.panelType,
      model.audioChannels,
      model.audioPower,
      model.wifiStandard,
      model.bluetoothVersion,
      model.vrrMaxRefreshRate
    ];

    stringFields.forEach((fieldValue) => {
      const badTokens = listMojibakeMatches(fieldValue);
      if (badTokens.length > 0) {
        warnings.push(`${modelPath}: mojibake tokens in field value -> ${badTokens.join(", ")}`);
      }
    });

    if (Array.isArray(model.features?.smart)) {
      const normalizedSmart = model.features.smart.map((item) => toText(item, "").toLowerCase()).filter(Boolean);
      if (new Set(normalizedSmart).size !== normalizedSmart.length) {
        warnings.push(`${modelPath}: duplicated entries in features.smart`);
      }
    }

    const key = modelName.toUpperCase();
    byModelName.set(key, (byModelName.get(key) || 0) + 1);
  });

  [...byModelName.entries()]
    .filter(([, count]) => count > 1)
    .forEach(([name, count]) => {
      errors.push(`duplicate modelName '${name}' appears ${count} times`);
    });

  console.log("validate-models-data: summary");
  console.log("models:", models.length);
  console.log("errors:", errors.length);
  console.log("warnings:", warnings.length);
  console.log("os distribution:");
  [...osCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([os, count]) => {
      console.log(`  - ${os}: ${count}`);
    });

  if (errors.length > 0) {
    console.log("\nErrors:");
    errors.slice(0, 80).forEach((item) => console.log("  - " + item));
  }

  if (warnings.length > 0) {
    console.log("\nWarnings:");
    warnings.slice(0, 120).forEach((item) => console.log("  - " + item));
  }

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

run();
