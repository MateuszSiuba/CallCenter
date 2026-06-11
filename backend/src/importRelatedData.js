const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { getPool } = require("./db");

const projectRoot = path.resolve(__dirname, "..", "..");
const dataDir = path.join(projectRoot, "data");

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function toNullableText(value) {
  const text = toText(value);
  return text ? text : null;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toObject(value) {
  return isPlainObject(value) ? value : {};
}

function loadLegacyJsData(fileName, exportKey) {
  const filePath = path.join(dataDir, fileName);
  const source = fs.readFileSync(filePath, "utf8");
  const extractionSuffix = "\n;window.__EXTRACTED_DATA__ = (typeof " + exportKey + " !== 'undefined' ? " + exportKey + " : (window && window." + exportKey + " ? window." + exportKey + " : {}));\n";
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  sandbox.window.globalThis = sandbox.window;
  sandbox.window.self = sandbox.window;
  sandbox.globalThis = sandbox.window;
  sandbox.global = sandbox.window;
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(source + extractionSuffix, sandbox);
  return sandbox.window.__EXTRACTED_DATA__ || sandbox.window[exportKey] || sandbox[exportKey] || {};
}

function normalizeKnowledgeRows(troubleshootingData, knowledgeBaseData) {
  const rows = [];

  Object.entries(toObject(troubleshootingData.byOS)).forEach(([osName, issues]) => {
    toArray(issues).forEach((issue, index) => {
      rows.push({
        id: "troubleshooting-os-" + toText(osName).toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + String(index + 1),
        article_type: "troubleshooting_os",
        title: toText(issue && issue.issue) || toText(osName),
        summary: toNullableText(issue && issue.issue),
        tags: [toText(osName), "troubleshooting"].filter(Boolean),
        filters: { os: [toText(osName)] },
        sections: [],
        content_points: toArray(issue && issue.steps),
        issue: toNullableText(issue && issue.issue),
        steps: toArray(issue && issue.steps),
        image_url: null,
        match_os: [toText(osName)].filter(Boolean),
        match_chassis: [],
        source_key: "legacy-troubleshooting",
        sort_order: 10 + index
      });
    });
  });

  Object.entries(toObject(troubleshootingData.byChassis)).forEach(([chassisName, issues]) => {
    toArray(issues).forEach((issue, index) => {
      rows.push({
        id: "troubleshooting-chassis-" + toText(chassisName).toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + String(index + 1),
        article_type: "troubleshooting_chassis",
        title: toText(issue && issue.issue) || toText(chassisName),
        summary: toNullableText(issue && issue.issue),
        tags: [toText(chassisName), "troubleshooting"].filter(Boolean),
        filters: { chassis: [toText(chassisName)] },
        sections: [],
        content_points: toArray(issue && issue.steps),
        issue: toNullableText(issue && issue.issue),
        steps: toArray(issue && issue.steps),
        image_url: null,
        match_os: [],
        match_chassis: [toText(chassisName)].filter(Boolean),
        source_key: "legacy-troubleshooting",
        sort_order: 20 + index
      });
    });
  });

  toArray(knowledgeBaseData).forEach((article, index) => {
    rows.push({
      id: toText(article && article.id) || "kb-" + String(index + 1),
      article_type: "article",
      title: toText(article && article.title),
      summary: toNullableText(article && article.summary),
      tags: toArray(article && article.tags),
      filters: toObject(article && article.filters),
      sections: toArray(article && article.sections),
      content_points: toArray(article && article.contentPoints),
      issue: null,
      steps: [],
      image_url: toNullableText(article && article.imageUrl),
      match_os: toArray(article && article.filters && article.filters.os),
      match_chassis: toArray(article && article.filters && article.filters.chassis),
      source_key: "legacy-knowledge",
      sort_order: 100 + index
    });
  });

  return rows;
}

function normalizeDocumentationData(documentationLinksData) {
  const woodpecker = toObject(documentationLinksData.woodpecker);
  const manualsByModel = toObject(documentationLinksData.manualsByModel);
  const manualRows = [];

  Object.entries(manualsByModel).forEach(([modelCode, links]) => {
    toArray(links).forEach((entry, index) => {
      manualRows.push({
        source_key: "woodpecker",
        model_code: toText(modelCode),
        label: toText(entry && entry.label) || "Manual " + String(index + 1),
        url: toText(entry && entry.url),
        sort_order: 100 + index,
        metadata: {}
      });
    });
  });

  return {
    source: {
      source_key: "woodpecker",
      portal_url: toNullableText(woodpecker.portalUrl),
      search_url_template: toNullableText(woodpecker.searchUrlTemplate),
      source_meta: toObject(woodpecker.sourceMeta)
    },
    manualRows
  };
}

function normalizeMediaRows(modelMediaData) {
  return Object.entries(toObject(modelMediaData)).map(([modelKey, media]) => ({
    model_key: toText(modelKey),
    page_url: toNullableText(media && media.pageUrl),
    front_image_url: toNullableText(media && media.frontImageUrl),
    side_image_url: toNullableText(media && media.sideImageUrl),
    remote_image_url: toNullableText(media && media.remoteImageUrl),
    ports_image_url: toNullableText(media && media.portsImageUrl),
    source_meta: toObject(media && media.sourceMeta)
  }));
}

async function upsertKnowledgeArticles(client, rows) {
  for (const row of rows) {
    await client.query(
      [
        "INSERT INTO knowledge_articles (id, article_type, title, summary, tags, filters, sections, content_points, issue, steps, image_url, match_os, match_chassis, source_key, sort_order)",
        "VALUES ($1, $2, $3, $4, $5::text[], $6::jsonb, $7::jsonb, $8::text[], $9, $10::text[], $11, $12::text[], $13::text[], $14, $15)",
        "ON CONFLICT (id) DO UPDATE SET",
        "article_type = EXCLUDED.article_type,",
        "title = EXCLUDED.title,",
        "summary = EXCLUDED.summary,",
        "tags = EXCLUDED.tags,",
        "filters = EXCLUDED.filters,",
        "sections = EXCLUDED.sections,",
        "content_points = EXCLUDED.content_points,",
        "issue = EXCLUDED.issue,",
        "steps = EXCLUDED.steps,",
        "image_url = EXCLUDED.image_url,",
        "match_os = EXCLUDED.match_os,",
        "match_chassis = EXCLUDED.match_chassis,",
        "source_key = EXCLUDED.source_key,",
        "sort_order = EXCLUDED.sort_order,",
        "updated_at = NOW()"
      ].join(" "),
      [row.id, row.article_type, row.title, row.summary, row.tags, JSON.stringify(row.filters), JSON.stringify(row.sections), row.content_points, row.issue, row.steps, row.image_url, row.match_os, row.match_chassis, row.source_key, row.sort_order]
    );
  }
}

async function upsertDocumentationSources(client, sourceRow, manualRows) {
  await client.query(
    [
      "INSERT INTO documentation_sources (source_key, portal_url, search_url_template, source_meta)",
      "VALUES ($1, $2, $3, $4::jsonb)",
      "ON CONFLICT (source_key) DO UPDATE SET",
      "portal_url = EXCLUDED.portal_url,",
      "search_url_template = EXCLUDED.search_url_template,",
      "source_meta = EXCLUDED.source_meta,",
      "updated_at = NOW()"
    ].join(" "),
    [sourceRow.source_key, sourceRow.portal_url, sourceRow.search_url_template, JSON.stringify(sourceRow.source_meta)]
  );

  for (const row of manualRows) {
    await client.query(
      [
        "INSERT INTO model_manuals (source_key, model_code, label, url, sort_order, metadata)",
        "VALUES ($1, $2, $3, $4, $5, $6::jsonb)",
        "ON CONFLICT (normalized_model_code, label, url) DO UPDATE SET",
        "source_key = EXCLUDED.source_key,",
        "model_code = EXCLUDED.model_code,",
        "sort_order = EXCLUDED.sort_order,",
        "metadata = EXCLUDED.metadata,",
        "updated_at = NOW()"
      ].join(" "),
      [row.source_key, row.model_code, row.label, row.url, row.sort_order, JSON.stringify(row.metadata)]
    );
  }
}

async function upsertModelMedia(client, rows) {
  for (const row of rows) {
    await client.query(
      [
        "INSERT INTO model_media (model_key, page_url, front_image_url, side_image_url, remote_image_url, ports_image_url, source_meta)",
        "VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)",
        "ON CONFLICT (normalized_model_key) DO UPDATE SET",
        "model_key = EXCLUDED.model_key,",
        "page_url = EXCLUDED.page_url,",
        "front_image_url = EXCLUDED.front_image_url,",
        "side_image_url = EXCLUDED.side_image_url,",
        "remote_image_url = EXCLUDED.remote_image_url,",
        "ports_image_url = EXCLUDED.ports_image_url,",
        "source_meta = EXCLUDED.source_meta,",
        "updated_at = NOW()"
      ].join(" "),
      [row.model_key, row.page_url, row.front_image_url, row.side_image_url, row.remote_image_url, row.ports_image_url, JSON.stringify(row.source_meta)]
    );
  }
}

async function main() {
  const pool = getPool();
  const client = await pool.connect();
  const shouldReset = process.argv.includes("--reset") || process.argv.includes("--truncate");

  try {
    const troubleshootingData = loadLegacyJsData("knowledge.js", "TroubleshootingData");
    const knowledgeBaseData = loadLegacyJsData("knowledge.js", "KnowledgeBaseData");
    const documentationLinksData = loadLegacyJsData("documentation-links.js", "DocumentationLinksData");
    const modelMediaData = loadLegacyJsData("model-media.js", "ModelMediaData");

    const knowledgeRows = normalizeKnowledgeRows(troubleshootingData, knowledgeBaseData);
    const documentationRows = normalizeDocumentationData(documentationLinksData);
    const mediaRows = normalizeMediaRows(modelMediaData);

    await client.query("BEGIN");

    if (shouldReset) {
      await client.query("TRUNCATE TABLE knowledge_articles, model_manuals, model_media, documentation_sources RESTART IDENTITY CASCADE");
    }

    await upsertDocumentationSources(client, documentationRows.source, documentationRows.manualRows);
    await upsertModelMedia(client, mediaRows);
    await upsertKnowledgeArticles(client, knowledgeRows);

    await client.query("COMMIT");
    console.log("Imported related data: knowledge=" + String(knowledgeRows.length) + ", manuals=" + String(documentationRows.manualRows.length) + ", media=" + String(mediaRows.length));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});