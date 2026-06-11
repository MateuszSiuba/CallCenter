const NodeCache = require("node-cache");
const { getPool } = require("./db");

const searchCache = new NodeCache({
  stdTTL: Number(process.env.MODEL_SEARCH_CACHE_TTL_SECONDS || 300),
  checkperiod: Number(process.env.MODEL_SEARCH_CACHE_CHECK_PERIOD_SECONDS || 60),
  useClones: false,
  deleteOnExpire: true
});

function getCacheKey(normalizedQuery) {
  return "model-search:" + String(normalizedQuery || "").trim();
}

function cacheSearchResult(normalizedQuery, result) {
  searchCache.set(getCacheKey(normalizedQuery), result);
}

function getCachedSearchResult(normalizedQuery) {
  const cached = searchCache.get(getCacheKey(normalizedQuery));
  return cached === undefined ? null : cached;
}

function invalidateSearchCache() {
  searchCache.flushAll();
}

function toText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeModelKey(value) {
  return toText(value).toUpperCase().replace(/[^A-Z0-9]+/g, "");
}

function normalizeSeriesKey(value) {
  return normalizeModelKey(value).replace(/^[0-9]{2,3}/, "");
}

function toNullableText(value) {
  const text = toText(value);
  return text ? text : null;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeVariants(rows) {
  return rows.map((row) => ({
    id: row.id,
    modelName: row.exact_model_name,
    size: String(row.size_inches),
    isPrimary: Boolean(row.is_primary),
    regionCode: toNullableText(row.region_code),
    availability: toNullableText(row.availability),
    sourceUrl: toNullableText(row.source_url)
  }));
}

function normalizeAliases(rows) {
  return rows.map((row) => ({
    id: row.id,
    alias: row.alias_value,
    aliasType: row.alias_type,
    source: toNullableText(row.source),
    priority: Number(row.priority) || 0
  }));
}

function normalizeSpecsRow(row) {
  if (!row) {
    return {
      technicalByCategory: {},
      ports: [],
      features: {},
      rawSource: {}
    };
  }

  return {
    technicalByCategory: toObject(row.technical_by_category),
    ports: toArray(row.ports),
    features: toObject(row.features),
    rawSource: toObject(row.raw_source),
    updatedAt: toNullableText(row.updated_at)
  };
}

function buildResponsePayload(seriesRow, variantsRows, aliasesRows, specsRow, resolvedBy, matchedValue, normalizedQuery) {
  const variants = normalizeVariants(variantsRows);
  const aliases = normalizeAliases(aliasesRows);
  const availableSizes = Array.from(new Set(variants.map((variant) => variant.size).filter(Boolean)))
    .sort((left, right) => Number(left) - Number(right));

  return {
    ok: true,
    query: normalizedQuery,
    resolvedBy,
    matchedValue,
    model: {
      id: seriesRow.id,
      brand: seriesRow.brand,
      year: Number(seriesRow.year),
      modelName: seriesRow.canonical_model_name,
      seriesKey: seriesRow.series_key,
      canonicalSize: String(seriesRow.canonical_size),
      osProfileId: toNullableText(seriesRow.os_profile_id),
      panelType: toNullableText(seriesRow.panel_type),
      status: seriesRow.status,
      notes: toNullableText(seriesRow.notes),
      availableSizes,
      variants,
      aliases,
      specs: normalizeSpecsRow(specsRow)
    }
  };
}

async function resolveSearchCandidate(client, normalizedQuery) {
  const aliasResult = await client.query(
    [
      "SELECT s.id AS series_id, s.canonical_model_name, a.alias_value, 'alias'::text AS resolved_by",
      "FROM model_aliases a",
      "JOIN models_series s ON s.id = a.series_id",
      "WHERE a.normalized_alias = $1",
      "ORDER BY a.priority ASC, a.id ASC",
      "LIMIT 1"
    ].join(" "),
    [normalizedQuery]
  );

  if (aliasResult.rows.length > 0) {
    return aliasResult.rows[0];
  }

  const variantResult = await client.query(
    [
      "SELECT s.id AS series_id, s.canonical_model_name, v.exact_model_name AS alias_value, 'variant'::text AS resolved_by",
      "FROM model_variants v",
      "JOIN models_series s ON s.id = v.series_id",
      "WHERE v.normalized_model_name = $1",
      "ORDER BY v.is_primary DESC, v.size_inches ASC, v.id ASC",
      "LIMIT 1"
    ].join(" "),
    [normalizedQuery]
  );

  if (variantResult.rows.length > 0) {
    return variantResult.rows[0];
  }

  const seriesKey = normalizeSeriesKey(normalizedQuery);
  if (!seriesKey) {
    return null;
  }

  const seriesResult = await client.query(
    [
      "SELECT id AS series_id, canonical_model_name, canonical_model_name AS alias_value, 'series'::text AS resolved_by",
      "FROM models_series",
      "WHERE normalized_series_key = $1 OR normalized_canonical_model_name = $2",
      "ORDER BY id ASC",
      "LIMIT 1"
    ].join(" "),
    [seriesKey, normalizedQuery]
  );

  return seriesResult.rows.length > 0 ? seriesResult.rows[0] : null;
}

async function loadSeriesBundle(client, seriesId) {
  const [seriesResult, variantsResult, aliasesResult, specsResult] = await Promise.all([
    client.query(
      [
        "SELECT id, brand, year, canonical_model_name, series_key, canonical_size, os_profile_id, panel_type, status, notes",
        "FROM models_series",
        "WHERE id = $1",
        "LIMIT 1"
      ].join(" "),
      [seriesId]
    ),
    client.query(
      [
        "SELECT id, exact_model_name, size_inches, is_primary, region_code, availability, source_url",
        "FROM model_variants",
        "WHERE series_id = $1",
        "ORDER BY is_primary DESC, size_inches ASC, exact_model_name ASC, id ASC"
      ].join(" "),
      [seriesId]
    ),
    client.query(
      [
        "SELECT id, alias_value, alias_type, source, priority",
        "FROM model_aliases",
        "WHERE series_id = $1",
        "ORDER BY priority ASC, alias_value ASC, id ASC"
      ].join(" "),
      [seriesId]
    ),
    client.query(
      [
        "SELECT technical_by_category, ports, features, raw_source, updated_at",
        "FROM model_specs",
        "WHERE series_id = $1",
        "LIMIT 1"
      ].join(" "),
      [seriesId]
    )
  ]);

  const seriesRow = seriesResult.rows[0] || null;
  if (!seriesRow) {
    return null;
  }

  return buildResponsePayload(
    seriesRow,
    variantsResult.rows,
    aliasesResult.rows,
    specsResult.rows[0] || null,
    null,
    null,
    null
  );
}

async function searchModels(q) {
  const rawQuery = toText(q);
  if (!rawQuery) {
    const error = new Error("Query parameter q is required");
    error.statusCode = 400;
    error.code = "INVALID_QUERY";
    throw error;
  }

  const normalizedQuery = normalizeModelKey(rawQuery);
  if (!normalizedQuery) {
    const error = new Error("Query parameter q is required");
    error.statusCode = 400;
    error.code = "INVALID_QUERY";
    throw error;
  }

  const cachedResult = getCachedSearchResult(normalizedQuery);
  if (cachedResult) {
    return {
      ...cachedResult,
      cache: {
        hit: true,
        ttlSeconds: Number(process.env.MODEL_SEARCH_CACHE_TTL_SECONDS || 300)
      }
    };
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    const candidate = await resolveSearchCandidate(client, normalizedQuery);
    if (!candidate) {
      return null;
    }

    const bundle = await loadSeriesBundle(client, candidate.series_id);
    if (!bundle) {
      return null;
    }

    bundle.resolvedBy = candidate.resolved_by;
    bundle.matchedValue = candidate.alias_value;
    bundle.query = normalizedQuery;
    bundle.cache = {
      hit: false,
      ttlSeconds: Number(process.env.MODEL_SEARCH_CACHE_TTL_SECONDS || 300)
    };
    cacheSearchResult(normalizedQuery, bundle);
    return bundle;
  } finally {
    client.release();
  }
}

module.exports = {
  invalidateSearchCache,
  searchModels
};