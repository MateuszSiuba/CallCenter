const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function readDataVariable(filePath, variableName) {
  const source = fs.readFileSync(filePath, "utf8");
  const context = { window: {} };

  vm.createContext(context);
  vm.runInContext(source, context);

  return context.window[variableName] || context[variableName] || null;
}

function loadBootstrapData(projectRoot) {
  const dataDir = path.join(projectRoot, "data");
  const knowledgeFilePath = path.join(dataDir, "knowledge.js");
  const troubleshootingData = readDataVariable(knowledgeFilePath, "TroubleshootingData") || {};
  const knowledgeBaseData = readDataVariable(knowledgeFilePath, "KnowledgeBaseData") || [];
  const bootstrap = {
    meta: {
      bootstrapVersion: "2026-04-22",
      loadedAt: new Date().toISOString()
    },
    ModelsData: readDataVariable(path.join(dataDir, "models.js"), "ModelsData") || [],
    ModelPlatformChassisData:
      readDataVariable(path.join(dataDir, "model-platform-chassis.js"), "ModelPlatformChassisData") || [],
    PoliciesData: readDataVariable(path.join(dataDir, "policies.js"), "PoliciesData") || {},
    TroubleshootingData: troubleshootingData,
    KnowledgeBaseData: knowledgeBaseData,
    ModelMediaData: readDataVariable(path.join(dataDir, "model-media.js"), "ModelMediaData") || {},
    ChangelogEntriesData: readDataVariable(path.join(dataDir, "changelog.js"), "ChangelogEntriesData") || [],
    DocumentationLinksData:
      readDataVariable(path.join(dataDir, "documentation-links.js"), "DocumentationLinksData") || {}
  };

  // merge platform/chassis hints into ModelsData for 2026 models ending with '1'
  mergePlatformChassis(projectRoot, bootstrap);

  return bootstrap;
}

function mergePlatformChassis(projectRoot, bootstrap) {
  try {
    const map = new Map();
    for (const entry of bootstrap.ModelPlatformChassisData || []) {
      if (!entry || !entry.modelName) continue;
      const key = String(entry.modelName).trim();
      map.set(key, { platform: entry.platform || "", chassis: entry.chassis || "" });
    }

    for (const model of bootstrap.ModelsData || []) {
      if (!model || !model.modelName) continue;
      // target year 2026 models (as requested) and those with trailing '1' in name
      const is2026 = model.year === 2026;
      const endsWith1 = /1$/.test(model.modelName);
      if (!is2026 || !endsWith1) continue;

      const lookupKeys = [model.modelName];
      // also try aliases if present
      if (Array.isArray(model.aliases)) lookupKeys.push(...model.aliases);

      let found = null;
      for (const k of lookupKeys) {
        if (!k) continue;
        const normalized = String(k).trim();
        if (map.has(normalized)) {
          found = map.get(normalized);
          break;
        }
        // try remove any /xx suffixes used in mapping file
        const alt = normalized.replace(/\/.+$/, "");
        if (map.has(alt)) {
          found = map.get(alt);
          break;
        }
      }

      if (found) {
        if (!model.platform || model.platform === "") model.platform = found.platform || "";
        if ((!model.specs || !model.specs.chassis) && found.chassis) {
          model.specs = model.specs || {};
          model.specs.chassis = found.chassis;
        }
      }
    }
  } catch (err) {
    // swallow errors - non-fatal for bootstrap
    console.error('mergePlatformChassis error:', err && err.message);
  }
}

module.exports = {
  loadBootstrapData
};
