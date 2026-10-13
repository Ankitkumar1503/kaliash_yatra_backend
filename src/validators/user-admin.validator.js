import { z } from "zod";

export const updateUserAdminSchema = z
  .object({
    name: z.string().trim().min(1, "Name cannot be empty").max(120).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => data.name !== undefined || data.is_active !== undefined, {
    message: "At least one field (name, is_active) must be provided",
  });

export const assignUserRolesSchema = z.object({
  roles: z.array(z.string().trim().min(1)).min(1, "At least one role must be provided"),
});

export const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.string().trim().min(1)),
});
