const fs = require("node:fs");
const path = require("node:path");
const { getPool, closePool } = require("./db");
const { loadBootstrapData } = require("./publicContentRepository");

const projectRoot = path.resolve(__dirname, "..", "..");
const dataDir = path.join(projectRoot, "data");
const publicDataDir = path.join(projectRoot, "public", "data");

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

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) {
    if (values === null || values === undefined || values === "") {
      return [];
    }

    return [toText(values)].filter(Boolean);
  }

  return values.map((item) => toText(item)).filter(Boolean);
}

function normalizeModelKey(value) {
  return toText(value).toUpperCase().replace(/[^A-Z0-9]+/g, "");
}

function normalizeSeriesKey(value) {
  return normalizeModelKey(value).replace(/^[0-9]{2,3}/, "");
}

function splitModelName(modelName) {
  const normalizedName = toText(modelName).replace(/\/.*$/, "");
  const match = normalizedName.match(/^(\d{2,3})(.+)$/);
  if (!match) {
    return {
      size: null,
      seriesKey: normalizeSeriesKey(normalizedName),
      normalizedModelName: normalizeModelKey(normalizedName)
    };
  }

  return {
    size: match[1].replace(/^0+/, "") || match[1],
    seriesKey: normalizeSeriesKey(match[2]),
    normalizedModelName: normalizeModelKey(normalizedName)
  };
}

function inferBrand(model) {
  const explicitBrand = toText(model && model.brand);
  if (explicitBrand) {
    return explicitBrand;
  }

  const modelName = normalizeModelKey(model && model.modelName);
  if (modelName.startsWith("AOC")) {
    return "AOC";
  }

  return "Philips";
}

function normalizeLeaf(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeLeaf(item)).filter((item) => item !== undefined);
  }

  if (isPlainObject(value)) {
    const output = {};
    for (const [key, nextValue] of Object.entries(value)) {
      const normalized = normalizeLeaf(nextValue);
      if (normalized === undefined) {
        continue;
      }
      output[key] = normalized;
    }
    return output;
  }

  if (typeof value === "string") {
    const text = value.trim();
    return text ? text : null;
  }

  return value;
}

function mergeDeep(baseValue, fallbackValue) {
  if (baseValue === undefined || baseValue === null) {
    return deepClone(fallbackValue);
  }

  if (Array.isArray(baseValue)) {
    return baseValue.length > 0 ? baseValue : deepClone(fallbackValue);
  }

  if (!isPlainObject(baseValue)) {
    if (baseValue === "" || baseValue === null) {
      return fallbackValue !== undefined ? deepClone(fallbackValue) : null;
    }

    return baseValue;
  }

  const output = deepClone(baseValue);
  if (!isPlainObject(fallbackValue)) {
    return output;
  }

  for (const [key, nextFallbackValue] of Object.entries(fallbackValue)) {
    const existingValue = output[key];
    if (existingValue === undefined || existingValue === null || existingValue === "" || (Array.isArray(existingValue) && existingValue.length === 0) || (isPlainObject(existingValue) && Object.keys(existingValue).length === 0)) {
      output[key] = deepClone(nextFallbackValue);
      continue;
    }

    output[key] = mergeDeep(existingValue, nextFallbackValue);
  }

  return output;
}

function normalizePorts(rawPorts) {
  const ports = Array.isArray(rawPorts) ? rawPorts : [];
  return ports
    .map((entry) => {
      if (!isPlainObject(entry)) {
        return null;
      }

      const normalized = {
        type: toNullableText(entry.type || entry.port),
        count: toNullableNumber(entry.count || entry.qty),
        spec: toNullableText(entry.spec),
        version: toNullableText(entry.version),
        connector: toNullableText(entry.connector),
        earc: typeof entry.earc === "boolean" ? entry.earc : null,
        notes: toNullableText(entry.notes)
      };

      const hasMeaningfulValue = Object.values(normalized).some((value) => value !== null && value !== "");
      return hasMeaningfulValue ? normalized : null;
    })
    .filter(Boolean);
}

