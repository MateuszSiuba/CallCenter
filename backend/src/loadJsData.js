const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function readDataVariable(filePath, variableName) {
  const source = fs.readFileSync(filePath, "utf8");
  const context = { window: {} };

  vm.createContext(context);
  vm.runInContext(source, context);

  return context.window[variableName] || context[variableName] || null;
}

function loadBootstrapData(projectRoot) {
  const dataDir = path.join(projectRoot, "data");
  const knowledgeFilePath = path.join(dataDir, "knowledge.js");
  const troubleshootingData = readDataVariable(knowledgeFilePath, "TroubleshootingData") || {};
  const knowledgeBaseData = readDataVariable(knowledgeFilePath, "KnowledgeBaseData") || [];

  return {
    meta: {
      bootstrapVersion: "2026-04-22",
      loadedAt: new Date().toISOString()
    },
    ModelsData: readDataVariable(path.join(dataDir, "models.js"), "ModelsData") || [],
    ModelPlatformChassisData:
      readDataVariable(path.join(dataDir, "model-platform-chassis.js"), "ModelPlatformChassisData") || [],
    PoliciesData: readDataVariable(path.join(dataDir, "policies.js"), "PoliciesData") || {},
    TroubleshootingData: troubleshootingData,
    KnowledgeBaseData: knowledgeBaseData,
    ModelMediaData: readDataVariable(path.join(dataDir, "model-media.js"), "ModelMediaData") || {},
    ChangelogEntriesData: readDataVariable(path.join(dataDir, "changelog.js"), "ChangelogEntriesData") || [],
    DocumentationLinksData:
      readDataVariable(path.join(dataDir, "documentation-links.js"), "DocumentationLinksData") || {}
  };
}

module.exports = {
  loadBootstrapData
};
