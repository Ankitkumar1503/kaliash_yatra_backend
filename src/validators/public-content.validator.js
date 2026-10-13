import { z } from "zod";
import ApiError from "../utils/ApiError.js";

const positiveInteger = (fallback, max = 100000) => z.coerce.number().int().min(1).max(max).default(fallback);
const pagination = {
  page: positiveInteger(1, 100000),
  limit: z.coerce.number().int().min(1).max(100).default(12),
};
const optionalText = (max = 180) => z.string().trim().min(1).max(max).optional();
const tripSort = z.enum(["published", "price", "duration", "title"]).default("published");
const blogSort = z.enum(["published", "title"]).default("published");
const baseList = z.object({ ...pagination, search: optionalText(200) });

export const listSchemas = {
  destinations: baseList.extend({ country: optionalText(120), sort: z.enum(["name", "published"]).default("name") }).strict(),
  activities: baseList.extend({ sort: z.enum(["title", "published"]).default("title") }).strict(),
  regions: baseList.extend({ destination: optionalText(180), sort: z.enum(["title", "published"]).default("title") }).strict(),
  trips: baseList.extend({
    destination: optionalText(180), region: optionalText(180), activity: optionalText(180), category: optionalText(180),
    difficulty: z.enum(["easy", "moderate", "challenging", "strenuous"]).optional(),
    featured: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
    minPrice: z.coerce.number().min(0).optional(), maxPrice: z.coerce.number().min(0).optional(), sort: tripSort,
  }).strict(),
  blogs: baseList.extend({ category: optionalText(180), sort: blogSort }).strict(),
  reviews: z.object({ ...pagination, trip: optionalText(220) }).strict(),
  faqs: z.object({ ...pagination, trip: optionalText(220), pageKey: optionalText(120) }).strict(),
  gallery: z.object({ ...pagination, trip: optionalText(220), search: optionalText(200) }).strict(),
};

export const validateQuery = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    return next(new ApiError(400, "Request validation failed", result.error.issues.map(({ path, message, code }) => ({ field: path.join("."), message, code }))));
  }
  req.validatedQuery = result.data;
  return next();
};

export const validateSlug = (req, _res, next) => {
  if (typeof req.params.slug !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9-]{0,219}$/.test(req.params.slug)) {
    return next(new ApiError(400, "Invalid slug"));
  }
  return next();
};