function normalizeTechnicalByCategory(model) {
  const sourceTechnicalByCategory = isPlainObject(model && model.specs && model.specs.technicalByCategory)
    ? normalizeLeaf(model.specs.technicalByCategory)
    : {};

  const fallback = {
    general: {
      modelName: toNullableText(model && model.modelName),
      year: toNullableNumber(model && model.year),
      brand: inferBrand(model),
      osProfileId: toNullableText(model && model.osProfileId),
      panelType: toNullableText(model && model.panelType),
      commercialName: toNullableText(model && model.commercialName),
      officialProductUrl: toNullableText(model && model.officialProductUrl)
    },
    display: {
      availableSizes: normalizeStringArray(model && model.availableSizes),
      ambilight: toNullableText(model && model.features && model.features.ambilight),
      vrrMaxRefreshRate: toNullableText(model && model.vrrMaxRefreshRate)
    },
    audio: {
      channels: toNullableText(model && model.audioChannels),
      power: toNullableText(model && model.audioPower),
      bluetoothVersion: toNullableText(model && model.bluetoothVersion)
    },
    connectivity: {
      wifiStandard: toNullableText(model && model.wifiStandard),
      bluetoothVersion: toNullableText(model && model.bluetoothVersion),
      portsCount: Array.isArray(model && model.ports) ? model.ports.length : 0
    },
    gaming: {
      vrrMaxRefreshRate: toNullableText(model && model.vrrMaxRefreshRate),
      features: normalizeStringArray(model && model.features && model.features.gaming)
    },
    smart: {
      apps: normalizeStringArray(model && model.apps),
      features: normalizeStringArray(model && model.features && model.features.smart)
    }
  };

  return mergeDeep(sourceTechnicalByCategory, fallback);
}

function normalizeFeatures(model) {
  const features = isPlainObject(model && model.features) ? model.features : {};
  const normalized = normalizeLeaf(features);
  return isPlainObject(normalized) ? normalized : {};
}

function normalizeRawSource(model) {
  const raw = deepClone(model);
  if (raw && raw.specs && isPlainObject(raw.specs)) {
    raw.specs = normalizeLeaf(raw.specs);
  }
  if (Array.isArray(raw && raw.availableSizes)) {
    raw.availableSizes = normalizeStringArray(raw.availableSizes);
  }
  if (Array.isArray(raw && raw.aliases)) {
    raw.aliases = normalizeStringArray(raw.aliases);
  }
  return normalizeLeaf(raw);
}

function collectVariantSizes(model) {
  const sizes = new Set();
  const primarySizeInfo = splitModelName(model && model.modelName);
  if (primarySizeInfo.size) {
    sizes.add(primarySizeInfo.size);
  }

  for (const size of normalizeStringArray(model && model.availableSizes)) {
    sizes.add(size);
  }

  for (const alias of normalizeStringArray(model && model.aliases)) {
    const aliasSize = splitModelName(alias).size;
    if (aliasSize) {
      sizes.add(aliasSize);
    }
  }

  return Array.from(sizes)
    .map((size) => String(size).trim())
    .filter(Boolean)
    .sort((left, right) => Number(left) - Number(right));
}

function computeCanonicalSize(models, allSizes) {
  const preferredOrder = [55, 50, 48, 65, 43, 42, 75, 77, 85, 100, 32, 24, 21];
  const sizeFrequency = new Map();

  for (const model of models) {
    const sizeInfo = splitModelName(model && model.modelName);
    if (sizeInfo.size) {
      const nextCount = (sizeFrequency.get(sizeInfo.size) || 0) + 2;
      sizeFrequency.set(sizeInfo.size, nextCount);
    }

    for (const size of normalizeStringArray(model && model.availableSizes)) {
      const nextCount = (sizeFrequency.get(size) || 0) + 1;
      sizeFrequency.set(size, nextCount);
    }

    for (const alias of normalizeStringArray(model && model.aliases)) {
      const aliasSize = splitModelName(alias).size;
      if (aliasSize) {
        const nextCount = (sizeFrequency.get(aliasSize) || 0) + 1;
        sizeFrequency.set(aliasSize, nextCount);
      }
    }
  }

  const candidateSizes = allSizes.length > 0 ? allSizes : Array.from(sizeFrequency.keys());
  if (candidateSizes.length === 0) {
    return null;
  }

  const ranked = candidateSizes
    .map((size) => ({ size, score: sizeFrequency.get(size) || 0 }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const leftPreferred = preferredOrder.indexOf(Number(left.size));
      const rightPreferred = preferredOrder.indexOf(Number(right.size));
      if (leftPreferred !== rightPreferred) {
        if (leftPreferred === -1) return 1;
        if (rightPreferred === -1) return -1;
        return leftPreferred - rightPreferred;
      }

      return Number(left.size) - Number(right.size);
    });

  return ranked[0] ? ranked[0].size : null;
}

