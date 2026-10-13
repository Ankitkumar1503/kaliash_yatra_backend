import * as userAdminService from "../services/user-admin.service.js";

export const getUsers = async (req, res) => {
  const result = await userAdminService.listUsers(req.query);
  return res.status(200).json({
    success: true,
    message: "Admin users retrieved successfully",
    data: result.users,
    pagination: result.pagination,
  });
};

export const getUser = async (req, res) => {
  const user = await userAdminService.getUserById(req.params.id);
  return res.status(200).json({
    success: true,
    message: "Admin user retrieved successfully",
    data: user,
  });
};

export const updateUser = async (req, res) => {
  const updated = await userAdminService.updateUser(req.params.id, req.validatedBody);
  return res.status(200).json({
    success: true,
    message: "Admin user updated successfully",
    data: updated,
  });
};

export const assignRoles = async (req, res) => {
  const { roles } = req.validatedBody;
  const updated = await userAdminService.assignRoles(req.params.id, roles);
  return res.status(200).json({
    success: true,
    message: "User roles updated successfully",
    data: updated,
  });
};

export const getRoles = async (_req, res) => {
  const roles = await userAdminService.listRoles();
  return res.status(200).json({
    success: true,
    message: "Roles retrieved successfully",
    data: roles,
  });
};

export const getRole = async (req, res) => {
  const role = await userAdminService.getRoleById(req.params.id);
  return res.status(200).json({
    success: true,
    message: "Role details retrieved successfully",
    data: role,
  });
};

export const getAllPermissions = async (_req, res) => {
  const permissions = await userAdminService.listAllPermissions();
  return res.status(200).json({
    success: true,
    message: "System permissions retrieved successfully",
    data: permissions,
  });
};

export const updateRolePermissions = async (req, res) => {
  const { permissions } = req.validatedBody;
  const updated = await userAdminService.updateRolePermissions(req.params.id, permissions);
  return res.status(200).json({
    success: true,
    message: "Role permissions updated successfully",
    data: updated,
  });
};
