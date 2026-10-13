import express from "express";
import { requireAuth, requirePermission } from "../middleware/auth.middleware.js";
import tripCategoriesRouter from "./admin/trip-categories.admin.routes.js";
import destinationsRouter from "./admin/destinations.admin.routes.js";
import activitiesRouter from "./admin/activities.admin.routes.js";
import regionsRouter from "./admin/regions.admin.routes.js";
import tripsRouter from "./admin/trips.admin.routes.js";
import blogsRouter from "./admin/blogs.admin.routes.js";
import blogCategoriesRouter from "./admin/blog-categories.admin.routes.js";
import faqsRouter from "./admin/faqs.admin.routes.js";
import reviewsRouter from "./admin/reviews.admin.routes.js";
import mediaRouter from "./admin/media.admin.routes.js";
import galleryRouter from "./admin/gallery.admin.routes.js";
import inquiriesRouter from "./admin/inquiries.admin.routes.js";
import newsletterRouter from "./admin/newsletter.admin.routes.js";
import usersRouter from "./admin/users.admin.routes.js";
import rolesRouter from "./admin/roles.admin.routes.js";

const router = express.Router();

// Small read-only access endpoint confirms identity and the caller's live RBAC grants.
router.get("/permissions", requireAuth, requirePermission("role.read"), (req, res) => {
  res.json({ success: true, message: "Permissions loaded", data: [...req.permissions].sort() });
});

router.use("/trip-categories", tripCategoriesRouter);
router.use("/destinations", destinationsRouter);
router.use("/activities", activitiesRouter);
router.use("/regions", regionsRouter);
router.use("/trips", tripsRouter);
router.use("/blogs", blogsRouter);
router.use("/blog-categories", blogCategoriesRouter);
router.use("/faqs", faqsRouter);
router.use("/reviews", reviewsRouter);
router.use("/media", mediaRouter);
router.use("/gallery", galleryRouter);
router.use("/inquiries", inquiriesRouter);
router.use("/enquiries", inquiriesRouter);
router.use("/newsletter", newsletterRouter);
router.use("/users", usersRouter);
router.use("/roles", rolesRouter);

export default router;






