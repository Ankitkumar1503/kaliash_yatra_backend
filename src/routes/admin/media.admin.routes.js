import { Router } from "express";
import * as controller from "../../controllers/media.controller.js";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { handleSingleUpload } from "../../middleware/upload.middleware.js";
import { createMediaSchema, updateMediaSchema } from "../../validators/media.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("media.read"), controller.listAdminMedia);
router.get("/:id", requirePermission("media.read"), controller.getAdminMediaById);
router.post("/upload", requirePermission("media.create"), handleSingleUpload("file"), controller.uploadMedia);
router.post("/", requirePermission("media.create"), validateBody(createMediaSchema), controller.createMedia);
router.patch("/:id", requirePermission("media.update"), validateBody(updateMediaSchema), controller.updateMedia);
router.delete("/:id", requirePermission("media.delete"), controller.deleteMedia);

export default router;
