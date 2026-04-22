const crypto = require("node:crypto");

function toText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function parseAdminCredentialsFromEnv() {
  const envPairs = toText(process.env.ADMIN_CREDENTIALS);
  const byPairs = envPairs
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.indexOf(":");
      if (separatorIndex <= 0) {
        return null;
      }

      const username = toText(entry.slice(0, separatorIndex));
      const password = toText(entry.slice(separatorIndex + 1));
      if (!username || !password) {
        return null;
      }

      return { username, password };
    })
    .filter(Boolean);

  if (byPairs.length > 0) {
    return byPairs;
  }

  const username = toText(process.env.ADMIN_USERNAME) || "CallCenterAdmin";
  const password = toText(process.env.ADMIN_PASSWORD) || "TPV11112222";

  return [{ username, password }];
}

function readTokenTtlMs() {
  const ttlMinutes = Number(process.env.ADMIN_TOKEN_TTL_MINUTES || 720);
  if (!Number.isFinite(ttlMinutes) || ttlMinutes <= 0) {
    return 12 * 60 * 60 * 1000;
  }

  return Math.round(ttlMinutes * 60 * 1000);
}

function readTokenSecret() {
  const configured = toText(process.env.ADMIN_TOKEN_SECRET);
  if (configured) {
    return configured;
  }

  return "callcenter-admin-dev-secret";
}

function createSignature(payloadSegment, secret) {
  return crypto.createHmac("sha256", secret).update(payloadSegment).digest("base64url");
}

function issueAdminToken(username) {
  const tokenSecret = readTokenSecret();
  const ttlMs = readTokenTtlMs();
  const now = Date.now();

  const payload = {
    sub: username,
    iat: now,
    exp: now + ttlMs
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createSignature(encodedPayload, tokenSecret);

  return `${encodedPayload}.${signature}`;
}

function verifyAdminToken(token) {
  const raw = toText(token);
  if (!raw || !raw.includes(".")) {
    return null;
  }

  const separatorIndex = raw.lastIndexOf(".");
  const encodedPayload = raw.slice(0, separatorIndex);
  const providedSignature = raw.slice(separatorIndex + 1);

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const tokenSecret = readTokenSecret();
  const expectedSignature = createSignature(encodedPayload, tokenSecret);

  try {
    const providedBuffer = Buffer.from(providedSignature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    if (providedBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
      return null;
    }
  } catch (error) {
    return null;
  }

  let payload = null;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch (error) {
    return null;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const expiry = Number(payload.exp || 0);
  if (!Number.isFinite(expiry) || Date.now() >= expiry) {
    return null;
  }

  return payload;
}

function validateCredentials(username, password) {
  const user = toText(username);
  const pass = toText(password);

  if (!user || !pass) {
    return false;
  }

  const credentials = parseAdminCredentialsFromEnv();
  return credentials.some((entry) => entry.username === user && entry.password === pass);
}

function requireAdminAuth(req, res, next) {
  const rawAuthHeader = toText(req.headers.authorization);
  if (!rawAuthHeader.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({
      ok: false,
      error: "ADMIN_AUTH_REQUIRED"
    });
  }

  const token = rawAuthHeader.slice(7).trim();
  const payload = verifyAdminToken(token);
  if (!payload) {
    return res.status(401).json({
      ok: false,
      error: "ADMIN_AUTH_INVALID"
    });
  }

  req.adminUser = {
    username: toText(payload.sub)
  };

  return next();
}

module.exports = {
  issueAdminToken,
  requireAdminAuth,
  validateCredentials
};
