import { Router } from "express";
import * as controller from "../../controllers/review.controller.js";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { moderateReviewSchema } from "../../validators/review.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("review.read"), controller.listAdminReviews);
router.get("/:id", requirePermission("review.read"), controller.getAdminReviewById);
router.patch("/:id", requirePermission("review.moderate"), validateBody(moderateReviewSchema), controller.moderateReview);
router.delete("/:id", requirePermission("review.moderate"), controller.deleteReview);
router.delete("/:id/permanent", requirePermission("review.moderate"), controller.permanentDeleteReview);

export default router;
