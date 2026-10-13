import pool from "../config/db.js";

export const createUser = async({ name, email, passwordHash, role = "user" }) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const { rows } = await client.query(
            `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, is_active, created_at, updated_at`, [name, email, passwordHash, role],
        );
        const assignment = await client.query(
            `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE key = $2`, [rows[0].id, role],
        );
        if (assignment.rowCount !== 1) throw new Error(`Role is not configured: ${role}`);
        await client.query("COMMIT");
        return rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// This explicit projection contains the password hash only for password verification.
export const findUserByEmail = async(email) => {
    const { rows } = await pool.query(
        `SELECT id, name, email, password_hash, role, is_active
     FROM users WHERE email = $1 LIMIT 1`, [email],
    );
    return rows[0] || null;
};

export const findAccessByUserId = async(id) => {
    const { rows } = await pool.query(
        `SELECT id, name, email, role::text AS legacy_role, is_active
     FROM users WHERE id = $1 LIMIT 1`, [id],
    );
    return rows[0] || null;
};

export const findPermissionsByUserId = async(id) => {
    const { rows } = await pool.query(
        `SELECT DISTINCT p.key
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     JOIN role_permissions rp ON rp.role_id = r.id
     JOIN permissions p ON p.id = rp.permission_id
     JOIN users u ON u.id = ur.user_id
     WHERE ur.user_id = $1 AND u.is_active = TRUE`, [id],
    );
    return new Set(rows.map((row) => row.key));
};

export const getUserProfileWithPermissions = async(id) => {
    const user = await findAccessByUserId(id);
    if (!user) return null;
    const { rows } = await pool.query(
        `SELECT r.key
     FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = $1 ORDER BY r.key`, [id],
    );
    const permissions = await findPermissionsByUserId(id);
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.legacy_role,
        roles: rows.map((row) => row.key),
        permissions: [...permissions].sort(),
    };
};