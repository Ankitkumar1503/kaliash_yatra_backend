import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export const countActiveAdmins = async (client = pool) => {
  const { rows } = await client.query(
    `SELECT count(DISTINCT u.id)::int AS count
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     WHERE r.key = 'admin' AND u.is_active = TRUE`,
  );
  return rows[0]?.count ?? 0;
};

export const listAdminUsers = async ({ page = 1, limit = 20, search, role, is_active }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }

  if (role) {
    params.push(role);
    conditions.push(`EXISTS (
      SELECT 1 FROM user_roles ur_filter
      JOIN roles r_filter ON r_filter.id = ur_filter.role_id
      WHERE ur_filter.user_id = u.id AND r_filter.key = $${params.length}
    )`);
  }

  if (is_active !== undefined) {
    params.push(is_active);
    conditions.push(`u.is_active = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await pool.query(
    `SELECT count(*)::int AS total FROM users u ${whereClause}`,
    params,
  );
  const total = countResult.rows[0]?.total ?? 0;

  params.push(limit, offset);
  const dataQuery = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.role::text AS legacy_role,
      u.is_active,
      u.created_at,
      u.updated_at,
      COALESCE(
        array_agg(r.key ORDER BY r.key) FILTER (WHERE r.key IS NOT NULL),
        '{}'
      ) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    ${whereClause}
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const { rows } = await pool.query(dataQuery, params);

  return {
    users: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.legacy_role,
      roles: row.roles,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getAdminUserById = async (id) => {
  const { rows: userRows } = await pool.query(
    `SELECT id, name, email, role::text AS legacy_role, is_active, created_at, updated_at
     FROM users WHERE id = $1 LIMIT 1`,
    [id],
  );
  if (!userRows[0]) return null;

  const user = userRows[0];

  const { rows: roleRows } = await pool.query(
    `SELECT r.id, r.key, r.name, r.description
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = $1
     ORDER BY r.key ASC`,
    [id],
  );

  const { rows: permRows } = await pool.query(
    `SELECT DISTINCT p.key
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     JOIN role_permissions rp ON rp.role_id = r.id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE ur.user_id = $1
     ORDER BY p.key ASC`,
    [id],
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.legacy_role,
    roles: roleRows.map((r) => r.key),
    role_details: roleRows,
    permissions: permRows.map((p) => p.key),
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

export const updateAdminUser = async (id, { name, is_active }) => {
  const user = await getAdminUserById(id);
  if (!user) throw new ApiError(404, "User not found");

  if (is_active === false && user.is_active === true && user.roles.includes("admin")) {
    const activeAdmins = await countActiveAdmins();
    if (activeAdmins <= 1) {
      throw new ApiError(400, "Cannot deactivate the last active administrator");
    }
  }

  const updates = [];
  const params = [];

  if (name !== undefined) {
    params.push(name);
    updates.push(`name = $${params.length}`);
  }

  if (is_active !== undefined) {
    params.push(is_active);
    updates.push(`is_active = $${params.length}`);
  }

  updates.push(`updated_at = now()`);
  params.push(id);

  const query = `
    UPDATE users
    SET ${updates.join(", ")}
    WHERE id = $${params.length}
    RETURNING id, name, email, role::text AS legacy_role, is_active, created_at, updated_at
  `;

  await pool.query(query, params);
  return await getAdminUserById(id);
};

export const assignUserRoles = async (id, roleKeys) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: userRows } = await client.query(
      `SELECT id, is_active FROM users WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (!userRows[0]) throw new ApiError(404, "User not found");
    const user = userRows[0];

    // Check if target user currently has admin role
    const { rows: currentRoles } = await client.query(
      `SELECT r.key FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1`,
      [id],
    );
    const hasAdmin = currentRoles.some((r) => r.key === "admin");

    // If active admin is having admin role removed, check count
    if (hasAdmin && user.is_active && !roleKeys.includes("admin")) {
      const activeAdmins = await countActiveAdmins(client);
      if (activeAdmins <= 1) {
        throw new ApiError(400, "Cannot remove administrator role from the last active administrator");
      }
    }

    // Verify all roleKeys exist
    const { rows: validRoles } = await client.query(
      `SELECT id, key FROM roles WHERE key = ANY($1)`,
      [roleKeys],
    );
    if (validRoles.length !== roleKeys.length) {
      const validKeySet = new Set(validRoles.map((r) => r.key));
      const invalidKeys = roleKeys.filter((k) => !validKeySet.has(k));
      throw new ApiError(400, `Unknown role(s): ${invalidKeys.join(", ")}`);
    }

    // Replace user_roles
    await client.query(`DELETE FROM user_roles WHERE user_id = $1`, [id]);

    for (const role of validRoles) {
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
        [id, role.id],
      );
    }

    // Sync legacy users.role column
    const legacyRole = roleKeys.includes("admin")
      ? "admin"
      : roleKeys.includes("vendor")
      ? "vendor"
      : "user";

    await client.query(
      `UPDATE users SET role = $1, updated_at = now() WHERE id = $2`,
      [legacyRole, id],
    );

    await client.query("COMMIT");
    return await getAdminUserById(id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const listRoles = async () => {
  const { rows } = await pool.query(
    `SELECT
       r.id,
       r.key,
       r.name,
       r.description,
       r.is_system,
       r.created_at,
       r.updated_at,
       COALESCE(
         array_agg(p.key ORDER BY p.key) FILTER (WHERE p.key IS NOT NULL),
         '{}'
       ) AS permissions,
       count(p.id)::int AS permission_count
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     GROUP BY r.id
     ORDER BY r.id ASC`,
  );
  return rows;
};

export const getRoleById = async (id) => {
  const { rows: roleRows } = await pool.query(
    `SELECT id, key, name, description, is_system, created_at, updated_at
     FROM roles WHERE id = $1 LIMIT 1`,
    [id],
  );
  if (!roleRows[0]) return null;

  const role = roleRows[0];

  const { rows: permRows } = await pool.query(
    `SELECT p.id, p.key, p.description
     FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role_id = $1
     ORDER BY p.key ASC`,
    [id],
  );

  return {
    ...role,
    permissions: permRows,
  };
};

export const listAllPermissions = async () => {
  const { rows } = await pool.query(
    `SELECT id, key, description, created_at
     FROM permissions
     ORDER BY key ASC`,
  );
  return rows;
};

export const updateRolePermissions = async (roleId, permissionKeys) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: roleRows } = await client.query(
      `SELECT id, key, name, is_system FROM roles WHERE id = $1 FOR UPDATE`,
      [roleId],
    );
    if (!roleRows[0]) throw new ApiError(404, "Role not found");
    const role = roleRows[0];

    // Safe lockout prevention for administrator role
    if (role.key === "admin") {
      const requiredAdminPerms = ["user.manage", "role.manage", "content.read"];
      const missing = requiredAdminPerms.filter((p) => !permissionKeys.includes(p));
      if (missing.length > 0) {
        throw new ApiError(
          400,
          `Cannot remove essential administrative permissions (${missing.join(", ")}) from the administrator role`,
        );
      }
    }

    // Verify all permission keys exist
    const { rows: validPerms } = await client.query(
      `SELECT id, key FROM permissions WHERE key = ANY($1)`,
      [permissionKeys],
    );
    if (validPerms.length !== permissionKeys.length) {
      const validKeySet = new Set(validPerms.map((p) => p.key));
      const invalidKeys = permissionKeys.filter((k) => !validKeySet.has(k));
      throw new ApiError(400, `Unknown permission(s): ${invalidKeys.join(", ")}`);
    }

    // Replace role_permissions
    await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);

    for (const perm of validPerms) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
        [roleId, perm.id],
      );
    }

    await client.query(`UPDATE roles SET updated_at = now() WHERE id = $1`, [roleId]);
    await client.query("COMMIT");

    return await getRoleById(roleId);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
