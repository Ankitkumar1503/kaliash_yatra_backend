import path from "node:path";
import fs from "node:fs";
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import ApiError from "./utils/ApiError.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { publicWriteRateLimiter } from "./middleware/rate-limit.middleware.js";
import { publicReadRateLimiter } from "./middleware/public-read-rate-limit.middleware.js";
import { validateBody } from "./middleware/validate.middleware.js";
import publicContentRoutes from "./routes/public-content.routes.js";
import { createPublicReview } from "./controllers/review.controller.js";
import { publicReviewSubmitSchema } from "./validators/review.validator.js";
import { createPublicInquiry } from "./controllers/inquiry.controller.js";
import { createInquirySchema } from "./validators/inquiry.validator.js";
import { subscribe as subscribeNewsletter } from "./controllers/newsletter.controller.js";
import { subscribeNewsletterSchema } from "./validators/newsletter.validator.js";

const app = express();
const allowedOrigins = new Set([
  process.env.PUBLIC_WEB_ORIGIN,
  process.env.CMS_WEB_ORIGIN,
  ...(process.env.CORS_ALLOWED_ORIGINS || "").split(","),
].map((origin) => origin?.trim()).filter(Boolean));

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new ApiError(403, "Origin not allowed"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.static("public"));
const frontendImagesDir = path.resolve(process.cwd(), "../kaliash-yatra-frontend/public/images");
if (fs.existsSync(frontendImagesDir)) {
  app.use("/images", express.static(frontendImagesDir));
}
app.use(cookieParser());

app.get("/", (_req, res) => res.json({ status: "ok" }));
app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

app.post("/api/v1/reviews", publicWriteRateLimiter, validateBody(publicReviewSubmitSchema), createPublicReview);
app.post("/api/v1/newsletter/subscribe", publicWriteRateLimiter, validateBody(subscribeNewsletterSchema), subscribeNewsletter);
app.post("/api/v1/inquiries", publicWriteRateLimiter, validateBody(createInquirySchema), createPublicInquiry);

app.use("/api/v1", userRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", publicReadRateLimiter, publicContentRoutes);
app.use("/api/v1/admin", adminRoutes);


app.use(notFoundHandler);
app.use(errorHandler);

export default app;
