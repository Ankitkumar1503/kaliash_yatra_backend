import { z } from "zod";

export const subscribeNewsletterSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(254).transform((v) => v.toLowerCase()),
}).strict();

export const updateNewsletterStatusSchema = z.object({
  status: z.enum(["active", "unsubscribed"]),
}).strict();
