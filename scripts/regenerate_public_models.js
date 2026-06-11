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

const { loadBootstrapData } = require(path.join(projectRoot, 'backend', 'src', 'publicContentRepository.js'));

(async () => {
  const bootstrap = await loadBootstrapData(projectRoot);
  const models = bootstrap.ModelsData || [];
  try {
    fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'models.json'), JSON.stringify(models, null, 2), 'utf8');
    console.log('Wrote public/data/models.json from backend bootstrap (merged)');
  } catch (err) {
    console.error('Failed to write public models.json:', err && err.message);
    process.exit(2);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
