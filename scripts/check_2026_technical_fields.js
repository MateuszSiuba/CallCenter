const path = require('path');
const projectRoot = path.resolve(__dirname, '..');
const { loadBootstrapData } = require(path.join(projectRoot, 'backend', 'src', 'publicContentRepository.js'));

(async () => {
  const bootstrap = await loadBootstrapData(projectRoot);
  const models = bootstrap.ModelsData || [];

  const missing = [];
  for (const m of models) {
    if (m.year !== 2026) continue;
    const specs = m.specs || {};
    const hasTech = (specs.technicalByCategory && Object.keys(specs.technicalByCategory).length > 0) || (specs.technicalFlat && Object.keys(specs.technicalFlat).length > 0);
    if (!hasTech) missing.push(m.modelName);
  }

  console.log('Total 2026 models:', models.filter((m) => m.year === 2026).length);
  console.log('Models missing technicalByCategory/technicalFlat:', missing.length);
  if (missing.length) console.log(missing.join('\n'));
  else console.log('All 2026 models have extended technical fields.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