function buildVariantRows(seriesKey, allSizes) {
  return allSizes.map((size) => ({
    exactModelName: String(size) + seriesKey,
    size: String(size),
    isPrimary: false
  }));
}

function buildAliasEntries(series, canonicalName, seriesKey, variantRows) {
  const aliases = new Map();
  const addAlias = (aliasValue, aliasType, priority, source) => {
    const normalizedAlias = normalizeModelKey(aliasValue);
    if (!normalizedAlias) {
      return;
    }

    if (!aliases.has(normalizedAlias)) {
      aliases.set(normalizedAlias, {
        aliasValue: toText(aliasValue),
        aliasType,
        priority,
        source
      });
      return;
    }

    const existing = aliases.get(normalizedAlias);
    if (priority < existing.priority) {
      aliases.set(normalizedAlias, {
        aliasValue: toText(aliasValue),
        aliasType,
        priority,
        source
      });
    }
  };

  addAlias(canonicalName, "series_key", 1, "canonical");
  addAlias(seriesKey, "series_key", 2, "series_key");

  for (const variant of variantRows) {
    addAlias(variant.exactModelName, variant.size === series.canonicalSize ? "series_key" : "size_variant", variant.size === series.canonicalSize ? 1 : 10, "generated_variant");
  }

  for (const alias of normalizeStringArray(series.aliases)) {
    const aliasSize = splitModelName(alias).size;
    addAlias(alias, aliasSize ? "size_variant" : "manual", 20, "source_alias");
  }

  return Array.from(aliases.values()).sort((left, right) => left.priority - right.priority || left.aliasValue.localeCompare(right.aliasValue));
}

async function upsertSeries(client, seriesRecord) {
  const query = [
    "INSERT INTO models_series (brand, year, canonical_model_name, series_key, canonical_size, os_profile_id, panel_type, status, notes)",
    "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    "ON CONFLICT ON CONSTRAINT models_series_brand_year_series_uk",
    "DO UPDATE SET",
    "  series_key = EXCLUDED.series_key,",
    "  canonical_size = EXCLUDED.canonical_size,",
    "  os_profile_id = EXCLUDED.os_profile_id,",
    "  panel_type = EXCLUDED.panel_type,",
    "  status = EXCLUDED.status,",
    "  notes = EXCLUDED.notes,",
    "  updated_at = NOW()",
    "RETURNING id"
  ].join(" ");

  const result = await client.query(query, [
    seriesRecord.brand,
    seriesRecord.year,
    seriesRecord.canonicalModelName,
    seriesRecord.seriesKey,
    seriesRecord.canonicalSize,
    seriesRecord.osProfileId,
    seriesRecord.panelType,
    seriesRecord.status,
    seriesRecord.notes
  ]);

  return result.rows[0].id;
}

async function upsertVariant(client, seriesId, variant) {
  const query = [
    "INSERT INTO model_variants (series_id, exact_model_name, size_inches, is_primary, region_code, availability, source_url)",
    "VALUES ($1, $2, $3, $4, $5, $6, $7)",
    "ON CONFLICT (series_id, normalized_model_name)",
    "DO UPDATE SET",
    "  exact_model_name = EXCLUDED.exact_model_name,",
    "  size_inches = EXCLUDED.size_inches,",
    "  is_primary = EXCLUDED.is_primary,",
    "  region_code = EXCLUDED.region_code,",
    "  availability = EXCLUDED.availability,",
    "  source_url = EXCLUDED.source_url,",
    "  updated_at = NOW()",
    "RETURNING id"
  ].join(" ");

  const result = await client.query(query, [
    seriesId,
    variant.exactModelName,
    Number(variant.size),
    Boolean(variant.isPrimary),
    variant.regionCode,
    variant.availability,
    variant.sourceUrl
  ]);

  return result.rows[0].id;
}

