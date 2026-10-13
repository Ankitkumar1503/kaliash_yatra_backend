import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createDestinationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(180),
  slug: z.string().trim().regex(slugRegex, "Invalid slug format").max(180).optional(),
  country: z.string().trim().min(1, "Country is required").max(120),
  tagline: z.string().default(""),
  short_description: z.string().default(""),
  description: z.string().default(""),
  hero_media_id: z.coerce.number().int().positive().nullable().optional(),
  featured_media_id: z.coerce.number().int().positive().nullable().optional(),
  badge: z.string().max(80).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  published_at: z.string().datetime().nullable().optional(),
}).strict();

export const updateDestinationSchema = z.object({
  name: z.string().trim().min(1).max(180).optional(),
  slug: z.string().trim().regex(slugRegex, "Invalid slug format").max(180).optional(),
  country: z.string().trim().min(1).max(120).optional(),
  tagline: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  hero_media_id: z.coerce.number().int().positive().nullable().optional(),
  featured_media_id: z.coerce.number().int().positive().nullable().optional(),
  badge: z.string().max(80).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  published_at: z.string().datetime().nullable().optional(),
}).strict();
