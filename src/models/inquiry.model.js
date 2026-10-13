import pool from "../config/db.js";

export const listAdminInquiries = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  type = "",
}) => {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(i.name ILIKE $${params.length} OR i.email ILIKE $${params.length} OR i.phone ILIKE $${params.length})`);
  }

  if (status && status !== "all") {
    params.push(status);
    conditions.push(`i.status = $${params.length}`);
  }

  if (type) {
    const normalizedType = type.toLowerCase().replace(/\s+/g, "_");
    params.push(normalizedType);
    conditions.push(`i.type = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countSql = `SELECT count(*)::int AS total FROM inquiries i ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  params.push(limit);
  const limitIndex = params.length;
  params.push((page - 1) * limit);
  const offsetIndex = params.length;

  const dataSql = `
    SELECT i.id, i.trip_id AS "tripId", i.type, i.name, i.email, i.phone,
           i.travel_date AS "travelDate", i.travelers, i.message, i.custom_details AS "customDetails", i.status,
           i.created_at AS "createdAt", i.updated_at AS "updatedAt",
           t.title AS "tripTitle", t.slug AS "tripSlug"
    FROM inquiries i
    LEFT JOIN trips t ON t.id = i.trip_id
    ${whereClause}
    ORDER BY i.created_at DESC, i.id DESC
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

export const getAdminInquiryById = async (id) => {
  const sql = `
    SELECT i.id, i.trip_id AS "tripId", i.type, i.name, i.email, i.phone,
           i.travel_date AS "travelDate", i.travelers, i.message, i.custom_details AS "customDetails", i.status,
           i.created_at AS "createdAt", i.updated_at AS "updatedAt",
           t.title AS "tripTitle", t.slug AS "tripSlug"
    FROM inquiries i
    LEFT JOIN trips t ON t.id = i.trip_id
    WHERE i.id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const createPublicInquiry = async (data) => {
  const sql = `
    INSERT INTO inquiries (trip_id, type, name, email, phone, travel_date, travelers, message, custom_details, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new')
    RETURNING id, trip_id AS "tripId", type, name, email, phone,
              travel_date AS "travelDate", travelers, message, custom_details AS "customDetails", status,
              created_at AS "createdAt"
  `;
  const values = [
    data.trip_id || null,
    (data.type || "contact").toLowerCase().replace(/\s+/g, "_"),
    data.name,
    data.email,
    data.phone || null,
    data.travel_date || null,
    data.travelers || null,
    data.message || null,
    data.custom_details ? JSON.stringify(data.custom_details) : null,
  ];
  const { rows } = await pool.query(sql, values);
  return rows[0];
};

export const updateInquiryStatus = async (id, status) => {
  const sql = `
    UPDATE inquiries
    SET status = $1, updated_at = now()
    WHERE id = $2
    RETURNING id, trip_id AS "tripId", type, name, email, phone, status, updated_at AS "updatedAt"
  `;
  const { rows } = await pool.query(sql, [status, id]);
  return rows[0] || null;
};

export const deleteInquiry = async (id) => {
  const { rowCount } = await pool.query("DELETE FROM inquiries WHERE id = $1", [id]);
  return rowCount > 0;
};