async function upsertAlias(client, seriesId, aliasEntry, conflictTracker) {
  const normalizedAlias = normalizeModelKey(aliasEntry.aliasValue);
  if (!normalizedAlias) {
    return null;
  }

  const existing = await client.query(
    "SELECT id, series_id, priority FROM model_aliases WHERE normalized_alias = $1 LIMIT 1",
    [normalizedAlias]
  );

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    if (Number(row.series_id) !== Number(seriesId)) {
      conflictTracker.push({
        alias: aliasEntry.aliasValue,
        existingSeriesId: Number(row.series_id),
        incomingSeriesId: Number(seriesId)
      });
      return null;
    }

    const nextPriority = Math.min(Number(row.priority) || 100, Number(aliasEntry.priority) || 100);
    const updateResult = await client.query(
      [
        "UPDATE model_aliases",
        "SET alias_value = $1, alias_type = $2, source = $3, priority = $4, updated_at = NOW()",
        "WHERE id = $5",
        "RETURNING id"
      ].join(" "),
      [aliasEntry.aliasValue, aliasEntry.aliasType, aliasEntry.source, nextPriority, row.id]
    );

    return updateResult.rows[0].id;
  }

  const insertResult = await client.query(
    [
      "INSERT INTO model_aliases (series_id, alias_value, alias_type, source, priority)",
      "VALUES ($1, $2, $3, $4, $5)",
      "RETURNING id"
    ].join(" "),
    [seriesId, aliasEntry.aliasValue, aliasEntry.aliasType, aliasEntry.source, aliasEntry.priority]
  );

  return insertResult.rows[0].id;
}

async function upsertSpecs(client, seriesId, model, seriesMeta) {
  const technicalByCategory = normalizeTechnicalByCategory(model);
  const ports = normalizePorts(model && (model.ports || (model.specs && model.specs.ports)));
  const features = normalizeFeatures(model);
  const rawSource = normalizeRawSource({
    ...model,
    brand: seriesMeta.brand,
    seriesKey: seriesMeta.seriesKey,
    canonicalModelName: seriesMeta.canonicalModelName,
    canonicalSize: seriesMeta.canonicalSize,
    importedAt: new Date().toISOString()
  });

  const query = [
    "INSERT INTO model_specs (series_id, technical_by_category, ports, features, raw_source)",
    "VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb)",
    "ON CONFLICT (series_id)",
    "DO UPDATE SET",
    "  technical_by_category = EXCLUDED.technical_by_category,",
    "  ports = EXCLUDED.ports,",
    "  features = EXCLUDED.features,",
    "  raw_source = EXCLUDED.raw_source,",
    "  updated_at = NOW()"
  ].join(" ");

  await client.query(query, [
    seriesId,
    JSON.stringify(technicalByCategory),
    JSON.stringify(ports),
    JSON.stringify(features),
    JSON.stringify(rawSource)
  ]);
}

function loadPublicModelsJsonIfPresent() {
  const publicModelsPath = path.join(publicDataDir, "models.json");
  if (!fs.existsSync(publicModelsPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(publicModelsPath, "utf8"));
  } catch (_error) {
    return null;
  }
}

async function loadSourceModels(projectRootPath) {
  const bootstrap = await loadBootstrapData(projectRootPath);
  const models = Array.isArray(bootstrap.ModelsData) ? bootstrap.ModelsData : [];
  const publicModels = loadPublicModelsJsonIfPresent();

  if (Array.isArray(publicModels) && publicModels.length > 0 && publicModels.length !== models.length) {
    console.warn("[etl] public/data/models.json count differs from data/models.js bootstrap count:", {
      jsCount: models.length,
      jsonCount: publicModels.length
    });
  }

  return models;
}

function groupSourceModels(models) {
  const groups = new Map();

  for (const model of models) {
    if (!isPlainObject(model)) {
      continue;
    }

    const brand = inferBrand(model);
    const year = Number(model.year);
    const parsed = splitModelName(model.modelName);
    const seriesKey = parsed.seriesKey || normalizeSeriesKey(model.modelName);
    const groupKey = [brand, Number.isFinite(year) ? year : 0, seriesKey].join("|");

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }

    groups.get(groupKey).push({
      ...model,
      brand,
      year: Number.isFinite(year) ? Math.round(year) : new Date().getFullYear(),
      seriesKey,
      primarySize: parsed.size
    });
  }

  return groups;
}

async function clearTables(client) {
  await client.query("TRUNCATE TABLE model_aliases, model_variants, model_specs, models_series RESTART IDENTITY CASCADE");
}

