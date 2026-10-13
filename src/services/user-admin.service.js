import * as userAdminModel from "../models/user-admin.model.js";
import ApiError from "../utils/ApiError.js";

export const listUsers = async (query) => {
  const page = query.page ? Math.max(1, parseInt(query.page, 10) || 1) : 1;
  const limit = query.limit ? Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20)) : 20;
  const search = query.search ? String(query.search).trim() : undefined;
  const role = query.role ? String(query.role).trim() : undefined;
  let is_active;
  if (query.is_active !== undefined) {
    is_active = query.is_active === "true" || query.is_active === true;
  }

  return await userAdminModel.listAdminUsers({ page, limit, search, role, is_active });
};

export const getUserById = async (id) => {
  const user = await userAdminModel.getAdminUserById(id);
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const updateUser = async (id, data) => {
  return await userAdminModel.updateAdminUser(id, data);
};

export const assignRoles = async (id, roles) => {
  return await userAdminModel.assignUserRoles(id, roles);
};

export const listRoles = async () => {
  return await userAdminModel.listRoles();
};

export const getRoleById = async (id) => {
  const role = await userAdminModel.getRoleById(id);
  if (!role) throw new ApiError(404, "Role not found");
  return role;
};

export const listAllPermissions = async () => {
  return await userAdminModel.listAllPermissions();
};

export const updateRolePermissions = async (roleId, permissions) => {
  return await userAdminModel.updateRolePermissions(roleId, permissions);
};
