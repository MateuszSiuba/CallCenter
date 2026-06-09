const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');
const publicDir = path.join(projectRoot, 'public', 'data');

function readDataVariable(filePath, variableName) {
  const source = fs.readFileSync(filePath, 'utf8');
  const vm = require('vm');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.window[variableName] || context[variableName] || null;
}

const models = readDataVariable(path.join(dataDir, 'models.js'), 'ModelsData') || [];
const mappings = readDataVariable(path.join(dataDir, 'model-platform-chassis.js'), 'ModelPlatformChassisData') || [];

const map = new Map();
for (const entry of mappings) {
  if (!entry || !entry.modelName) continue;
  map.set(String(entry.modelName).trim(), { platform: entry.platform || '', chassis: entry.chassis || '' });
}

for (const model of models) {
  if (!model || !model.modelName) continue;
  const is2026 = model.year === 2026;
  const endsWith1 = /1$/.test(model.modelName);
  if (!is2026 || !endsWith1) continue;
  const lookupKeys = [model.modelName];
  if (Array.isArray(model.aliases)) lookupKeys.push(...model.aliases);

  let found = null;
  for (const k of lookupKeys) {
    if (!k) continue;
    const normalized = String(k).trim();
    if (map.has(normalized)) {
      found = map.get(normalized);
      break;
    }
    const alt = normalized.replace(/\/.+$/, '');
    if (map.has(alt)) {
      found = map.get(alt);
      break;
    }
  }

  if (found) {
    if (!model.platform || model.platform === '') model.platform = found.platform || '';
    if ((!model.specs || !model.specs.chassis) && found.chassis) {
      model.specs = model.specs || {};
      model.specs.chassis = found.chassis;
    }
  }
}

try {
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'models.json'), JSON.stringify(models, null, 2), 'utf8');
  console.log('Wrote public/data/models.json with merged platform/chassis for 2026 models ending with 1');
} catch (err) {
  console.error('Failed to write public models.json:', err && err.message);
  process.exit(2);
}
