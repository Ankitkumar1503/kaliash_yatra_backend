import pool from "../config/db.js";

export const listAdminSubscribers = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
}) => {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`ns.email ILIKE $${params.length}`);
  }

  if (status && status !== "all") {
    params.push(status);
    conditions.push(`ns.status = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countSql = `SELECT count(*)::int AS total FROM newsletter_subscribers ns ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  params.push(limit);
  const limitIndex = params.length;
  params.push((page - 1) * limit);
  const offsetIndex = params.length;

  const dataSql = `
    SELECT ns.id, ns.email, ns.status, ns.subscribed_at AS "subscribedAt",
           ns.unsubscribed_at AS "unsubscribedAt", ns.created_at AS "createdAt",
           ns.updated_at AS "updatedAt"
    FROM newsletter_subscribers ns
    ${whereClause}
    ORDER BY ns.subscribed_at DESC, ns.id DESC
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

export const getSubscriberById = async (id) => {
  const sql = `
    SELECT ns.id, ns.email, ns.status, ns.subscribed_at AS "subscribedAt",
           ns.unsubscribed_at AS "unsubscribedAt", ns.created_at AS "createdAt",
           ns.updated_at AS "updatedAt"
    FROM newsletter_subscribers ns
    WHERE ns.id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const subscribe = async (email) => {
  const sql = `
    INSERT INTO newsletter_subscribers (email, status, subscribed_at)
    VALUES ($1, 'active', now())
    ON CONFLICT (lower(email)) DO UPDATE
    SET status = 'active', unsubscribed_at = NULL, updated_at = now()
    RETURNING id, email, status, subscribed_at AS "subscribedAt",
              (xmax = 0) AS "isNewSubscription"
  `;
  const { rows } = await pool.query(sql, [email]);
  return rows[0];
};

export const updateSubscriberStatus = async (id, status) => {
  let sql;
  if (status === "unsubscribed") {
    sql = `
      UPDATE newsletter_subscribers
      SET status = 'unsubscribed', unsubscribed_at = now(), updated_at = now()
      WHERE id = $1
      RETURNING id, email, status, subscribed_at AS "subscribedAt", unsubscribed_at AS "unsubscribedAt"
    `;
  } else {
    sql = `
      UPDATE newsletter_subscribers
      SET status = 'active', unsubscribed_at = NULL, updated_at = now()
      WHERE id = $1
      RETURNING id, email, status, subscribed_at AS "subscribedAt", unsubscribed_at AS "unsubscribedAt"
    `;
  }
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const deleteSubscriber = async (id) => {
  const { rowCount } = await pool.query("DELETE FROM newsletter_subscribers WHERE id = $1", [id]);
  return rowCount > 0;
};
