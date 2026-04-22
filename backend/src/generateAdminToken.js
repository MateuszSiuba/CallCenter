const { issueAdminToken } = require("./adminAuth");

function toText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function readArgs() {
  const username = toText(process.argv[2]) || toText(process.env.ADMIN_TOKEN_USER) || "CallCenterAdmin";
  const ttlMinutes = toText(process.argv[3]) || toText(process.env.ADMIN_TOKEN_TTL_MINUTES);

  if (ttlMinutes) {
    process.env.ADMIN_TOKEN_TTL_MINUTES = ttlMinutes;
  }

  return {
    username
  };
}

function decodePayload(token) {
  const payloadSegment = String(token || "").split(".")[0] || "";
  if (!payloadSegment) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8"));
  } catch (_error) {
    return null;
  }
}

function run() {
  const input = readArgs();
  const token = issueAdminToken(input.username);
  const payload = decodePayload(token);

  console.log("username=" + input.username);
  if (payload && payload.exp) {
    console.log("expiresAt=" + new Date(Number(payload.exp)).toISOString());
  }
  console.log("token=" + token);
}

run();
