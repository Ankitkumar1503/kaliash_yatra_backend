import { Router } from "express";
import * as controller from "../../controllers/gallery.controller.js";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { createGalleryItemSchema, updateGalleryItemSchema } from "../../validators/gallery.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("content.read"), controller.listAdminGallery);
router.get("/:id", requirePermission("content.read"), controller.getAdminGalleryById);
router.post("/", requirePermission("content.create"), validateBody(createGalleryItemSchema), controller.createGalleryItem);
router.patch("/:id", requirePermission("content.update"), validateBody(updateGalleryItemSchema), controller.updateGalleryItem);
router.delete("/:id", requirePermission("content.delete"), controller.archiveGalleryItem);
router.post("/:id/restore", requirePermission("content.update"), controller.restoreGalleryItem);
router.delete("/:id/permanent", requirePermission("content.delete"), controller.deleteGalleryItem);

export default router;
