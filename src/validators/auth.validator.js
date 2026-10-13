import { z } from "zod";

const email = z.string().trim().email().max(90).transform((value) => value.toLowerCase());

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email,
  password: z.string().min(8).max(72),
}).strict();

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
}).strict();
