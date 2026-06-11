#!/usr/bin/env node
const baseUrl = (process.argv[2] || "http://localhost:4000").replace(/\/$/, "");
const modelName = process.argv[3] || "55PUS9000";

async function readJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  const text = await response.text();
  let payload;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch (_error) {
    payload = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    payload
  };
}

function printSection(title, result) {
  console.log(`\n=== ${title} ===`);
  console.log(`HTTP ${result.status}`);
  console.log(JSON.stringify(result.payload, null, 2));
}

async function main() {
  const encodedModelName = encodeURIComponent(modelName);
  const [modelResult, searchResult] = await Promise.all([
    readJson(`${baseUrl}/api/models/${encodedModelName}`),
    readJson(`${baseUrl}/api/models/search?q=${encodedModelName}`)
  ]);

  printSection(`Model lookup: ${modelName}`, modelResult);
  printSection(`Search lookup: ${modelName}`, searchResult);

  if (!modelResult.ok || !searchResult.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
