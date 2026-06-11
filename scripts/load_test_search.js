#!/usr/bin/env node
const { spawnSync } = require("node:child_process");

const defaultUrl = "http://localhost:4000/api/models/search?q=55PUS9000";
const url = process.argv[2] || defaultUrl;
const connections = process.argv[3] || "100";
const durationSeconds = process.argv[4] || "10";

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  [
    "--yes",
    "autocannon",
    "-c",
    String(connections),
    "-d",
    String(durationSeconds),
    url
  ],
  {
    stdio: "inherit",
    env: process.env
  }
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status || 0);
