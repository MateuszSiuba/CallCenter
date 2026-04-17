const path = require("path");
const {
  loadModelsData,
  saveModelsData,
  toText
} = require("./lib/models-io");

const rootDir = path.resolve(__dirname, "..");
const modelsPath = path.join(rootDir, "data", "models.js");

const models = loadModelsData(modelsPath);

const SIZE_PRIORITY = ["55", "50", "65", "48", "42"];

function pickDefaultSize(availableSizes) {
  const sizes = Array.isArray(availableSizes)
    ? availableSizes.map((size) => toText(size)).filter(Boolean)
    : [];

  for (const preferred of SIZE_PRIORITY) {
    if (sizes.includes(preferred)) {
      return preferred;
    }
  }

  return sizes[0] || "";
}

function normalizeModelName(modelName, defaultSize) {
  const raw = toText(modelName).toUpperCase();
  const withoutSizePrefix = raw.replace(/^\d{2,3}(?=[A-Z])/, "");
  const enforcedBase = /^\d+$/.test(withoutSizePrefix)
    ? "PUS" + withoutSizePrefix
    : withoutSizePrefix;

  if (!defaultSize) {
    return enforcedBase;
  }

  return defaultSize + enforcedBase;
}

function flattenFeatureValues(features) {
  if (!features || typeof features !== "object") {
    return [];
  }

  return Object.values(features).flatMap((featureValue) => {
    if (Array.isArray(featureValue)) {
      return featureValue.map((item) => toText(item)).filter(Boolean);
    }

    const single = toText(featureValue);
    return single ? [single] : [];
  });
}

function extractSpecs(model) {
  const features = model && model.features ? model.features : {};
  const allValues = flattenFeatureValues(features);
  const audioValues = Array.isArray(features.audio)
    ? features.audio.map((item) => toText(item)).filter(Boolean)
    : [];
  const smartValues = Array.isArray(features.smart)
    ? features.smart.map((item) => toText(item)).filter(Boolean)
    : [];
  const sourceValues = [...audioValues, ...smartValues, ...allValues];

  const existingAudioChannels = toText(model.audioChannels);
  const existingAudioPower = toText(model.audioPower);
  const existingWifiStandard = toText(model.wifiStandard);
  const existingBluetoothVersion = toText(model.bluetoothVersion);
  const existingVrrMaxRefreshRate = toText(model.vrrMaxRefreshRate);

  let audioChannels = existingAudioChannels;
  if (!audioChannels) {
    const channelValues = sourceValues
      .map((value) => value.match(/(\d+(?:\.\d+)?)\s*ch\b/i))
      .filter(Boolean)
      .map((match) => Number(match[1]))
      .filter((num) => Number.isFinite(num));

    if (channelValues.length > 0) {
      audioChannels = String(Math.max(...channelValues)) + " CH";
    }
  }

  let audioPower = existingAudioPower;
  if (!audioPower) {
    const wattValues = sourceValues.flatMap((value) => {
      const matches = value.match(/(\d{2,3})\s*w\b/ig);
      if (!matches) {
        return [];
      }
      return matches
        .map((match) => Number((match.match(/\d+/) || [""])[0]))
        .filter((num) => Number.isFinite(num));
    });

    if (wattValues.length > 0) {
      audioPower = String(Math.max(...wattValues)) + "W";
    }
  }

  let wifiStandard = existingWifiStandard;
  if (!wifiStandard) {
    wifiStandard = sourceValues.find((value) => /wi\s*-?\s*fi\b/i.test(value)) || "";
  }

  let bluetoothVersion = existingBluetoothVersion;
  if (!bluetoothVersion) {
    const btMatch = sourceValues
      .map((value) => value.match(/bluetooth\s*([0-9]+(?:\.[0-9]+)?)/i))
      .find(Boolean);
    if (btMatch) {
      bluetoothVersion = "Bluetooth " + btMatch[1];
    }
  }

  let vrrMaxRefreshRate = existingVrrMaxRefreshRate;
  if (!vrrMaxRefreshRate) {
    const hzValues = sourceValues.flatMap((value) => {
      if (!/vrr/i.test(value)) {
        return [];
      }
      const matches = value.match(/(\d{2,3})\s*hz/ig);
      if (!matches) {
        return [];
      }
      return matches
        .map((match) => Number((match.match(/\d+/) || [""])[0]))
        .filter((num) => Number.isFinite(num));
    });

    if (hzValues.length > 0) {
      vrrMaxRefreshRate = String(Math.max(...hzValues)) + " Hz";
    }
  }

  return {
    audioChannels,
    audioPower,
    wifiStandard,
    bluetoothVersion,
    vrrMaxRefreshRate
  };
}

function isRedundantSpecFeature(value) {
  const normalized = toText(value).toLowerCase();
  if (!normalized) {
    return false;
  }

  if (normalized.includes("wifi") || normalized.includes("bluetooth")) {
    return true;
  }

  if (/\b\d+(?:\.\d+)?\s*ch\b/i.test(normalized)) {
    return true;
  }

  if (/\b\d{2,3}\s*w\b/i.test(normalized)) {
    return true;
  }

  if (/vrr/i.test(normalized) && /\b\d{2,3}\s*hz\b/i.test(normalized)) {
    return true;
  }

  return false;
}

for (const model of models) {
  const defaultSize = pickDefaultSize(model.availableSizes);
  model.modelName = normalizeModelName(model.modelName, defaultSize);

  const extracted = extractSpecs(model);
  model.audioChannels = extracted.audioChannels;
  model.audioPower = extracted.audioPower;
  model.wifiStandard = extracted.wifiStandard;
  model.bluetoothVersion = extracted.bluetoothVersion;
  model.vrrMaxRefreshRate = extracted.vrrMaxRefreshRate;

  if (model.features && typeof model.features === "object") {
    for (const key of Object.keys(model.features)) {
      const featureValue = model.features[key];
      if (!Array.isArray(featureValue)) {
        continue;
      }
      model.features[key] = featureValue.filter((item) => !isRedundantSpecFeature(item));
    }
  }
}

saveModelsData(modelsPath, models);
console.log("Migrated models:", models.length);
