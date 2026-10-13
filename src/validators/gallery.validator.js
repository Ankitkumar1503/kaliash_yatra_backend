import { z } from "zod";

export const createGalleryItemSchema = z.object({
  media_id: z.coerce.number().int().positive("A valid media asset ID is required"),
  title: z.string().trim().min(1, "Title is required").max(240),
  location: z.string().trim().max(180).nullable().optional(),
  alt_text: z.string().default(""),
  sort_order: z.coerce.number().int().min(0).default(0),
  trip_id: z.coerce.number().int().positive().nullable().optional(),
  blog_id: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
}).strict();

export const updateGalleryItemSchema = z.object({
  media_id: z.coerce.number().int().positive().optional(),
  title: z.string().trim().min(1).max(240).optional(),
  location: z.string().trim().max(180).nullable().optional(),
  alt_text: z.string().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
  trip_id: z.coerce.number().int().positive().nullable().optional(),
  blog_id: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
}).strict();
