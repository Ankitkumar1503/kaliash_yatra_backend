import { Router } from "express";
import * as controller from "../../controllers/trip-category.controller.js";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { createTripCategorySchema, updateTripCategorySchema } from "../../validators/trip-category.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("content.read"), controller.listCategories);
router.get("/:id", requirePermission("content.read"), controller.getCategoryById);
router.post("/", requirePermission("content.create"), validateBody(createTripCategorySchema), controller.createCategory);
router.patch("/:id", requirePermission("content.update"), validateBody(updateTripCategorySchema), controller.updateCategory);
router.delete("/:id", requirePermission("content.delete"), controller.deleteCategory);

export default router;
