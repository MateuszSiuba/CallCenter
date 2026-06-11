const fs = require("node:fs");
const path = require("node:path");
const { getPool } = require("./db");

const projectRoot = path.resolve(__dirname, "..", "..");
const publicDataDir = path.join(projectRoot, "public", "data");

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

async function queryRows(text, values) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(text, values || []);
    return result.rows;
  } finally {
    client.release();
  }
}

async function queryOne(text, values) {
  const rows = await queryRows(text, values);
  return rows[0] || null;
}

function normalizeKnowledgeEntry(row) {
  return {
    id: toText(row.id),
    articleType: toText(row.article_type) || "article",
    title: toText(row.title),
    summary: toNullableText(row.summary),
    tags: toArray(row.tags),
    filters: toObject(row.filters),
    sections: toArray(row.sections),
    contentPoints: toArray(row.content_points),
    issue: toNullableText(row.issue),
    steps: toArray(row.steps),
    imageUrl: toNullableText(row.image_url),
    matchOs: toArray(row.match_os),
    matchChassis: toArray(row.match_chassis),
    sourceKey: toNullableText(row.source_key),
    sortOrder: Number(row.sort_order) || 100
  };
}

function normalizeManualRow(row) {
  return {
    label: toText(row.label),
    url: toText(row.url),
    sortOrder: Number(row.sort_order) || 100,
    metadata: toObject(row.metadata)
  };
}

function readJsonFile(filename, fallbackValue) {
  const filePath = path.join(publicDataDir, filename);
  try {
    if (!fs.existsSync(filePath)) {
      return fallbackValue;
    }

    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallbackValue;
  }
}

async function loadModelsData() {
  try {
    const rows = await queryRows(
      [
        "SELECT id, brand, year, canonical_model_name AS modelName, series_key, canonical_size, os_profile_id, panel_type, status, notes",
        "FROM models_series",
        "ORDER BY year DESC, canonical_model_name ASC"
      ].join(" ")
    );

    if (rows.length === 0) {
      return readJsonFile("models.json", []);
    }

    const seriesIds = rows.map((row) => row.id);
    const [variantRows, aliasRows, specRows] = await Promise.all([
      queryRows(
        "SELECT series_id, exact_model_name, size_inches, is_primary FROM model_variants WHERE series_id = ANY($1::bigint[]) ORDER BY series_id ASC, is_primary DESC, size_inches ASC, exact_model_name ASC",
        [seriesIds]
      ),
      queryRows(
        "SELECT series_id, alias_value FROM model_aliases WHERE series_id = ANY($1::bigint[]) ORDER BY series_id ASC, priority ASC, alias_value ASC",
        [seriesIds]
      ),
      queryRows(
        "SELECT series_id, technical_by_category, ports, features, raw_source FROM model_specs WHERE series_id = ANY($1::bigint[])",
        [seriesIds]
      )
    ]);

  const variantsBySeries = new Map();
  for (const row of variantRows) {
    const key = String(row.series_id);
    if (!variantsBySeries.has(key)) {
      variantsBySeries.set(key, []);
    }

    variantsBySeries.get(key).push({
      modelName: row.exact_model_name,
      size: String(row.size_inches),
      isPrimary: Boolean(row.is_primary)
    });
  }

  const aliasesBySeries = new Map();
  for (const row of aliasRows) {
    const key = String(row.series_id);
    if (!aliasesBySeries.has(key)) {
      aliasesBySeries.set(key, []);
    }

    aliasesBySeries.get(key).push(toText(row.alias_value));
  }

  const specsBySeries = new Map();
  for (const row of specRows) {
    specsBySeries.set(String(row.series_id), {
      technicalByCategory: toObject(row.technical_by_category),
      ports: toArray(row.ports),
      features: toObject(row.features),
      rawSource: toObject(row.raw_source)
    });
  }

    return rows.map((row) => ({
      id: row.id,
      brand: row.brand,
      year: Number(row.year),
      modelName: row.modelname || row.modelName,
      availableSizes: Array.from(new Set((variantsBySeries.get(String(row.id)) || []).map((variant) => variant.size).filter(Boolean))),
      aliases: Array.from(new Set(aliasesBySeries.get(String(row.id)) || [])),
      osProfileId: toNullableText(row.os_profile_id),
      panelType: toNullableText(row.panel_type),
      status: row.status,
      notes: toNullableText(row.notes),
      specs: specsBySeries.get(String(row.id)) || { technicalByCategory: {}, ports: [], features: {}, rawSource: {} }
    }));
  } catch (_error) {
    return readJsonFile("models.json", []);
  }
}

