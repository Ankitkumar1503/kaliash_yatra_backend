import { Router } from "express";
import * as controller from "../../controllers/faq.controller.js";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { createFaqSchema, updateFaqSchema } from "../../validators/faq.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("content.read"), controller.listAdminFaqs);
router.get("/:id", requirePermission("content.read"), controller.getAdminFaqById);
router.post("/", requirePermission("content.create"), validateBody(createFaqSchema), controller.createFaq);
router.patch("/:id", requirePermission("content.update"), validateBody(updateFaqSchema), controller.updateFaq);
router.delete("/:id", requirePermission("content.delete"), controller.deleteFaq);

export default router;
