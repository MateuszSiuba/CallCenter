const { searchModels } = require("./modelSearchService");

async function searchModelsHandler(req, res) {
  try {
    const result = await searchModels(req.query && req.query.q);

    if (!result) {
      res.status(404).json({
        ok: false,
        error: "NOT_FOUND",
        message: "No matching model series found"
      });
      return;
    }

    res.json(result);
  } catch (error) {
    const rawMessage = String(error && error.message ? error.message : "");
    const statusCode = Number(error && error.statusCode) || (rawMessage.includes("DATABASE_URL") ? 503 : 500);
    const code = String(error && error.code) || (statusCode === 400 ? "BAD_REQUEST" : statusCode === 503 ? "SERVICE_UNAVAILABLE" : "SEARCH_FAILED");

    res.status(statusCode).json({
      ok: false,
      error: code,
      message: rawMessage || "Search failed"
    });
  }
}

module.exports = {
  searchModelsHandler
};