import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const blogSectionSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  title: z.string().trim().min(1, "Section title is required").max(240),
  media_id: z.coerce.number().int().positive().nullable().optional(),
  image_alt: z.string().nullable().optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
  paragraphs: z.array(z.string().trim().min(1)).default([]),
});

export const createBlogSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(240),
  slug: z.string().trim().regex(slugRegex, "Invalid slug format").max(220).optional(),
  description: z.string().default(""),
  published_at: z.string().datetime().nullable().optional(),
  author: z.string().trim().max(180).default(""),
  author_role: z.string().trim().max(180).default(""),
  author_media_id: z.coerce.number().int().positive().nullable().optional(),
  hero_media_id: z.coerce.number().int().positive().nullable().optional(),
  hero_image_alt: z.string().default(""),
  category_id: z.coerce.number().int().positive().nullable().optional(),
  intro: z.string().nullable().optional(),
  quote: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  seo_title: z.string().max(240).nullable().optional(),
  seo_description: z.string().nullable().optional(),
  sections: z.array(blogSectionSchema).optional(),
}).strict();

export const updateBlogSchema = z.object({
  title: z.string().trim().min(1).max(240).optional(),
  slug: z.string().trim().regex(slugRegex, "Invalid slug format").max(220).optional(),
  description: z.string().optional(),
  published_at: z.string().datetime().nullable().optional(),
  author: z.string().trim().max(180).optional(),
  author_role: z.string().trim().max(180).optional(),
  author_media_id: z.coerce.number().int().positive().nullable().optional(),
  hero_media_id: z.coerce.number().int().positive().nullable().optional(),
  hero_image_alt: z.string().optional(),
  category_id: z.coerce.number().int().positive().nullable().optional(),
  intro: z.string().nullable().optional(),
  quote: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  seo_title: z.string().max(240).nullable().optional(),
  seo_description: z.string().nullable().optional(),
  sections: z.array(blogSectionSchema).optional(),
}).strict();
