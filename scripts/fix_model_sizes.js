const path = require('path');
const { loadBootstrapData } = require('../backend/src/publicContentRepository');

function splitModelName(name) {
  if (!name) return { size: null, base: '' };
  const m = String(name).trim().match(/^\s*(\d{2,3})(.+)$/);
  if (m) return { size: m[1].replace(/^0+/, ''), base: m[2].trim() };
  return { size: null, base: String(name).trim() };
}

function choosePreferred(sizes) {
  const preferred = [50, 55, 48, 42, 40, 32, 24, 22, 21];
  const nums = Array.from(new Set(sizes.map((s) => Number(s)).filter((n) => Number.isFinite(n))));
  for (const p of preferred) {
    if (nums.includes(p)) return String(p);
  }
  if (nums.length > 0) return String(nums.sort((a, b) => a - b)[0]);
  return null;
}

function normalizeSizes(arr) {
  return Array.from(new Set((arr || []).map((s) => String(s).replace(/\D/g, '')).filter(Boolean)))
    .sort((a, b) => Number(a) - Number(b));
}

async function fixModels(projectRoot) {
  const bootstrap = await loadBootstrapData(projectRoot);
  const models = Array.isArray(bootstrap.ModelsData) ? bootstrap.ModelsData : [];
  if (!Array.isArray(models)) {
    console.error('No models loaded');
    return 1;
  }

  // Build family map by base name
  const families = new Map();
  for (const m of models) {
    const { size, base } = splitModelName(m.modelName);
    const key = base.toUpperCase();
    if (!families.has(key)) families.set(key, []);
    families.get(key).push({ model: m, size });
  }

  const updated = [];
  for (const [base, entries] of families.entries()) {
    const sizesSet = new Set();
    const yearCounts = new Map();
    for (const e of entries) {
      const m = e.model;
      if (e.size) sizesSet.add(String(e.size));
      if (Array.isArray(m.availableSizes)) for (const s of m.availableSizes) sizesSet.add(String(s));
      const y = Number(m.year) || 0;
      if (y > 0) yearCounts.set(y, (yearCounts.get(y) || 0) + 1);
    }

    const sizes = normalizeSizes(Array.from(sizesSet));
    const chosenSize = choosePreferred(sizes);
    const chosenYear = yearCounts.size > 0 ? Array.from(yearCounts.entries()).sort((a, b) => b[1] - a[1])[0][0] : 2026;

    // Build canonical model object
    const canonicalName = chosenSize ? String(chosenSize) + base : base;

    // Find or create canonical model in models list
    let canonical = models.find((x) => x.modelName === canonicalName);
    if (!canonical) {
      // try to reuse any existing entry for this base
      canonical = models.find((x) => x.modelName.toUpperCase().replace(/^\d{2,3}/, '') === base);
    }

    if (!canonical) {
      canonical = { modelName: canonicalName, year: chosenYear };
      models.push(canonical);
    }

    canonical.availableSizes = sizes.length > 0 ? sizes : canonical.availableSizes || [];
    canonical.year = chosenYear;

    // remove other per-size duplicates (we'll keep canonical)
    for (const e of entries) {
      if (!e.model) continue;
      if (e.model.modelName !== canonical.modelName) {
        const idx = models.findIndex((x) => x.modelName === e.model.modelName);
        if (idx >= 0) models.splice(idx, 1);
      }
    }

    updated.push(canonical.modelName);
  }

  const dataFile = path.join(projectRoot, 'data', 'models.js');
  const header = 'const ModelsData = ';
  const content = header + JSON.stringify(models, null, 2) + ";\n\nif (typeof module !== 'undefined') module.exports = { ModelsData };\n";
  fs.copyFileSync(dataFile, dataFile + '.bak');
  fs.writeFileSync(dataFile, content, 'utf8');
  console.log('Fixed models, updated canonical entries count:', updated.length);
  return 0;
}

if (require.main === module) {
  const projectRoot = path.resolve(__dirname, '..');
  fixModels(projectRoot)
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
