import pool from "../config/db.js";

export const listAdminGallery = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  trip_id = "",
  blog_id = "",
}) => {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(g.title ILIKE $${params.length} OR g.location ILIKE $${params.length} OR g.alt_text ILIKE $${params.length})`);
  }

  if (status && status !== "all") {
    params.push(status);
    conditions.push(`g.status = $${params.length}`);
  }

  if (trip_id) {
    params.push(trip_id);
    conditions.push(`g.trip_id = $${params.length}`);
  }

  if (blog_id) {
    params.push(blog_id);
    conditions.push(`g.blog_id = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countSql = `SELECT count(*)::int AS total FROM gallery_items g ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  params.push(limit);
  const limitIndex = params.length;
  params.push((page - 1) * limit);
  const offsetIndex = params.length;

  const dataSql = `
    SELECT g.id, g.media_id AS "mediaId", g.title, g.location,
           g.alt_text AS "altText", g.sort_order AS "sortOrder",
           g.trip_id AS "tripId", g.blog_id AS "blogId",
           g.status, g.created_at AS "createdAt", g.updated_at AS "updatedAt",
           m.public_url AS "mediaUrl",
           t.title AS "tripTitle", t.slug AS "tripSlug",
           b.title AS "blogTitle", b.slug AS "blogSlug"
    FROM gallery_items g
    JOIN media_assets m ON m.id = g.media_id
    LEFT JOIN trips t ON t.id = g.trip_id
    LEFT JOIN blogs b ON b.id = g.blog_id
    ${whereClause}
    ORDER BY g.sort_order ASC, g.id DESC
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

export const getAdminGalleryById = async (id) => {
  const sql = `
    SELECT g.id, g.media_id AS "mediaId", g.title, g.location,
           g.alt_text AS "altText", g.sort_order AS "sortOrder",
           g.trip_id AS "tripId", g.blog_id AS "blogId",
           g.status, g.created_at AS "createdAt", g.updated_at AS "updatedAt",
           m.public_url AS "mediaUrl",
           t.title AS "tripTitle", t.slug AS "tripSlug",
           b.title AS "blogTitle", b.slug AS "blogSlug"
    FROM gallery_items g
    JOIN media_assets m ON m.id = g.media_id
    LEFT JOIN trips t ON t.id = g.trip_id
    LEFT JOIN blogs b ON b.id = g.blog_id
    WHERE g.id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const createGalleryItem = async (data) => {
  const sql = `
    INSERT INTO gallery_items (media_id, title, location, alt_text, sort_order, trip_id, blog_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, media_id AS "mediaId", title, location, alt_text AS "altText",
              sort_order AS "sortOrder", trip_id AS "tripId", blog_id AS "blogId",
              status, created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  const values = [
    data.media_id,
    data.title,
    data.location || null,
    data.alt_text || "",
    data.sort_order ?? 0,
    data.trip_id || null,
    data.blog_id || null,
    data.status || "draft",
  ];
  const { rows } = await pool.query(sql, values);
  return rows[0];
};

export const updateGalleryItem = async (id, fields) => {
  const sets = [];
  const values = [];

  const allowed = ["media_id", "title", "location", "alt_text", "sort_order", "trip_id", "blog_id", "status"];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }

  if (sets.length === 0) return getAdminGalleryById(id);

  sets.push("updated_at = now()");
  values.push(id);

  const sql = `
    UPDATE gallery_items
    SET ${sets.join(", ")}
    WHERE id = $${values.length}
    RETURNING id, media_id AS "mediaId", title, location, alt_text AS "altText",
              sort_order AS "sortOrder", trip_id AS "tripId", blog_id AS "blogId",
              status, created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  const { rows } = await pool.query(sql, values);
  return rows[0] || null;
};

export const archiveGalleryItem = async (id) => {
  const sql = `
    UPDATE gallery_items
    SET status = 'archived', updated_at = now()
    WHERE id = $1
    RETURNING id, status
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const restoreGalleryItem = async (id) => {
  const sql = `
    UPDATE gallery_items
    SET status = 'published', updated_at = now()
    WHERE id = $1
    RETURNING id, status
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const deleteGalleryItem = async (id) => {
  const { rowCount } = await pool.query("DELETE FROM gallery_items WHERE id = $1", [id]);
  return rowCount > 0;
};
