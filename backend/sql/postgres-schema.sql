CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION normalize_model_key(input_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(upper(coalesce(input_value, '')), '[^A-Z0-9]+', '', 'g');
$$;

CREATE OR REPLACE FUNCTION normalize_series_key(input_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(normalize_model_key(input_value), '^[0-9]{2,3}', '', 'g');
$$;

CREATE TABLE models_series (
  id BIGSERIAL PRIMARY KEY,
  brand TEXT NOT NULL CHECK (brand IN ('Philips', 'AOC')),
  year SMALLINT NOT NULL CHECK (year BETWEEN 1990 AND 2100),
  canonical_model_name TEXT NOT NULL,
  normalized_canonical_model_name TEXT GENERATED ALWAYS AS (normalize_model_key(canonical_model_name)) STORED,
  series_key TEXT NOT NULL,
  normalized_series_key TEXT GENERATED ALWAYS AS (normalize_model_key(series_key)) STORED,
  canonical_size SMALLINT NOT NULL CHECK (canonical_size BETWEEN 10 AND 120),
  os_profile_id TEXT,
  panel_type TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT models_series_brand_year_name_uk UNIQUE (brand, year, canonical_model_name),
  CONSTRAINT models_series_brand_year_series_uk UNIQUE (brand, year, normalized_series_key)
);

CREATE INDEX idx_models_series_lookup ON models_series (brand, year, normalized_series_key);
CREATE INDEX idx_models_series_canonical_lookup ON models_series (normalized_canonical_model_name);

CREATE TABLE model_variants (
  id BIGSERIAL PRIMARY KEY,
  series_id BIGINT NOT NULL REFERENCES models_series(id) ON DELETE CASCADE,
  exact_model_name TEXT NOT NULL,
  normalized_model_name TEXT GENERATED ALWAYS AS (normalize_model_key(exact_model_name)) STORED,
  size_inches SMALLINT NOT NULL CHECK (size_inches BETWEEN 10 AND 120),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  region_code TEXT,
  availability TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT model_variants_series_exact_name_uk UNIQUE (series_id, normalized_model_name),
  CONSTRAINT model_variants_series_size_uk UNIQUE (series_id, size_inches)
);

CREATE INDEX idx_model_variants_series_primary_size ON model_variants (series_id, is_primary DESC, size_inches ASC, normalized_model_name ASC);
CREATE INDEX idx_model_variants_normalized_name ON model_variants (normalized_model_name);

CREATE TABLE model_aliases (
  id BIGSERIAL PRIMARY KEY,
  series_id BIGINT NOT NULL REFERENCES models_series(id) ON DELETE CASCADE,
  alias_value TEXT NOT NULL,
  normalized_alias TEXT GENERATED ALWAYS AS (normalize_model_key(alias_value)) STORED,
  alias_type TEXT NOT NULL DEFAULT 'size_variant' CHECK (alias_type IN ('size_variant', 'series_key', 'manual', 'legacy')),
  source TEXT,
  priority SMALLINT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT model_aliases_normalized_alias_uk UNIQUE (normalized_alias),
  CONSTRAINT model_aliases_series_alias_uk UNIQUE (series_id, normalized_alias)
);

CREATE INDEX idx_model_aliases_series_priority ON model_aliases (series_id, priority ASC, normalized_alias ASC);
CREATE INDEX idx_model_aliases_normalized_lookup ON model_aliases (normalized_alias);

CREATE TABLE model_specs (
  series_id BIGINT PRIMARY KEY REFERENCES models_series(id) ON DELETE CASCADE,
  technical_by_category JSONB NOT NULL DEFAULT '{}'::jsonb,
  ports JSONB NOT NULL DEFAULT '[]'::jsonb,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_source JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT model_specs_technical_by_category_object_ck CHECK (jsonb_typeof(technical_by_category) = 'object'),
  CONSTRAINT model_specs_ports_array_ck CHECK (jsonb_typeof(ports) = 'array'),
  CONSTRAINT model_specs_features_object_ck CHECK (jsonb_typeof(features) = 'object'),
  CONSTRAINT model_specs_raw_source_object_ck CHECK (jsonb_typeof(raw_source) = 'object')
);

CREATE INDEX idx_model_specs_raw_source_gin ON model_specs USING GIN (raw_source);
CREATE INDEX idx_model_specs_features_gin ON model_specs USING GIN (features);

-- Example data load for one canonical series with strict normalization.
WITH inserted_series AS (
  INSERT INTO models_series (
    brand,
    year,
    canonical_model_name,
    series_key,
    canonical_size,
    os_profile_id,
    panel_type,
    status,
    notes
  )
  VALUES (
    'Philips',
    2026,
    '55PUS9000',
    'PUS9000',
    55,
    'Titan OS',
    'MiniLED',
    'active',
    NULL
  )
  RETURNING id
), inserted_variants AS (
  INSERT INTO model_variants (
    series_id,
    exact_model_name,
    size_inches,
    is_primary,
    region_code,
    availability,
    source_url
  )
  SELECT id, '43PUS9000', 43, FALSE, NULL, 'EU', NULL FROM inserted_series
  UNION ALL
  SELECT id, '50PUS9000', 50, FALSE, NULL, 'EU', NULL FROM inserted_series
  UNION ALL
  SELECT id, '55PUS9000', 55, TRUE, NULL, 'EU', NULL FROM inserted_series
  UNION ALL
  SELECT id, '65PUS9000', 65, FALSE, NULL, 'EU', NULL FROM inserted_series
  UNION ALL
  SELECT id, '75PUS9000', 75, FALSE, NULL, 'EU', NULL FROM inserted_series
  RETURNING 1
), inserted_aliases AS (
  INSERT INTO model_aliases (
    series_id,
    alias_value,
    alias_type,
    source,
    priority
  )
  SELECT id, '43PUS9000', 'size_variant', 'migration', 10 FROM inserted_series
  UNION ALL
  SELECT id, '50PUS9000', 'size_variant', 'migration', 10 FROM inserted_series
  UNION ALL
  SELECT id, '55PUS9000', 'series_key', 'migration', 5 FROM inserted_series
  UNION ALL
  SELECT id, '65PUS9000', 'size_variant', 'migration', 10 FROM inserted_series
  UNION ALL
  SELECT id, '75PUS9000', 'size_variant', 'migration', 10 FROM inserted_series
  RETURNING 1
)
INSERT INTO model_specs (
  series_id,
  technical_by_category,
  ports,
  features,
  raw_source
)
SELECT
  id,
  jsonb_build_object(
    'display', jsonb_build_object(
      'panel_type', 'MiniLED',
      'resolution', '4K UHD',
      'native_refresh_rate_hz', 120,
      'hdr_support', jsonb_build_array('HDR10+', 'Dolby Vision')
    ),
    'gaming', jsonb_build_object(
      'vrr_max_refresh_rate_hz', 144,
      'allm', true,
      'hdmi_2_1_ports', 4,
      'game_bar', true
    ),
    'audio', jsonb_build_object(
      'channels', '2.1',
      'power_watts', 40,
      'subwoofer', NULL,
      'bluetooth_version', '5.4'
    ),
    'connectivity', jsonb_build_object(
      'wifi_standard', 'Wi-Fi 6',
      'ethernet', true,
      'bluetooth', '5.4'
    )
  ),
  jsonb_build_array(
    jsonb_build_object('type', 'HDMI', 'count', 4, 'version', '2.1', 'earc', true),
    jsonb_build_object('type', 'USB', 'count', 2, 'version', '3.0', 'earc', false),
    jsonb_build_object('type', 'LAN', 'count', 1, 'version', NULL, 'earc', false)
  ),
  jsonb_build_object(
    'ambilight', '3-sided Ambilight',
    'video', jsonb_build_array('HDR10+', 'Dolby Vision'),
    'audio', jsonb_build_array('Dolby Atmos', 'DTS:X'),
    'gaming', jsonb_build_array('HDMI-VRR', 'ALLM', 'FreeSync Premium'),
    'smart', jsonb_build_array('AirPlay 2', 'Matter', 'Casting')
  ),
  jsonb_build_object(
    'source', 'migration',
    'variant_count', 5,
    'missing_fields_policy', jsonb_build_object(
      'arrays', '[]',
      'objects', '{}',
      'strings', NULL
    )
  )
FROM inserted_series;