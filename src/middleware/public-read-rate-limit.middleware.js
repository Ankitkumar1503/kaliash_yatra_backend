import rateLimit from "express-rate-limit";

export const publicReadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.PUBLIC_READ_RATE_LIMIT || 120),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
    errors: [],
  }),
});
