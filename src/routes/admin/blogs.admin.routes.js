import { Router } from "express";
import * as controller from "../../controllers/blog.controller.js";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { createBlogSchema, updateBlogSchema } from "../../validators/blog.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("blog.read"), controller.listAdminBlogs);
router.get("/:id", requirePermission("blog.read"), controller.getAdminBlogById);
router.post("/", requirePermission("blog.create"), validateBody(createBlogSchema), controller.createBlog);
router.patch("/:id", requirePermission("blog.update"), validateBody(updateBlogSchema), controller.updateBlog);
router.delete("/:id", requirePermission("blog.delete"), controller.archiveBlog);
router.post("/:id/restore", requirePermission("blog.update"), controller.restoreBlog);
router.delete("/:id/permanent", requirePermission("blog.delete"), controller.deleteBlog);

export default router;
