const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeModelKey(value) {
  return toText(value).toUpperCase();
}

function getModelsFilePath(projectRoot) {
  return path.join(projectRoot, "data", "models.js");
}

function loadModelsData(projectRoot) {
  const modelsPath = getModelsFilePath(projectRoot);
  const source = fs.readFileSync(modelsPath, "utf8");
  const context = { window: {} };

  vm.createContext(context);
  vm.runInContext(source, context);

  const models = Array.isArray(context.window.ModelsData)
    ? context.window.ModelsData
    : (Array.isArray(context.ModelsData) ? context.ModelsData : null);

  if (!Array.isArray(models)) {
    throw new Error("ModelsData array not found in " + modelsPath);
  }

  return deepClone(models);
}

function saveModelsData(projectRoot, models) {
  const modelsPath = getModelsFilePath(projectRoot);
  const output = [
    "const ModelsData = " + JSON.stringify(models, null, 2) + ";",
    "if (typeof window !== \"undefined\") {",
    "  window.ModelsData = ModelsData;",
    "}",
    ""
  ].join("\n");

  fs.writeFileSync(modelsPath, output, "utf8");
}

function findModelIndex(models, modelNameOrAlias) {
  const target = normalizeModelKey(modelNameOrAlias);
  if (!target) {
    return -1;
  }

  return models.findIndex((model) => {
    const modelName = normalizeModelKey(model && model.modelName);
    if (modelName && modelName === target) {
      return true;
    }

    const aliases = Array.isArray(model && model.aliases) ? model.aliases : [];
    return aliases.some((alias) => normalizeModelKey(alias) === target);
  });
}

function sanitizeStringArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => toText(item))
    .filter(Boolean);
}

function sanitizeModel(input) {
  if (!isPlainObject(input)) {
    throw new Error("Model payload must be an object");
  }

  const modelName = toText(input.modelName);
  if (!modelName) {
    throw new Error("modelName is required");
  }

  const normalized = deepClone(input);
  normalized.modelName = modelName;

  if (normalized.year !== undefined && normalized.year !== null && normalized.year !== "") {
    const parsedYear = Number(normalized.year);
    if (!Number.isFinite(parsedYear)) {
      throw new Error("year must be a number");
    }

    normalized.year = Math.round(parsedYear);
  }

  if (normalized.availableSizes !== undefined) {
    normalized.availableSizes = sanitizeStringArray(normalized.availableSizes);
  }

  if (normalized.apps !== undefined) {
    normalized.apps = sanitizeStringArray(normalized.apps);
  }

  if (normalized.aliases !== undefined) {
    normalized.aliases = sanitizeStringArray(normalized.aliases);
  }

  if (normalized.features !== undefined && !isPlainObject(normalized.features)) {
    throw new Error("features must be an object");
  }

  if (normalized.specs !== undefined && !isPlainObject(normalized.specs)) {
    throw new Error("specs must be an object");
  }

  return normalized;
}

function setModel(models, currentModelName, nextModelPayload) {
  const nextModel = sanitizeModel(nextModelPayload);
  const existingIndex = findModelIndex(models, currentModelName);
  const nextNameConflictIndex = findModelIndex(models, nextModel.modelName);

  if (existingIndex >= 0) {
    if (nextNameConflictIndex >= 0 && nextNameConflictIndex !== existingIndex) {
      throw new Error("Another model already uses modelName or alias: " + nextModel.modelName);
    }

    models[existingIndex] = nextModel;
    return {
      action: "updated",
      model: deepClone(nextModel)
    };
  }

  if (nextNameConflictIndex >= 0) {
    throw new Error("Another model already uses modelName or alias: " + nextModel.modelName);
  }

  models.push(nextModel);
  return {
    action: "created",
    model: deepClone(nextModel)
  };
}

function deleteModel(models, modelNameOrAlias) {
  const index = findModelIndex(models, modelNameOrAlias);
  if (index < 0) {
    return null;
  }

  const removed = models.splice(index, 1)[0];
  return deepClone(removed);
}

function applyUnsetPaths(model, unsetPaths) {
  if (!Array.isArray(unsetPaths) || unsetPaths.length === 0) {
    return {
      removed: []
    };
  }

  const removed = [];

  for (const rawPath of unsetPaths) {
    const pathText = toText(rawPath);
    if (!pathText) {
      continue;
    }

    const parts = pathText.split(".").map((item) => item.trim()).filter(Boolean);
    if (parts.length === 0) {
      continue;
    }

    let cursor = model;
    for (let index = 0; index < parts.length - 1; index += 1) {
      const part = parts[index];
      if (!isPlainObject(cursor[part])) {
        cursor = null;
        break;
      }

      cursor = cursor[part];
    }

    if (!cursor) {
      continue;
    }

    const leafKey = parts[parts.length - 1];
    if (Object.prototype.hasOwnProperty.call(cursor, leafKey)) {
      delete cursor[leafKey];
      removed.push(pathText);
    }
  }

  return {
    removed
  };
}

module.exports = {
  applyUnsetPaths,
  deleteModel,
  findModelIndex,
  loadModelsData,
  saveModelsData,
  setModel,
  toText
};
