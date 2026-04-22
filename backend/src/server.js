const path = require("node:path");
const express = require("express");
const cors = require("cors");
const { loadBootstrapData } = require("./loadJsData");

const app = express();
const port = Number(process.env.PORT || 4000);
const projectRoot = path.resolve(__dirname, "..", "..");
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";

function buildCorsOriginRule(value) {
  const raw = String(value || "").trim();
  if (!raw || raw === "*") {
    return "*";
  }

  const origins = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    return "*";
  }

  return origins;
}

app.use(cors({ origin: buildCorsOriginRule(allowedOrigin) }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "callcenter-backend" });
});

app.get("/api/bootstrap", (_req, res) => {
  try {
    const data = loadBootstrapData(projectRoot);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "BOOTSTRAP_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.get("/api/models", (_req, res) => {
  try {
    const data = loadBootstrapData(projectRoot);
    res.json({
      ok: true,
      ModelsData: data.ModelsData || [],
      ModelPlatformChassisData: data.ModelPlatformChassisData || [],
      ModelMediaData: data.ModelMediaData || {}
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "MODELS_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.get("/api/knowledge", (_req, res) => {
  try {
    const data = loadBootstrapData(projectRoot);
    res.json({
      ok: true,
      KnowledgeBaseData: data.KnowledgeBaseData || [],
      TroubleshootingData: data.TroubleshootingData || {}
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "KNOWLEDGE_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.get("/api/policies", (_req, res) => {
  try {
    const data = loadBootstrapData(projectRoot);
    res.json({
      ok: true,
      PoliciesData: data.PoliciesData || {}
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "POLICIES_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.get("/api/changelog", (_req, res) => {
  try {
    const data = loadBootstrapData(projectRoot);
    res.json({
      ok: true,
      ChangelogEntriesData: data.ChangelogEntriesData || []
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "CHANGELOG_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.get("/api/documentation-links", (_req, res) => {
  try {
    const data = loadBootstrapData(projectRoot);
    res.json({
      ok: true,
      DocumentationLinksData: data.DocumentationLinksData || {}
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "DOCUMENTATION_LINKS_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.listen(port, () => {
  console.log("CallCenter backend listening on http://localhost:" + String(port));
});
