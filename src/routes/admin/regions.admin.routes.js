import { Router } from "express";
import * as controller from "../../controllers/region.controller.js";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { createRegionSchema, updateRegionSchema } from "../../validators/region.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("content.read"), controller.listAdminRegions);
router.get("/:id", requirePermission("content.read"), controller.getAdminRegionById);
router.post("/", requirePermission("content.create"), validateBody(createRegionSchema), controller.createRegion);
router.patch("/:id", requirePermission("content.update"), validateBody(updateRegionSchema), controller.updateRegion);
router.delete("/:id", requirePermission("content.delete"), controller.archiveRegion);
router.post("/:id/restore", requirePermission("content.update"), controller.restoreRegion);
router.delete("/:id/permanent", requirePermission("content.delete"), controller.deleteRegion);

export default router;
