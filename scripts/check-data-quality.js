const path = require("node:path");
const { spawnSync } = require("node:child_process");

const scripts = [
  "validate-models-data.js",
  "audit-models-language.js"
];

let hasFailure = false;

scripts.forEach((scriptName) => {
  const scriptPath = path.join(__dirname, scriptName);
  console.log(`\n=== Running ${scriptName} ===`);
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    hasFailure = true;
  }
});

if (hasFailure) {
  process.exitCode = 1;
}
