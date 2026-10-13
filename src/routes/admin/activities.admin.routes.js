import { Router } from "express";
import * as controller from "../../controllers/activity.controller.js";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { createActivitySchema, updateActivitySchema } from "../../validators/activity.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("content.read"), controller.listAdminActivities);
router.get("/:id", requirePermission("content.read"), controller.getAdminActivityById);
router.post("/", requirePermission("content.create"), validateBody(createActivitySchema), controller.createActivity);
router.patch("/:id", requirePermission("content.update"), validateBody(updateActivitySchema), controller.updateActivity);
router.delete("/:id", requirePermission("content.delete"), controller.archiveActivity);
router.post("/:id/restore", requirePermission("content.update"), controller.restoreActivity);
router.delete("/:id/permanent", requirePermission("content.delete"), controller.deleteActivity);

export default router;