async function loadModelByName(modelName) {
  const normalizedModelName = toText(modelName).toUpperCase().replace(/[^A-Z0-9]+/g, "");

  try {
    const row = await queryOne(
      [
        "SELECT id, brand, year, canonical_model_name AS modelName, series_key, canonical_size, os_profile_id, panel_type, status, notes",
        "FROM models_series",
        "WHERE normalized_canonical_model_name = $1",
        "LIMIT 1"
      ].join(" "),
      [normalizedModelName]
    );

    if (!row) {
      const models = await loadModelsData();
      return models.find((item) => toText(item.modelName).toUpperCase().replace(/[^A-Z0-9]+/g, "") === normalizedModelName) || null;
    }

    const [variants, aliases, specs] = await Promise.all([
      queryRows(
        "SELECT exact_model_name, size_inches, is_primary FROM model_variants WHERE series_id = $1 ORDER BY is_primary DESC, size_inches ASC, exact_model_name ASC",
        [row.id]
      ),
      queryRows(
        "SELECT alias_value FROM model_aliases WHERE series_id = $1 ORDER BY priority ASC, alias_value ASC",
        [row.id]
      ),
      queryOne(
        "SELECT technical_by_category, ports, features, raw_source FROM model_specs WHERE series_id = $1 LIMIT 1",
        [row.id]
      )
    ]);

    return {
      id: row.id,
      brand: row.brand,
      year: Number(row.year),
      modelName: row.modelName,
      seriesKey: row.series_key,
      canonicalSize: String(row.canonical_size),
      osProfileId: toNullableText(row.os_profile_id),
      panelType: toNullableText(row.panel_type),
      status: row.status,
      notes: toNullableText(row.notes),
      availableSizes: Array.from(new Set(variants.map((variant) => String(variant.size_inches)).filter(Boolean))),
      aliases: Array.from(new Set(aliases.map((entry) => toText(entry.alias_value)).filter(Boolean))),
      specs: specs
        ? {
            technicalByCategory: toObject(specs.technical_by_category),
            ports: toArray(specs.ports),
            features: toObject(specs.features),
            rawSource: toObject(specs.raw_source)
          }
        : { technicalByCategory: {}, ports: [], features: {}, rawSource: {} }
    };
  } catch (_error) {
    const models = await loadModelsData();
    return models.find((item) => toText(item.modelName).toUpperCase().replace(/[^A-Z0-9]+/g, "") === normalizedModelName) || null;
  }
}

async function loadPoliciesData() {
  try {
    const rows = await queryRows(
      [
        "SELECT id, policy_name, match_tags, valid_years, criteria",
        "FROM policies",
        "ORDER BY valid_years DESC NULLS LAST, policy_name ASC"
      ].join(" ")
    );

    return rows.map((row) => ({
      id: row.id,
      policyName: row.policy_name,
      matchTags: toArray(row.match_tags),
      validYears: toArray(row.valid_years),
      criteria: toObject(row.criteria)
    }));
  } catch (_error) {
    return readJsonFile("policies.json", []);
  }
}

async function loadKnowledgeData() {
  try {
    const rows = await queryRows(
      [
        "SELECT id, article_type, title, summary, tags, filters, sections, content_points, issue, steps, image_url, match_os, match_chassis, source_key, sort_order",
        "FROM knowledge_articles",
        "ORDER BY sort_order ASC, article_type ASC, title ASC"
      ].join(" ")
    );

    if (rows.length === 0) {
      return readJsonFile("knowledge.json", []);
    }

    return rows.map(normalizeKnowledgeEntry);
  } catch (_error) {
    return readJsonFile("knowledge.json", []);
  }
}

async function loadKnowledgeArticlesForModel(model) {
  const modelOsProfileId = toText(model && model.osProfileId);
  const modelChassis = toText(model && model.platformChassis && model.platformChassis.chassis);

  try {
    const rows = await queryRows(
      [
        "SELECT id, article_type, title, summary, tags, filters, sections, content_points, issue, steps, image_url, match_os, match_chassis, source_key, sort_order",
        "FROM knowledge_articles",
        "WHERE (cardinality(match_os) = 0 OR $1 = '' OR match_os && ARRAY[$1]::text[])",
        "AND (cardinality(match_chassis) = 0 OR $2 = '' OR match_chassis && ARRAY[$2]::text[])",
        "ORDER BY sort_order ASC, article_type ASC, title ASC"
      ].join(" "),
      [modelOsProfileId, modelChassis]
    );

    if (rows.length > 0) {
      return rows.map(normalizeKnowledgeEntry);
    }
  } catch (_error) {
    // Fall back to filtering the full knowledge set if the related-content query fails.
  }

  const knowledge = await loadKnowledgeData();
  return knowledge.filter((entry) => {
    const matchOs = toArray(entry.matchOs);
    const matchChassis = toArray(entry.matchChassis);
    const osMatches = matchOs.length === 0 || (modelOsProfileId && matchOs.includes(modelOsProfileId));
    const chassisMatches = matchChassis.length === 0 || (modelChassis && matchChassis.includes(modelChassis));
    return osMatches && chassisMatches;
  });
}

