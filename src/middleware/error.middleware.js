import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";

const safeDatabaseErrors = new Map([
  ["23505", [409, "A record with these details already exists"]],
  ["23503", [409, "The request conflicts with related data"]],
  ["23514", [400, "The request contains an invalid value"]],
  ["22P02", [400, "The request contains an invalid value"]],
  ["22007", [400, "The request contains an invalid date or time"]],
]);

export const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.path}`));
};

export const errorHandler = (error, req, res, _next) => {
  if (res.headersSent) return;

  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || "Internal server error";
  let errors = Array.isArray(error.errors) ? error.errors : [];

  if (safeDatabaseErrors.has(error.code)) {
    [statusCode, message] = safeDatabaseErrors.get(error.code);
    errors = [];
  } else if (error instanceof SyntaxError && "body" in error) {
    statusCode = 400;
    message = "Malformed JSON request body";
    errors = [];
  } else if (!(error instanceof ApiError) && statusCode >= 500) {
    message = "Internal server error";
    errors = [];
  }

  if (statusCode >= 500) {
    logger.error("Request failed", { method: req.method, path: req.path, code: error.code });
  } else if (statusCode >= 400 && statusCode !== 401 && statusCode !== 404) {
    logger.warn("Request rejected", { method: req.method, path: req.path, statusCode });
  }

  return res.status(statusCode).json({ success: false, message, errors });
};
