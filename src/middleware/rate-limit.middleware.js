import rateLimit from "express-rate-limit";

const responseHandler = (_req, res) => {
  res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
    errors: [],
  });
};

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 10),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: responseHandler,
});

// Apply this limiter when public review, newsletter, and inquiry write routes are added.
export const publicWriteRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.PUBLIC_WRITE_RATE_LIMIT || 20),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: responseHandler,
});
