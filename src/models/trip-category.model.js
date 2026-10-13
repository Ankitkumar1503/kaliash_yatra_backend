import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export const listCategories = async ({ page = 1, limit = 20, search = "", status = "" }) => {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(tc.name ILIKE $${params.length} OR tc.slug ILIKE $${params.length})`);
  }

  if (status && status !== "all") {
    params.push(status);
    conditions.push(`tc.status = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countSql = `SELECT count(*)::int AS total FROM trip_categories tc ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  params.push(limit);
  const limitIndex = params.length;
  params.push((page - 1) * limit);
  const offsetIndex = params.length;

  const dataSql = `
    SELECT tc.id, tc.slug, tc.name, tc.description, tc.media_id AS "mediaId", tc.status,
           tc.created_at AS "createdAt", tc.updated_at AS "updatedAt",
           m.public_url AS "mediaUrl",
           (SELECT count(*)::int FROM trips t WHERE t.category_id = tc.id) AS "tripsCount"
    FROM trip_categories tc
    LEFT JOIN media_assets m ON m.id = tc.media_id
    ${whereClause}
    ORDER BY tc.name ASC, tc.id ASC
    LIMIT $${limitIndex} OFFSET $${offsetIndex}
  `;

  const { rows } = await pool.query(dataSql, params);
  return {
    items: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const listPublicActiveCategories = async () => {
  const sql = `
    SELECT tc.id, tc.slug, tc.name, tc.description, tc.media_id AS "mediaId",
           m.public_url AS "mediaUrl",
           (SELECT count(*)::int FROM trips t WHERE t.category_id = tc.id AND t.status = 'published' AND t.deleted_at IS NULL) AS "tripsCount"
    FROM trip_categories tc
    LEFT JOIN media_assets m ON m.id = tc.media_id
    WHERE tc.status = 'active'
    ORDER BY tc.name ASC, tc.id ASC
  `;
  const { rows } = await pool.query(sql);
  return rows;
};

export const getCategoryById = async (id) => {
  const sql = `
    SELECT tc.id, tc.slug, tc.name, tc.description, tc.media_id AS "mediaId", tc.status,
           tc.created_at AS "createdAt", tc.updated_at AS "updatedAt",
           m.public_url AS "mediaUrl",
           (SELECT count(*)::int FROM trips t WHERE t.category_id = tc.id) AS "tripsCount"
    FROM trip_categories tc
    LEFT JOIN media_assets m ON m.id = tc.media_id
    WHERE tc.id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const getCategoryBySlug = async (slug) => {
  const sql = `SELECT id, slug, name FROM trip_categories WHERE slug = $1 LIMIT 1`;
  const { rows } = await pool.query(sql, [slug]);
  return rows[0] || null;
};

export const createCategory = async ({ name, slug, description = "", media_id = null, status = "active" }) => {
  const sql = `
    INSERT INTO trip_categories (slug, name, description, media_id, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, slug, name, description, media_id AS "mediaId", status, created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  const { rows } = await pool.query(sql, [slug, name, description, media_id, status]);
  return rows[0];
};

export const updateCategory = async (id, fields) => {
  const sets = [];
  const values = [];

  const allowed = ["slug", "name", "description", "media_id", "status"];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }

  if (sets.length === 0) return getCategoryById(id);

  sets.push("updated_at = now()");
  values.push(id);
  const sql = `
    UPDATE trip_categories
    SET ${sets.join(", ")}
    WHERE id = $${values.length}
    RETURNING id, slug, name, description, media_id AS "mediaId", status, created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  const { rows } = await pool.query(sql, values);
  return rows[0] || null;
};

export const deleteCategory = async (id) => {
  const check = await pool.query("SELECT count(*)::int AS count FROM trips WHERE category_id = $1", [id]);
  if (check.rows[0].count > 0) {
    throw new ApiError(409, "Cannot delete trip category because it is linked to existing trips. Remove or reassign trips first.");
  }
  const { rowCount } = await pool.query("DELETE FROM trip_categories WHERE id = $1", [id]);
  return rowCount > 0;
};
