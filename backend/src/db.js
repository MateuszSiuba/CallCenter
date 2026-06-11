const { Pool } = require("pg");

let pool = null;

function getDatabaseUrl() {
  const url = String(process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
  return url;
}

function shouldUseSsl() {
  const raw = String(process.env.PGSSLMODE || process.env.POSTGRES_SSLMODE || "").trim().toLowerCase();
  if (raw === "disable" || raw === "false" || raw === "0") {
    return false;
  }

  if (raw === "require" || raw === "true" || raw === "1") {
    return { rejectUnauthorized: false };
  }

  return process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false;
}

function createPool() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const isProduction = String(process.env.NODE_ENV || "").toLowerCase() === "production";
  const maxConnections = Number(process.env.PGPOOL_MAX || (isProduction ? 5 : 10));
  const idleTimeoutMillis = Number(process.env.PGPOOL_IDLE_TIMEOUT_MS || (isProduction ? 30000 : 10000));
  const connectionTimeoutMillis = Number(process.env.PGPOOL_CONNECTION_TIMEOUT_MS || 5000);

  return new Pool({
    connectionString,
    max: Number.isFinite(maxConnections) && maxConnections > 0 ? maxConnections : 5,
    idleTimeoutMillis: Number.isFinite(idleTimeoutMillis) && idleTimeoutMillis > 0 ? idleTimeoutMillis : 30000,
    connectionTimeoutMillis: Number.isFinite(connectionTimeoutMillis) && connectionTimeoutMillis > 0 ? connectionTimeoutMillis : 5000,
    allowExitOnIdle: true,
    keepAlive: true,
    keepAliveInitialDelayMillis: Number(process.env.PGPOOL_KEEPALIVE_INITIAL_DELAY_MS || 10000),
    ssl: shouldUseSsl()
  });
}

function getPool() {
  if (!pool) {
    pool = createPool();
  }

  return pool;
}

async function closePool() {
  if (!pool) {
    return;
  }

  const current = pool;
  pool = null;
  await current.end();
}

module.exports = {
  closePool,
  getPool
};