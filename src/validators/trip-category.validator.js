import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createTripCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(180),
  slug: z.string().trim().regex(slugRegex, "Invalid slug format (lowercase letters, numbers, hyphens)").max(180).optional(),
  description: z.string().default(""),
  media_id: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
}).strict();

export const updateTripCategorySchema = z.object({
  name: z.string().trim().min(1).max(180).optional(),
  slug: z.string().trim().regex(slugRegex, "Invalid slug format").max(180).optional(),
  description: z.string().optional(),
  media_id: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
}).strict();
