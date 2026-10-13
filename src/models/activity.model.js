import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export const listAdminActivities = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  includeDeleted = "false",
}) => {
  const conditions = [];
  const params = [];

  if (includeDeleted !== "true") {
    conditions.push("a.deleted_at IS NULL");
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(a.title ILIKE $${params.length} OR a.slug ILIKE $${params.length})`);
  }

  if (status && status !== "all") {
    params.push(status);
    conditions.push(`a.status = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countSql = `SELECT count(*)::int AS total FROM activities a ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  params.push(limit);
  const limitIndex = params.length;
  params.push((page - 1) * limit);
  const offsetIndex = params.length;

  const dataSql = `
    SELECT a.id, a.slug, a.title,
           a.short_description AS "shortDescription", a.description,
           a.hero_media_id AS "heroMediaId", a.icon_name AS "iconName",
           a.badge, a.status, a.published_at AS "publishedAt",
           a.created_at AS "createdAt", a.updated_at AS "updatedAt", a.deleted_at AS "deletedAt",
           hm.public_url AS "heroMediaUrl",
           (SELECT count(*)::int FROM trips t WHERE t.activity_id = a.id AND t.deleted_at IS NULL) AS "tripsCount"
    FROM activities a
    LEFT JOIN media_assets hm ON hm.id = a.hero_media_id
    ${whereClause}
    ORDER BY a.created_at DESC, a.id DESC
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

export const getAdminActivityById = async (id) => {
  const sql = `
    SELECT a.id, a.slug, a.title,
           a.short_description AS "shortDescription", a.description,
           a.hero_media_id AS "heroMediaId", a.icon_name AS "iconName",
           a.badge, a.status, a.published_at AS "publishedAt",
           a.created_at AS "createdAt", a.updated_at AS "updatedAt", a.deleted_at AS "deletedAt",
           hm.public_url AS "heroMediaUrl",
           (SELECT count(*)::int FROM trips t WHERE t.activity_id = a.id AND t.deleted_at IS NULL) AS "tripsCount"
    FROM activities a
    LEFT JOIN media_assets hm ON hm.id = a.hero_media_id
    WHERE a.id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const getActivityBySlug = async (slug) => {
  const sql = `SELECT id, slug, title FROM activities WHERE slug = $1 LIMIT 1`;
  const { rows } = await pool.query(sql, [slug]);
  return rows[0] || null;
};

export const createActivity = async (data) => {
  const publishedAt = data.status === "published" ? (data.published_at || new Date().toISOString()) : (data.published_at || null);
  const sql = `
    INSERT INTO activities (slug, title, short_description, description, hero_media_id, icon_name, badge, status, published_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, slug, title, short_description AS "shortDescription", description,
              hero_media_id AS "heroMediaId", icon_name AS "iconName", badge, status,
              published_at AS "publishedAt", created_at AS "createdAt", updated_at AS "updatedAt", deleted_at AS "deletedAt"
  `;
  const values = [
    data.slug,
    data.title,
    data.short_description || "",
    data.description || "",
    data.hero_media_id || null,
    data.icon_name || "",
    data.badge || null,
    data.status || "draft",
    publishedAt,
  ];
  const { rows } = await pool.query(sql, values);
  return rows[0];
};

export const updateActivity = async (id, fields) => {
  const sets = [];
  const values = [];

  const fieldMapping = {
    slug: "slug",
    title: "title",
    short_description: "short_description",
    description: "description",
    hero_media_id: "hero_media_id",
    icon_name: "icon_name",
    badge: "badge",
    status: "status",
    published_at: "published_at",
  };

  for (const [key, col] of Object.entries(fieldMapping)) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      sets.push(`${col} = $${values.length}`);
    }
  }

  if (fields.status === "published" && fields.published_at === undefined) {
    sets.push(`published_at = COALESCE(published_at, now())`);
  }

  if (sets.length === 0) return getAdminActivityById(id);

  sets.push("updated_at = now()");
  values.push(id);

  const sql = `
    UPDATE activities
    SET ${sets.join(", ")}
    WHERE id = $${values.length}
    RETURNING id, slug, title, short_description AS "shortDescription", description,
              hero_media_id AS "heroMediaId", icon_name AS "iconName", badge, status,
              published_at AS "publishedAt", created_at AS "createdAt", updated_at AS "updatedAt", deleted_at AS "deletedAt"
  `;
  const { rows } = await pool.query(sql, values);
  return rows[0] || null;
};

export const archiveActivity = async (id) => {
  const sql = `
    UPDATE activities
    SET status = 'archived', deleted_at = now(), updated_at = now()
    WHERE id = $1
    RETURNING id, slug, title, status, deleted_at AS "deletedAt"
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const restoreActivity = async (id) => {
  const sql = `
    UPDATE activities
    SET status = 'draft', deleted_at = NULL, updated_at = now()
    WHERE id = $1
    RETURNING id, slug, title, status, deleted_at AS "deletedAt"
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const deleteActivity = async (id) => {
  const trips = await pool.query("SELECT count(*)::int AS count FROM trips WHERE activity_id = $1", [id]);
  if (trips.rows[0].count > 0) {
    throw new ApiError(409, "Cannot permanently delete activity because trips are linked to it. Reassign or delete linked trips first.");
  }
  const { rowCount } = await pool.query("DELETE FROM activities WHERE id = $1", [id]);
  return rowCount > 0;
};
