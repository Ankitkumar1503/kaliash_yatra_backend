import { z } from "zod";

export const createInquirySchema = z.object({
  trip_id: z.coerce.number().int().positive().nullable().optional(),
  type: z.string().trim().default("contact"),
  name: z.string().trim().min(1, "Name is required").max(180),
  email: z.string().trim().email("Invalid email address").max(254),
  phone: z.string().trim().max(80).nullable().optional(),
  travel_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Travel date must be in YYYY-MM-DD format").nullable().optional(),
  travelers: z.coerce.number().int().positive().nullable().optional(),
  message: z.string().trim().max(10000).nullable().optional(),
  custom_details: z.record(z.string(), z.any()).nullable().optional(),
}).passthrough();

export const updateInquiryStatusSchema = z.object({
  status: z.enum(["new", "in_progress", "closed", "converted"]),
}).strict();
