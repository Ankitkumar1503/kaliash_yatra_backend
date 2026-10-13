import { z } from "zod";

export const createMediaSchema = z.object({
  storage_key: z.string().trim().min(1, "Storage key is required"),
  public_url: z.string().trim().min(1, "Public URL is required"),
  media_type: z.string().trim().min(1, "Media type is required").max(80),
  alt_text: z.string().nullable().optional(),
  width: z.coerce.number().int().positive().nullable().optional(),
  height: z.coerce.number().int().positive().nullable().optional(),
  file_size: z.coerce.number().int().min(0).nullable().optional(),
}).strict();

export const updateMediaSchema = z.object({
  public_url: z.string().trim().min(1).optional(),
  alt_text: z.string().nullable().optional(),
  width: z.coerce.number().int().positive().nullable().optional(),
  height: z.coerce.number().int().positive().nullable().optional(),
  file_size: z.coerce.number().int().min(0).nullable().optional(),
}).strict();
