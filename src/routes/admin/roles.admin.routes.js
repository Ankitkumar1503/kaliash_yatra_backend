import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import {
  getRoles,
  getRole,
  getAllPermissions,
  updateRolePermissions,
} from "../../controllers/user-admin.controller.js";
import { updateRolePermissionsSchema } from "../../validators/user-admin.validator.js";

const router = express.Router();

router.use(requireAuth);

router.get("/permissions", requirePermission("role.read"), getAllPermissions);
router.get("/", requirePermission("role.read"), getRoles);
router.get("/:id", requirePermission("role.read"), getRole);
router.put("/:id/permissions", requirePermission("role.manage"), validateBody(updateRolePermissionsSchema), updateRolePermissions);
router.patch("/:id/permissions", requirePermission("role.manage"), validateBody(updateRolePermissionsSchema), updateRolePermissions);

export default router;