async function runImport(options) {
  const projectRootPath = options.projectRoot || projectRoot;
  const shouldReset = Boolean(options.reset);
  const models = await loadSourceModels(projectRootPath);
  const groups = groupSourceModels(models);
  const pool = getPool();
  const client = await pool.connect();

  const stats = {
    sourceModels: models.length,
    groups: groups.size,
    seriesUpserted: 0,
    variantsUpserted: 0,
    aliasesUpserted: 0,
    specsUpserted: 0,
    aliasConflicts: []
  };

  try {
    await client.query("BEGIN");

    if (shouldReset) {
      await clearTables(client);
    }

    for (const [groupKey, groupModels] of groups.entries()) {
      const representativeModel = groupModels[0];
      const allSizes = Array.from(new Set(groupModels.flatMap((item) => collectVariantSizes(item)))).sort((left, right) => Number(left) - Number(right));
      const canonicalSize = computeCanonicalSize(groupModels, allSizes) || representativeModel.primarySize || allSizes[0] || null;
      const seriesKey = representativeModel.seriesKey || normalizeSeriesKey(representativeModel.modelName);
      const canonicalModelName = canonicalSize ? String(canonicalSize) + seriesKey : toText(representativeModel.modelName);
      const sourceModelNames = groupModels.map((item) => toText(item.modelName)).filter(Boolean);

      const seriesRecord = {
        brand: representativeModel.brand,
        year: representativeModel.year,
        canonicalModelName,
        seriesKey,
        canonicalSize: Number(canonicalSize) || Number(representativeModel.primarySize) || Number(allSizes[0]) || 0,
        osProfileId: toNullableText(representativeModel.osProfileId),
        panelType: toNullableText(representativeModel.panelType),
        status: "active",
        notes: sourceModelNames.length > 1
          ? "Merged from " + sourceModelNames.length + " source records; group=" + groupKey
          : null
      };

      if (!seriesRecord.canonicalSize) {
        const error = new Error("Unable to determine canonical size for group: " + groupKey);
        error.code = "CANONICAL_SIZE_MISSING";
        throw error;
      }

      const seriesId = await upsertSeries(client, seriesRecord);
      stats.seriesUpserted += 1;

      const variantRows = buildVariantRows(seriesKey, allSizes);
      const primaryNormalized = normalizeModelKey(canonicalModelName);

      for (const variant of variantRows) {
        variant.isPrimary = normalizeModelKey(variant.exactModelName) === primaryNormalized;
        variant.regionCode = null;
        variant.availability = "EU";
        variant.sourceUrl = null;
        await upsertVariant(client, seriesId, variant);
        stats.variantsUpserted += 1;
      }

      const aliasEntries = buildAliasEntries(seriesRecord, canonicalModelName, seriesKey, variantRows);
      for (const aliasEntry of aliasEntries) {
        const aliasId = await upsertAlias(client, seriesId, aliasEntry, stats.aliasConflicts);
        if (aliasId) {
          stats.aliasesUpserted += 1;
        }
      }

      await upsertSpecs(client, seriesId, representativeModel, seriesRecord);
      stats.specsUpserted += 1;
    }

    if (stats.aliasConflicts.length > 0) {
      const error = new Error("Alias collisions detected during import");
      error.code = "ALIAS_COLLISION";
      error.details = stats.aliasConflicts;
      throw error;
    }

    await client.query("COMMIT");
    return stats;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_rollbackError) {}
    throw error;
  } finally {
    client.release();
  }
}

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    reset: args.has("--reset") || args.has("--truncate"),
    dryRun: args.has("--dry-run")
  };
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.dryRun) {
    const models = loadSourceModels(projectRoot);
    const groups = groupSourceModels(models);
    console.log(JSON.stringify({
      dryRun: true,
      sourceModels: models.length,
      groups: groups.size
    }, null, 2));
    return;
  }

  const stats = await runImport({
    reset: args.reset,
    projectRoot
  });

  console.log(JSON.stringify({
    ok: true,
    importedAt: new Date().toISOString(),
    stats
  }, null, 2));
}

main()
  .then(() => closePool())
  .catch(async (error) => {
    const payload = {
      ok: false,
      error: error && error.code ? error.code : "IMPORT_FAILED",
      message: error && error.message ? error.message : "Import failed"
    };

    if (error && error.details) {
      payload.details = error.details;
    }

    console.error(JSON.stringify(payload, null, 2));
    try {
      await closePool();
    } catch (_closeError) {}
    process.exitCode = 1;
  });