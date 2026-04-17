const fs = require("node:fs");
const vm = require("node:vm");

function toText(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text || fallback;
}

function loadModelsData(modelsPath) {
  const source = fs.readFileSync(modelsPath, "utf8");
  const context = {
    window: {}
  };

  vm.createContext(context);
  vm.runInContext(source, context);

  const models = Array.isArray(context.window.ModelsData)
    ? context.window.ModelsData
    : (Array.isArray(context.ModelsData) ? context.ModelsData : null);

  if (!Array.isArray(models)) {
    throw new Error("ModelsData array not found in " + modelsPath);
  }

  // Return a cloned copy so scripts mutate safely.
  return JSON.parse(JSON.stringify(models));
}

function saveModelsData(modelsPath, models) {
  const output = [
    "const ModelsData = " + JSON.stringify(models, null, 2) + ";",
    "if (typeof window !== \"undefined\") {",
    "  window.ModelsData = ModelsData;",
    "}",
    ""
  ].join("\n");

  fs.writeFileSync(modelsPath, output, "utf8");
}

module.exports = {
  loadModelsData,
  saveModelsData,
  toText
};
