import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export const listAdminDestinations = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  country = "",
  includeDeleted = "false",
}) => {
  const conditions = [];
  const params = [];

  if (includeDeleted !== "true") {
    conditions.push("d.deleted_at IS NULL");
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(d.name ILIKE $${params.length} OR d.slug ILIKE $${params.length} OR d.country ILIKE $${params.length})`);
  }

  if (status && status !== "all") {
    params.push(status);
    conditions.push(`d.status = $${params.length}`);
  }

  if (country) {
    params.push(country);
    conditions.push(`d.country = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countSql = `SELECT count(*)::int AS total FROM destinations d ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  params.push(limit);
  const limitIndex = params.length;
  params.push((page - 1) * limit);
  const offsetIndex = params.length;

  const dataSql = `
    SELECT d.id, d.slug, d.name, d.country, d.tagline,
           d.short_description AS "shortDescription", d.description,
           d.hero_media_id AS "heroMediaId", d.featured_media_id AS "featuredMediaId",
           d.badge, d.status, d.published_at AS "publishedAt",
           d.created_at AS "createdAt", d.updated_at AS "updatedAt", d.deleted_at AS "deletedAt",
           hm.public_url AS "heroMediaUrl", fm.public_url AS "featuredMediaUrl",
           (SELECT count(*)::int FROM regions r WHERE r.destination_id = d.id AND r.deleted_at IS NULL) AS "regionsCount",
           (SELECT count(*)::int FROM trips t WHERE t.destination_id = d.id AND t.deleted_at IS NULL) AS "tripsCount"
    FROM destinations d
    LEFT JOIN media_assets hm ON hm.id = d.hero_media_id
    LEFT JOIN media_assets fm ON fm.id = d.featured_media_id
    ${whereClause}
    ORDER BY d.created_at DESC, d.id DESC
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

export const getAdminDestinationById = async (id) => {
  const sql = `
    SELECT d.id, d.slug, d.name, d.country, d.tagline,
           d.short_description AS "shortDescription", d.description,
           d.hero_media_id AS "heroMediaId", d.featured_media_id AS "featuredMediaId",
           d.badge, d.status, d.published_at AS "publishedAt",
           d.created_at AS "createdAt", d.updated_at AS "updatedAt", d.deleted_at AS "deletedAt",
           hm.public_url AS "heroMediaUrl", fm.public_url AS "featuredMediaUrl",
           (SELECT count(*)::int FROM regions r WHERE r.destination_id = d.id AND r.deleted_at IS NULL) AS "regionsCount",
           (SELECT count(*)::int FROM trips t WHERE t.destination_id = d.id AND t.deleted_at IS NULL) AS "tripsCount"
    FROM destinations d
    LEFT JOIN media_assets hm ON hm.id = d.hero_media_id
    LEFT JOIN media_assets fm ON fm.id = d.featured_media_id
    WHERE d.id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const getDestinationBySlug = async (slug) => {
  const sql = `SELECT id, slug, name FROM destinations WHERE slug = $1 LIMIT 1`;
  const { rows } = await pool.query(sql, [slug]);
  return rows[0] || null;
};

export const createDestination = async (data) => {
  const publishedAt = data.status === "published" ? (data.published_at || new Date().toISOString()) : (data.published_at || null);
  const sql = `
    INSERT INTO destinations (slug, name, country, tagline, short_description, description, hero_media_id, featured_media_id, badge, status, published_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id, slug, name, country, tagline,
              short_description AS "shortDescription", description,
              hero_media_id AS "heroMediaId", featured_media_id AS "featuredMediaId",
              badge, status, published_at AS "publishedAt",
              created_at AS "createdAt", updated_at AS "updatedAt", deleted_at AS "deletedAt"
  `;
  const values = [
    data.slug,
    data.name,
    data.country,
    data.tagline || "",
    data.short_description || "",
    data.description || "",
    data.hero_media_id || null,
    data.featured_media_id || null,
    data.badge || null,
    data.status || "draft",
    publishedAt,
  ];
  const { rows } = await pool.query(sql, values);
  return rows[0];
};

export const updateDestination = async (id, fields) => {
  const sets = [];
  const values = [];

  const fieldMapping = {
    slug: "slug",
    name: "name",
    country: "country",
    tagline: "tagline",
    short_description: "short_description",
    description: "description",
    hero_media_id: "hero_media_id",
    featured_media_id: "featured_media_id",
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

  if (sets.length === 0) return getAdminDestinationById(id);

  sets.push("updated_at = now()");
  values.push(id);

  const sql = `
    UPDATE destinations
    SET ${sets.join(", ")}
    WHERE id = $${values.length}
    RETURNING id, slug, name, country, tagline,
              short_description AS "shortDescription", description,
              hero_media_id AS "heroMediaId", featured_media_id AS "featuredMediaId",
              badge, status, published_at AS "publishedAt",
              created_at AS "createdAt", updated_at AS "updatedAt", deleted_at AS "deletedAt"
  `;
  const { rows } = await pool.query(sql, values);
  return rows[0] || null;
};

export const archiveDestination = async (id) => {
  const sql = `
    UPDATE destinations
    SET status = 'archived', deleted_at = now(), updated_at = now()
    WHERE id = $1
    RETURNING id, slug, name, status, deleted_at AS "deletedAt"
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const restoreDestination = async (id) => {
  const sql = `
    UPDATE destinations
    SET status = 'draft', deleted_at = NULL, updated_at = now()
    WHERE id = $1
    RETURNING id, slug, name, status, deleted_at AS "deletedAt"
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const deleteDestination = async (id) => {
  const trips = await pool.query("SELECT count(*)::int AS count FROM trips WHERE destination_id = $1", [id]);
  if (trips.rows[0].count > 0) {
    throw new ApiError(409, "Cannot permanently delete destination because trips are linked to it. Reassign or delete linked trips first.");
  }
  const regions = await pool.query("SELECT count(*)::int AS count FROM regions WHERE destination_id = $1", [id]);
  if (regions.rows[0].count > 0) {
    throw new ApiError(409, "Cannot permanently delete destination because regions are linked to it. Reassign or delete linked regions first.");
  }
  const { rowCount } = await pool.query("DELETE FROM destinations WHERE id = $1", [id]);
  return rowCount > 0;
};
