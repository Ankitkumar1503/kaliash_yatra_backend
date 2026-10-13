import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createBlogCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(180),
  slug: z.string().trim().regex(slugRegex, "Invalid slug format").max(180).optional(),
  status: z.enum(["active", "inactive"]).default("active"),
}).strict();

export const updateBlogCategorySchema = z.object({
  name: z.string().trim().min(1).max(180).optional(),
  slug: z.string().trim().regex(slugRegex, "Invalid slug format").max(180).optional(),
  status: z.enum(["active", "inactive"]).optional(),
}).strict();
