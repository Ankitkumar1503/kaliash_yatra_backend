import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export const listBlogCategories = async ({ page = 1, limit = 20, search = "", status = "" }) => {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(bc.name ILIKE $${params.length} OR bc.slug ILIKE $${params.length})`);
  }

  if (status && status !== "all") {
    params.push(status);
    conditions.push(`bc.status = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countSql = `SELECT count(*)::int AS total FROM blog_categories bc ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  params.push(limit);
  const limitIndex = params.length;
  params.push((page - 1) * limit);
  const offsetIndex = params.length;

  const dataSql = `
    SELECT bc.id, bc.slug, bc.name, bc.status,
           bc.created_at AS "createdAt", bc.updated_at AS "updatedAt",
           (SELECT count(*)::int FROM blogs b WHERE b.category_id = bc.id AND b.deleted_at IS NULL) AS "blogsCount"
    FROM blog_categories bc
    ${whereClause}
    ORDER BY bc.name ASC, bc.id ASC
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

export const getBlogCategoryById = async (id) => {
  const sql = `
    SELECT bc.id, bc.slug, bc.name, bc.status,
           bc.created_at AS "createdAt", bc.updated_at AS "updatedAt",
           (SELECT count(*)::int FROM blogs b WHERE b.category_id = bc.id AND b.deleted_at IS NULL) AS "blogsCount"
    FROM blog_categories bc
    WHERE bc.id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const getBlogCategoryBySlug = async (slug) => {
  const sql = `SELECT id, slug, name FROM blog_categories WHERE slug = $1 LIMIT 1`;
  const { rows } = await pool.query(sql, [slug]);
  return rows[0] || null;
};

export const createBlogCategory = async ({ name, slug, status = "active" }) => {
  const sql = `
    INSERT INTO blog_categories (slug, name, status)
    VALUES ($1, $2, $3)
    RETURNING id, slug, name, status, created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  const { rows } = await pool.query(sql, [slug, name, status]);
  return rows[0];
};

export const updateBlogCategory = async (id, fields) => {
  const sets = [];
  const values = [];

  const allowed = ["slug", "name", "status"];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }

  if (sets.length === 0) return getBlogCategoryById(id);

  sets.push("updated_at = now()");
  values.push(id);

  const sql = `
    UPDATE blog_categories
    SET ${sets.join(", ")}
    WHERE id = $${values.length}
    RETURNING id, slug, name, status, created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  const { rows } = await pool.query(sql, values);
  return rows[0] || null;
};

export const deleteBlogCategory = async (id) => {
  const blogs = await pool.query("SELECT count(*)::int AS count FROM blogs WHERE category_id = $1", [id]);
  if (blogs.rows[0].count > 0) {
    throw new ApiError(409, "Cannot delete blog category because blogs are linked to it. Reassign or delete linked blogs first.");
  }
  const { rowCount } = await pool.query("DELETE FROM blog_categories WHERE id = $1", [id]);
  return rowCount > 0;
};