async function loadChangelogData() {
  try {
    const rows = await queryRows(
      [
        "SELECT id, title, summary, body, date_iso, type, category",
        "FROM changelog_entries",
        "ORDER BY date_iso DESC NULLS LAST, id DESC"
      ].join(" ")
    );

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      summary: toNullableText(row.summary),
      body: toNullableText(row.body),
      dateIso: toNullableText(row.date_iso),
      type: toNullableText(row.type),
      category: toNullableText(row.category)
    }));
  } catch (_error) {
    return readJsonFile("changelog.json", []);
  }
}

async function loadDocumentationLinksData() {
  try {
    const [sourceRow, manualRows] = await Promise.all([
      queryOne(
        [
          "SELECT source_key, portal_url, search_url_template, source_meta",
          "FROM documentation_sources",
          "WHERE source_key = 'woodpecker'",
          "LIMIT 1"
        ].join(" ")
      ),
      queryRows(
        [
          "SELECT model_code, label, url, sort_order, metadata",
          "FROM model_manuals",
          "WHERE source_key = 'woodpecker'",
          "ORDER BY normalized_model_code ASC, sort_order ASC, label ASC"
        ].join(" ")
      )
    ]);

    const woodpecker = sourceRow
      ? {
          portalUrl: toNullableText(sourceRow.portal_url),
          searchUrlTemplate: toNullableText(sourceRow.search_url_template),
          sourceMeta: toObject(sourceRow.source_meta)
        }
      : {
          portalUrl: "",
          searchUrlTemplate: "",
          sourceMeta: {}
        };

    const manualsByModel = {};
    for (const row of manualRows) {
      const modelCode = toText(row.model_code);
      if (!manualsByModel[modelCode]) {
        manualsByModel[modelCode] = [];
      }

      manualsByModel[modelCode].push(normalizeManualRow(row));
    }

    return { woodpecker, manualsByModel };
  } catch (_error) {
    return readJsonFile("documentation-links.json", {
      woodpecker: { portalUrl: "", searchUrlTemplate: "", sourceMeta: {} },
      manualsByModel: {}
    });
  }
}

async function loadModelMediaData() {
  try {
    const rows = await queryRows(
      [
        "SELECT model_key, page_url, front_image_url, side_image_url, remote_image_url, ports_image_url, source_meta",
        "FROM model_media",
        "ORDER BY model_key ASC"
      ].join(" ")
    );

    const media = {};
    for (const row of rows) {
      media[toText(row.model_key)] = {
        pageUrl: toNullableText(row.page_url),
        frontImageUrl: toNullableText(row.front_image_url),
        sideImageUrl: toNullableText(row.side_image_url),
        remoteImageUrl: toNullableText(row.remote_image_url),
        portsImageUrl: toNullableText(row.ports_image_url),
        sourceMeta: toObject(row.source_meta)
      };
    }

    return media;
  } catch (_error) {
    return readJsonFile("model-media.json", {});
  }
}

async function loadModelPlatformChassisData() {
  try {
    const rows = await queryRows(
      [
        "SELECT model_name, platform, chassis, year",
        "FROM model_platform_chassis",
        "ORDER BY year DESC NULLS LAST, model_name ASC"
      ].join(" ")
    );

    return rows.map((row) => ({
      modelName: row.model_name,
      platform: toNullableText(row.platform),
      chassis: toNullableText(row.chassis),
      year: Number(row.year) || null
    }));
  } catch (_error) {
    return readJsonFile("model-platform-chassis.json", []);
  }
}

async function loadBootstrapData() {
  const [models, policies, knowledge, changelog, docs, media, chassis] = await Promise.all([
    loadModelsData(),
    loadPoliciesData(),
    loadKnowledgeData(),
    loadChangelogData(),
    loadDocumentationLinksData(),
    loadModelMediaData(),
    loadModelPlatformChassisData()
  ]);

  return {
    meta: {
      bootstrapVersion: "postgres-backed",
      loadedAt: new Date().toISOString()
    },
    ModelsData: models,
    PoliciesData: policies,
    KnowledgeBaseData: knowledge,
    ChangelogEntriesData: changelog,
    DocumentationLinksData: docs,
    ModelMediaData: media,
    ModelPlatformChassisData: chassis,
    TroubleshootingData: {}
  };
}

module.exports = {
  loadBootstrapData,
  loadChangelogData,
  loadDocumentationLinksData,
  loadKnowledgeData,
  loadKnowledgeArticlesForModel,
  loadModelByName,
  loadModelMediaData,
  loadModelPlatformChassisData,
  loadModelsData,
  loadPoliciesData,
  queryOne,
  queryRows
};