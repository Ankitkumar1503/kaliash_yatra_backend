import pool from "../config/db.js";

export const listAdminFaqs = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  trip_id = "",
  page_key = "",
}) => {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(f.question ILIKE $${params.length} OR f.answer ILIKE $${params.length})`);
  }

  if (status && status !== "all") {
    params.push(status);
    conditions.push(`f.status = $${params.length}`);
  }

  if (trip_id) {
    params.push(trip_id);
    conditions.push(`f.trip_id = $${params.length}`);
  }

  if (page_key) {
    params.push(page_key);
    conditions.push(`f.page_key = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countSql = `SELECT count(*)::int AS total FROM faqs f ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  params.push(limit);
  const limitIndex = params.length;
  params.push((page - 1) * limit);
  const offsetIndex = params.length;

  const dataSql = `
    SELECT f.id, f.trip_id AS "tripId", f.page_key AS "pageKey",
           f.question, f.answer, f.sort_order AS "sortOrder", f.status,
           f.created_at AS "createdAt", f.updated_at AS "updatedAt",
           t.title AS "tripTitle", t.slug AS "tripSlug"
    FROM faqs f
    LEFT JOIN trips t ON t.id = f.trip_id
    ${whereClause}
    ORDER BY f.sort_order ASC, f.id ASC
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

export const getAdminFaqById = async (id) => {
  const sql = `
    SELECT f.id, f.trip_id AS "tripId", f.page_key AS "pageKey",
           f.question, f.answer, f.sort_order AS "sortOrder", f.status,
           f.created_at AS "createdAt", f.updated_at AS "updatedAt",
           t.title AS "tripTitle", t.slug AS "tripSlug"
    FROM faqs f
    LEFT JOIN trips t ON t.id = f.trip_id
    WHERE f.id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const createFaq = async (data) => {
  const sql = `
    INSERT INTO faqs (trip_id, page_key, question, answer, sort_order, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, trip_id AS "tripId", page_key AS "pageKey", question, answer,
              sort_order AS "sortOrder", status, created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  const values = [
    data.trip_id || null,
    data.page_key || null,
    data.question,
    data.answer,
    data.sort_order ?? 0,
    data.status || "published",
  ];
  const { rows } = await pool.query(sql, values);
  return rows[0];
};

export const updateFaq = async (id, fields) => {
  const current = await getAdminFaqById(id);
  if (!current) return null;

  const sets = [];
  const values = [];

  const allowed = ["trip_id", "page_key", "question", "answer", "sort_order", "status"];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }

  if (sets.length === 0) return current;

  sets.push("updated_at = now()");
  values.push(id);

  const sql = `
    UPDATE faqs
    SET ${sets.join(", ")}
    WHERE id = $${values.length}
    RETURNING id, trip_id AS "tripId", page_key AS "pageKey", question, answer,
              sort_order AS "sortOrder", status, created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  const { rows } = await pool.query(sql, values);
  return rows[0] || null;
};

export const deleteFaq = async (id) => {
  const { rowCount } = await pool.query("DELETE FROM faqs WHERE id = $1", [id]);
  return rowCount > 0;
};
