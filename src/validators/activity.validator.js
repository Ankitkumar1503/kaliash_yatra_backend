import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createActivitySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(180),
  slug: z.string().trim().regex(slugRegex, "Invalid slug format").max(180).optional(),
  short_description: z.string().default(""),
  description: z.string().default(""),
  hero_media_id: z.coerce.number().int().positive().nullable().optional(),
  icon_name: z.string().max(100).default(""),
  badge: z.string().max(80).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  published_at: z.string().datetime().nullable().optional(),
}).strict();

export const updateActivitySchema = z.object({
  title: z.string().trim().min(1).max(180).optional(),
  slug: z.string().trim().regex(slugRegex, "Invalid slug format").max(180).optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  hero_media_id: z.coerce.number().int().positive().nullable().optional(),
  icon_name: z.string().max(100).optional(),
  badge: z.string().max(80).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  published_at: z.string().datetime().nullable().optional(),
}).strict();
