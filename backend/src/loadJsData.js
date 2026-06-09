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
  // collapse per-size models into single base entries (e.g., 55MLED911 -> MLED911)
  mergeModelsByBase(bootstrap);

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

function mergeModelsByBase(bootstrap) {
  try {
    const groups = new Map();
    const keep = [];

    // helper to extract leading size (one to three digits) and base name
    const splitModel = (name) => {
      if (!name || typeof name !== 'string') return { size: null, base: name };
      const m = name.match(/^\s*(\d{2,3})(.+)$/);
      if (m) return { size: m[1].replace(/^0+/, '') || null, base: m[2].trim() };
      return { size: null, base: name.trim() };
    };

    for (const model of bootstrap.ModelsData || []) {
      if (!model || !model.modelName) continue;
      const { size, base } = splitModel(model.modelName);
      if (!size) {
        // track models already without size prefix
        groups.set(model.modelName, groups.get(model.modelName) || []);
        groups.get(model.modelName).push(model);
        continue;
      }
      const key = base;
      groups.set(key, groups.get(key) || []);
      groups.get(key).push({ model, size });
    }

    const processed = new Set();
    for (const [base, entries] of groups.entries()) {
      if (!entries || entries.length <= 1) continue;

      // collect sizes, years and source models
      const sizesSet = new Set();
      const yearCounts = new Map();
      const merged = {};
      const sources = [];

      for (const item of entries) {
        const m = item.model || item;
        const size = (item.size || (Array.isArray(m.availableSizes) && m.availableSizes[0])) || null;
        if (size) sizesSet.add(String(size));
        if (Array.isArray(m.availableSizes)) {
          for (const s of m.availableSizes) sizesSet.add(String(s));
        }
        const y = Number(m.year) || 0;
        if (y > 0) yearCounts.set(y, (yearCounts.get(y) || 0) + 1);
        sources.push(m);
        processed.add(m.modelName);
      }

      // Choose canonical year: most common among sources, fallback to 2026
      let chosenYear = 2026;
      if (yearCounts.size > 0) {
        chosenYear = Array.from(yearCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];
      }

      // Determine preferred canonical size using explicit preference order
      const preferredOrder = [50, 55, 48, 42, 40, 32, 24, 22, 21];
      let chosenSize = null;
      const sizesArr = Array.from(sizesSet).map((s) => Number(s)).filter((n) => Number.isFinite(n));
      // try preference order
      for (const p of preferredOrder) {
        if (sizesArr.includes(p)) {
          chosenSize = String(p);
          break;
        }
      }
      // fallback to smallest numeric size if no preferred found
      if (!chosenSize && sizesArr.length > 0) {
        chosenSize = String(sizesArr.sort((a, b) => a - b)[0]);
      }

      // Build merged object by shallow-filling from sources (preserve first non-empty seen)
      for (const s of sources) {
        for (const k of Object.keys(s)) {
          if (k === 'modelName' || k === 'availableSizes') continue;
          if (merged[k] == null || merged[k] === '' || (Array.isArray(merged[k]) && merged[k].length === 0)) {
            merged[k] = s[k];
          }
        }
      }

      merged.year = chosenYear;
      merged.availableSizes = Array.from(sizesSet).sort((a, b) => Number(a) - Number(b));

      // Set the canonical modelName to include preferred size when available (e.g., 50PML9000)
      const canonicalName = chosenSize ? String(chosenSize) + base : base;
      merged.modelName = canonicalName;

      // remove processed models from ModelsData (but keep any unrelated entries)
      bootstrap.ModelsData = bootstrap.ModelsData.filter((m) => !processed.has(m.modelName));

      // ensure we don't duplicate an existing entry for canonicalName
      const idx = bootstrap.ModelsData.findIndex((m) => m.modelName === canonicalName);
      if (idx >= 0) bootstrap.ModelsData[idx] = merged;
      else bootstrap.ModelsData.push(merged);
    }
  } catch (err) {
    console.error('mergeModelsByBase error:', err && err.message);
  }
}

module.exports = {
  loadBootstrapData
};
