import { z } from "zod";

export const createFaqSchema = z.object({
  trip_id: z.coerce.number().int().positive().nullable().optional(),
  page_key: z.string().trim().min(1).max(120).nullable().optional(),
  question: z.string().trim().min(1, "Question is required"),
  answer: z.string().trim().min(1, "Answer is required"),
  sort_order: z.coerce.number().int().min(0).default(0),
  status: z.enum(["draft", "published", "archived"]).default("published"),
}).refine(
  (data) => Boolean(data.trip_id) !== Boolean(data.page_key),
  { message: "FAQ must be associated with either trip_id or page_key, but not both" },
);

export const updateFaqSchema = z.object({
  trip_id: z.coerce.number().int().positive().nullable().optional(),
  page_key: z.string().trim().min(1).max(120).nullable().optional(),
  question: z.string().trim().min(1).optional(),
  answer: z.string().trim().min(1).optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
}).refine(
  (data) => {
    if (data.trip_id !== undefined && data.page_key !== undefined) {
      return Boolean(data.trip_id) !== Boolean(data.page_key);
    }
    return true;
  },
  { message: "FAQ must be associated with either trip_id or page_key, but not both" },
);
