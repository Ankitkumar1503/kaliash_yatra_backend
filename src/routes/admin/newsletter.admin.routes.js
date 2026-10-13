import { Router } from "express";
import * as controller from "../../controllers/newsletter.controller.js";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { updateNewsletterStatusSchema } from "../../validators/newsletter.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("newsletter.read"), controller.listAdminSubscribers);
router.get("/:id", requirePermission("newsletter.read"), controller.getSubscriberById);
router.patch("/:id", requirePermission("newsletter.manage"), validateBody(updateNewsletterStatusSchema), controller.updateSubscriberStatus);
router.delete("/:id", requirePermission("newsletter.manage"), controller.deleteSubscriber);

export default router;
