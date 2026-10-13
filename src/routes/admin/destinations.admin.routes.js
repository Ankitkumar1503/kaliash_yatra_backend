import { Router } from "express";
import * as controller from "../../controllers/destination.controller.js";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { createDestinationSchema, updateDestinationSchema } from "../../validators/destination.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("content.read"), controller.listAdminDestinations);
router.get("/:id", requirePermission("content.read"), controller.getAdminDestinationById);
router.post("/", requirePermission("content.create"), validateBody(createDestinationSchema), controller.createDestination);
router.patch("/:id", requirePermission("content.update"), validateBody(updateDestinationSchema), controller.updateDestination);
router.delete("/:id", requirePermission("content.delete"), controller.archiveDestination);
router.post("/:id/restore", requirePermission("content.update"), controller.restoreDestination);
router.delete("/:id/permanent", requirePermission("content.delete"), controller.deleteDestination);

export default router;
