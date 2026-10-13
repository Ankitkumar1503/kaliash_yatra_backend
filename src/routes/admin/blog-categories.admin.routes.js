import { Router } from "express";
import * as controller from "../../controllers/blog-category.controller.js";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { createBlogCategorySchema, updateBlogCategorySchema } from "../../validators/blog-category.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("blog.read"), controller.listBlogCategories);
router.get("/:id", requirePermission("blog.read"), controller.getBlogCategoryById);
router.post("/", requirePermission("blog.create"), validateBody(createBlogCategorySchema), controller.createBlogCategory);
router.patch("/:id", requirePermission("blog.update"), validateBody(updateBlogCategorySchema), controller.updateBlogCategory);
router.delete("/:id", requirePermission("blog.delete"), controller.deleteBlogCategory);

export default router;
