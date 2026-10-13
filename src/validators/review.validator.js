import { z } from "zod";

export const publicReviewSubmitSchema = z.object({
  trip_id: z.coerce.number().int().positive().nullable().optional(),
  name: z.string().trim().min(1, "Name is required").max(180),
  email: z.string().trim().email("Invalid email address").max(254).nullable().optional(),
  location: z.string().trim().max(180).default(""),
  title: z.string().trim().max(240).nullable().optional(),
  message: z.string().trim().min(1, "Message is required").max(5000),
  rating: z.coerce.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  photo_media_id: z.coerce.number().int().positive().nullable().optional(),
}).strict();

export const moderateReviewSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "hidden"], {
    errorMap: () => ({ message: "Status must be pending, approved, rejected, or hidden" }),
  }),
  title: z.string().trim().max(240).nullable().optional(),
  message: z.string().trim().min(1).max(5000).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
}).strict();
