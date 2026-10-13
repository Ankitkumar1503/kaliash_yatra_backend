import { Router } from "express";
import * as controller from "../../controllers/inquiry.controller.js";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { updateInquiryStatusSchema } from "../../validators/inquiry.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("inquiry.read"), controller.listAdminInquiries);
router.get("/:id", requirePermission("inquiry.read"), controller.getAdminInquiryById);
router.patch("/:id", requirePermission("inquiry.update"), validateBody(updateInquiryStatusSchema), controller.updateInquiryStatus);
router.delete("/:id", requirePermission("inquiry.update"), controller.deleteInquiry);

export default router;
