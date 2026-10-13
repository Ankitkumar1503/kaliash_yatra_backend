import express from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import {
  getUsers,
  getUser,
  updateUser,
  assignRoles,
} from "../../controllers/user-admin.controller.js";
import {
  updateUserAdminSchema,
  assignUserRolesSchema,
} from "../../validators/user-admin.validator.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", requirePermission("user.read"), getUsers);
router.get("/:id", requirePermission("user.read"), getUser);
router.patch("/:id", requirePermission("user.manage"), validateBody(updateUserAdminSchema), updateUser);
router.put("/:id/roles", requirePermission("user.manage"), validateBody(assignUserRolesSchema), assignRoles);
router.patch("/:id/roles", requirePermission("user.manage"), validateBody(assignUserRolesSchema), assignRoles);

export default router;
