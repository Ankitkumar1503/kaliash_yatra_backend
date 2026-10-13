import { Router } from "express";
import * as controller from "../../controllers/trip.controller.js";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { createTripSchema, updateTripSchema } from "../../validators/trip.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("trip.read"), controller.listAdminTrips);
router.get("/:id", requirePermission("trip.read"), controller.getAdminTripById);
router.post("/", requirePermission("trip.create"), validateBody(createTripSchema), controller.createTrip);
router.patch("/:id", requirePermission("trip.update"), validateBody(updateTripSchema), controller.updateTrip);
router.delete("/:id", requirePermission("trip.delete"), controller.archiveTrip);
router.post("/:id/restore", requirePermission("trip.update"), controller.restoreTrip);
router.delete("/:id/permanent", requirePermission("trip.delete"), controller.deleteTrip);

export default router;
