const path = require("node:path");
const express = require("express");
const cors = require("cors");
const { loadBootstrapData } = require("./loadJsData");
const { applyMirroredMediaUrls } = require("./mediaMirror");

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
app.use("/media", express.static(path.join(__dirname, "..", "public", "media")));

function getPublicBaseUrl(req) {
  const forwardedProtoRaw = String(req.headers["x-forwarded-proto"] || "").trim();
  const forwardedProto = forwardedProtoRaw ? forwardedProtoRaw.split(",")[0].trim() : "";
  const protocol = forwardedProto || req.protocol || "https";
  return protocol + "://" + req.get("host");
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "callcenter-backend" });
});

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "callcenter-backend",
    message: "Backend is running. Use /health or /api/bootstrap.",
    endpoints: [
      "/health",
      "/api/bootstrap",
      "/api/models",
      "/api/knowledge",
      "/api/policies",
      "/api/changelog",
      "/api/documentation-links"
    ]
  });
});

app.get("/api/bootstrap", (req, res) => {
  try {
    const data = loadBootstrapData(projectRoot);
    res.json({
      ...data,
      ModelMediaData: applyMirroredMediaUrls(data.ModelMediaData, getPublicBaseUrl(req))
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "BOOTSTRAP_LOAD_FAILED",
      message: error && error.message ? error.message : "Unknown error"
    });
  }
});

app.get("/api/models", (req, res) => {
  try {
    const data = loadBootstrapData(projectRoot);
    res.json({
      ok: true,
      ModelsData: data.ModelsData || [],
      ModelPlatformChassisData: data.ModelPlatformChassisData || [],
      ModelMediaData: applyMirroredMediaUrls(data.ModelMediaData, getPublicBaseUrl(req)) || {}
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
