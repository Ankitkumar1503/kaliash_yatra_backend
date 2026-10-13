import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export const listAdminMedia = async ({
  page = 1,
  limit = 20,
  search = "",
  media_type = "",
}) => {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(m.storage_key ILIKE $${params.length} OR m.public_url ILIKE $${params.length} OR m.alt_text ILIKE $${params.length})`);
  }

  if (media_type) {
    params.push(`%${media_type}%`);
    conditions.push(`m.media_type ILIKE $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countSql = `SELECT count(*)::int AS total FROM media_assets m ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  params.push(limit);
  const limitIndex = params.length;
  params.push((page - 1) * limit);
  const offsetIndex = params.length;

  const dataSql = `
    SELECT m.id, m.storage_key AS "storageKey", m.public_url AS "publicUrl",
           m.media_type AS "mediaType", m.alt_text AS "altText",
           m.width, m.height, m.file_size AS "fileSize",
           m.created_by AS "createdBy", m.created_at AS "createdAt", m.updated_at AS "updatedAt",
           u.name AS "creatorName"
    FROM media_assets m
    LEFT JOIN users u ON u.id = m.created_by
    ${whereClause}
    ORDER BY m.created_at DESC, m.id DESC
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

export const getAdminMediaById = async (id) => {
  const sql = `
    SELECT m.id, m.storage_key AS "storageKey", m.public_url AS "publicUrl",
           m.media_type AS "mediaType", m.alt_text AS "altText",
           m.width, m.height, m.file_size AS "fileSize",
           m.created_by AS "createdBy", m.created_at AS "createdAt", m.updated_at AS "updatedAt",
           u.name AS "creatorName"
    FROM media_assets m
    LEFT JOIN users u ON u.id = m.created_by
    WHERE m.id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const createMedia = async (data, userId = null) => {
  const sql = `
    INSERT INTO media_assets (storage_key, public_url, media_type, alt_text, width, height, file_size, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, storage_key AS "storageKey", public_url AS "publicUrl",
              media_type AS "mediaType", alt_text AS "altText", width, height,
              file_size AS "fileSize", created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  const values = [
    data.storage_key,
    data.public_url,
    data.media_type,
    data.alt_text || null,
    data.width || null,
    data.height || null,
    data.file_size || null,
    userId,
  ];
  const { rows } = await pool.query(sql, values);
  return rows[0];
};

export const updateMedia = async (id, fields) => {
  const sets = [];
  const values = [];

  const allowed = ["public_url", "alt_text", "width", "height", "file_size"];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }

  if (sets.length === 0) return getAdminMediaById(id);

  sets.push("updated_at = now()");
  values.push(id);

  const sql = `
    UPDATE media_assets
    SET ${sets.join(", ")}
    WHERE id = $${values.length}
    RETURNING id, storage_key AS "storageKey", public_url AS "publicUrl",
              media_type AS "mediaType", alt_text AS "altText", width, height,
              file_size AS "fileSize", created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  const { rows } = await pool.query(sql, values);
  return rows[0] || null;
};

export const deleteMedia = async (id) => {
  // Check foreign key dependencies
  const references = await Promise.all([
    pool.query("SELECT count(*)::int AS count FROM destinations WHERE hero_media_id = $1 OR featured_media_id = $1", [id]),
    pool.query("SELECT count(*)::int AS count FROM regions WHERE hero_media_id = $1", [id]),
    pool.query("SELECT count(*)::int AS count FROM activities WHERE hero_media_id = $1", [id]),
    pool.query("SELECT count(*)::int AS count FROM trip_categories WHERE media_id = $1", [id]),
    pool.query("SELECT count(*)::int AS count FROM trips WHERE hero_media_id = $1", [id]),
    pool.query("SELECT count(*)::int AS count FROM trip_images WHERE media_id = $1", [id]),
    pool.query("SELECT count(*)::int AS count FROM gallery_items WHERE media_id = $1", [id]),
    pool.query("SELECT count(*)::int AS count FROM blogs WHERE hero_media_id = $1 OR author_media_id = $1", [id]),
  ]);

  const totalRefs = references.reduce((acc, res) => acc + res.rows[0].count, 0);
  if (totalRefs > 0) {
    throw new ApiError(409, `Cannot delete media asset because it is currently in use across ${totalRefs} records.`);
  }

  const { rowCount } = await pool.query("DELETE FROM media_assets WHERE id = $1", [id]);
  return rowCount > 0;
};
