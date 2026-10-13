import pool from "../config/db.js";

export const listAdminReviews = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  trip_id = "",
}) => {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(rv.name ILIKE $${params.length} OR rv.email ILIKE $${params.length} OR rv.message ILIKE $${params.length})`);
  }

  if (status && status !== "all") {
    params.push(status);
    conditions.push(`rv.status = $${params.length}`);
  }

  if (trip_id) {
    params.push(trip_id);
    conditions.push(`rv.trip_id = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countSql = `SELECT count(*)::int AS total FROM reviews rv ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  params.push(limit);
  const limitIndex = params.length;
  params.push((page - 1) * limit);
  const offsetIndex = params.length;

  const dataSql = `
    SELECT rv.id, rv.trip_id AS "tripId", rv.name, rv.email, rv.location,
           rv.title, rv.message, rv.rating, rv.photo_media_id AS "photoMediaId",
           rv.status, rv.created_at AS "createdAt", rv.updated_at AS "updatedAt",
           rv.deleted_at AS "deletedAt",
           t.title AS "tripTitle", t.slug AS "tripSlug",
           m.public_url AS "photoMediaUrl"
    FROM reviews rv
    LEFT JOIN trips t ON t.id = rv.trip_id
    LEFT JOIN media_assets m ON m.id = rv.photo_media_id
    ${whereClause}
    ORDER BY rv.created_at DESC, rv.id DESC
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

export const getAdminReviewById = async (id) => {
  const sql = `
    SELECT rv.id, rv.trip_id AS "tripId", rv.name, rv.email, rv.location,
           rv.title, rv.message, rv.rating, rv.photo_media_id AS "photoMediaId",
           rv.status, rv.created_at AS "createdAt", rv.updated_at AS "updatedAt",
           rv.deleted_at AS "deletedAt",
           t.title AS "tripTitle", t.slug AS "tripSlug",
           m.public_url AS "photoMediaUrl"
    FROM reviews rv
    LEFT JOIN trips t ON t.id = rv.trip_id
    LEFT JOIN media_assets m ON m.id = rv.photo_media_id
    WHERE rv.id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const createPublicReview = async (data) => {
  const sql = `
    INSERT INTO reviews (trip_id, name, email, location, title, message, rating, photo_media_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
    RETURNING id, trip_id AS "tripId", name, location, title, message, rating,
              status, created_at AS "createdAt"
  `;
  const values = [
    data.trip_id || null,
    data.name,
    data.email || null,
    data.location || "",
    data.title || null,
    data.message,
    data.rating,
    data.photo_media_id || null,
  ];
  const { rows } = await pool.query(sql, values);
  return rows[0];
};

export const moderateReview = async (id, fields) => {
  const sets = [];
  const values = [];

  const allowed = ["status", "title", "message", "rating"];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }

  if (sets.length === 0) return getAdminReviewById(id);

  sets.push("updated_at = now()");
  values.push(id);

  const sql = `
    UPDATE reviews
    SET ${sets.join(", ")}
    WHERE id = $${values.length}
    RETURNING id, trip_id AS "tripId", name, email, location, title, message,
              rating, photo_media_id AS "photoMediaId", status, updated_at AS "updatedAt"
  `;
  const { rows } = await pool.query(sql, values);
  return rows[0] || null;
};

export const deleteReview = async (id) => {
  const sql = `
    UPDATE reviews
    SET status = 'hidden', deleted_at = now(), updated_at = now()
    WHERE id = $1
    RETURNING id, status, deleted_at AS "deletedAt"
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const permanentDeleteReview = async (id) => {
  const { rowCount } = await pool.query("DELETE FROM reviews WHERE id = $1", [id]);
  return rowCount > 0;
};
