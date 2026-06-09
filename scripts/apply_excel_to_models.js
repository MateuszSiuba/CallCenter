const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const excelPath = path.join(projectRoot, '2026 PHILIPS TV PSS_v5.1_20260528.xlsx');
const missingPath = path.join(__dirname, 'tmp_missing_models.json');
const extractedPath = path.join(__dirname, 'extracted_tech.json');

const loader = require(path.join(projectRoot, 'backend', 'src', 'loadJsData.js'));
const bootstrap = loader.loadBootstrapData(projectRoot);
const models = bootstrap.ModelsData || [];

const missing = [];
for (const m of models) {
  if (m.year !== 2026) continue;
  const specs = m.specs || {};
  const hasTech = (specs.technicalByCategory && Object.keys(specs.technicalByCategory).length>0) || (specs.technicalFlat && Object.keys(specs.technicalFlat).length>0);
  if (!hasTech) missing.push(m.modelName);
}

if (missing.length === 0) {
  console.log('No missing 2026 models to process');
  process.exit(0);
}

fs.writeFileSync(missingPath, JSON.stringify(missing, null, 2), 'utf8');

// run python extractor
console.log('Calling Python extractor...');
const pythonExe = 'python';
const py = path.join(__dirname, 'extract_technical_from_excel.py');
const res = spawnSync(pythonExe, [py, excelPath, missingPath, extractedPath], { encoding: 'utf8' });
if (res.error) {
  console.error('Failed to run python:', res.error.message);
  process.exit(2);
}
if (res.status !== 0) {
  console.error('Python extractor exited non-zero');
  if (res.stdout) console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);
  process.exit(3);
}
console.log('Python extractor finished');

const extracted = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));
const keys = Object.keys(extracted);
console.log('Found extracted technical entries for', keys.length, 'models');

if (keys.length === 0) {
  console.log('No rows matched missing models in the workbook. Stopping.');
  process.exit(0);
}

// load original data/models.js via vm
function readDataVariable(filePath, variableName) {
  const source = fs.readFileSync(filePath, 'utf8');
  const vm = require('vm');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.window[variableName] || context[variableName] || null;
}

const dataFile = path.join(projectRoot, 'data', 'models.js');
const originalModels = readDataVariable(dataFile, 'ModelsData');
if (!originalModels) {
  console.error('Failed to load ModelsData from data/models.js');
  process.exit(4);
}

// apply extracted to originalModels
let applied = 0;
for (const modelName of Object.keys(extracted)) {
  const tech = extracted[modelName];
  // find model in originalModels by modelName or alias
  let m = originalModels.find(x => x.modelName === modelName || (Array.isArray(x.aliases) && x.aliases.includes(modelName)));
  if (!m) {
    // try substring match: model entries often are size+base (e.g., 55MLED911)
    m = originalModels.find(x => x.modelName && x.modelName.includes(modelName));
  }
  if (!m) continue;
  m.specs = m.specs || {};
  m.specs.technicalFlat = m.specs.technicalFlat || {};
  for (const k of Object.keys(tech)) {
    // store as flat keyed fields
    m.specs.technicalFlat[k] = tech[k];
  }
  applied++;
}

if (applied === 0) {
  console.log('No matching models found in data/models.js to apply extracted rows');
  process.exit(0);
}

// backup original file
fs.copyFileSync(dataFile, dataFile + '.bak');

// write back data/models.js with updated ModelsData
const header = "const ModelsData = ";
const content = header + JSON.stringify(originalModels, null, 2) + ";\n\nif (typeof module !== 'undefined') module.exports = { ModelsData };\n";
fs.writeFileSync(dataFile, content, 'utf8');
console.log('Applied extracted tech to', applied, 'models and updated data/models.js (backup created)');

// regenerate public models using existing script
console.log('Regenerating public/data/models.json...');
const regen = spawnSync('npm', ['run', 'regen-models'], { encoding: 'utf8' });
if (regen.error) console.error('Failed to run npm regen:', regen.error.message);
else console.log(regen.stdout);

console.log('Done. Please review changes and run tests/build.');
