import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const popularPlaceSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  source_id: z.string().trim().min(1).max(180).optional(),
  name: z.string().trim().min(1).max(240),
  description: z.string().default(""),
  media_id: z.coerce.number().int().positive().nullable().optional(),
  href: z.string().nullable().optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

export const experienceSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  source_id: z.string().trim().min(1).max(180).optional(),
  title: z.string().trim().min(1).max(240),
  description: z.string().default(""),
  media_id: z.coerce.number().int().positive().nullable().optional(),
  badge: z.string().max(80).nullable().optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

export const createRegionSchema = z.object({
  destination_id: z.coerce.number().int().positive("A valid destination ID is required"),
  title: z.string().trim().min(1, "Title is required").max(180),
  slug: z.string().trim().regex(slugRegex, "Invalid slug format").max(180).optional(),
  subtitle: z.string().default(""),
  tagline: z.string().default(""),
  hero_media_id: z.coerce.number().int().positive().nullable().optional(),
  about_title: z.string().max(240).default(""),
  about_paragraphs: z.array(z.string()).default([]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  published_at: z.string().datetime().nullable().optional(),
  popular_places: z.array(popularPlaceSchema).optional(),
  experiences: z.array(experienceSchema).optional(),
}).strict();

export const updateRegionSchema = z.object({
  destination_id: z.coerce.number().int().positive().optional(),
  title: z.string().trim().min(1).max(180).optional(),
  slug: z.string().trim().regex(slugRegex, "Invalid slug format").max(180).optional(),
  subtitle: z.string().optional(),
  tagline: z.string().optional(),
  hero_media_id: z.coerce.number().int().positive().nullable().optional(),
  about_title: z.string().max(240).optional(),
  about_paragraphs: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  published_at: z.string().datetime().nullable().optional(),
  popular_places: z.array(popularPlaceSchema).optional(),
  experiences: z.array(experienceSchema).optional(),
}).strict();
