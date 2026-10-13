import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export const listAdminRegions = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  destination_id = "",
  includeDeleted = "false",
}) => {
  const conditions = [];
  const params = [];

  if (includeDeleted !== "true") {
    conditions.push("r.deleted_at IS NULL");
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(r.title ILIKE $${params.length} OR r.slug ILIKE $${params.length} OR d.name ILIKE $${params.length})`);
  }

  if (status && status !== "all") {
    params.push(status);
    conditions.push(`r.status = $${params.length}`);
  }

  if (destination_id) {
    params.push(destination_id);
    conditions.push(`r.destination_id = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countSql = `
    SELECT count(*)::int AS total
    FROM regions r
    JOIN destinations d ON d.id = r.destination_id
    ${whereClause}
  `;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  params.push(limit);
  const limitIndex = params.length;
  params.push((page - 1) * limit);
  const offsetIndex = params.length;

  const dataSql = `
    SELECT r.id, r.slug, r.title, r.subtitle, r.tagline,
           r.destination_id AS "destinationId", d.name AS "destinationName", d.country AS "destinationCountry",
           r.about_title AS "aboutTitle", r.about_paragraphs AS "aboutParagraphs",
           r.hero_media_id AS "heroMediaId", r.status, r.published_at AS "publishedAt",
           r.created_at AS "createdAt", r.updated_at AS "updatedAt", r.deleted_at AS "deletedAt",
           hm.public_url AS "heroMediaUrl",
           (SELECT count(*)::int FROM region_popular_places pp WHERE pp.region_id = r.id) AS "popularPlacesCount",
           (SELECT count(*)::int FROM region_experiences exp WHERE exp.region_id = r.id) AS "experiencesCount",
           (SELECT count(*)::int FROM trips t WHERE t.region_id = r.id AND t.deleted_at IS NULL) AS "tripsCount"
    FROM regions r
    JOIN destinations d ON d.id = r.destination_id
    LEFT JOIN media_assets hm ON hm.id = r.hero_media_id
    ${whereClause}
    ORDER BY r.created_at DESC, r.id DESC
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

export const getAdminRegionById = async (id) => {
  const sql = `
    SELECT r.id, r.slug, r.title, r.subtitle, r.tagline,
           r.destination_id AS "destinationId", d.name AS "destinationName", d.country AS "destinationCountry",
           r.about_title AS "aboutTitle", r.about_paragraphs AS "aboutParagraphs",
           r.hero_media_id AS "heroMediaId", r.status, r.published_at AS "publishedAt",
           r.created_at AS "createdAt", r.updated_at AS "updatedAt", r.deleted_at AS "deletedAt",
           hm.public_url AS "heroMediaUrl",
           (SELECT count(*)::int FROM trips t WHERE t.region_id = r.id AND t.deleted_at IS NULL) AS "tripsCount"
    FROM regions r
    JOIN destinations d ON d.id = r.destination_id
    LEFT JOIN media_assets hm ON hm.id = r.hero_media_id
    WHERE r.id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [id]);
  if (!rows[0]) return null;

  const region = rows[0];

  const placesSql = `
    SELECT pp.id, pp.source_id AS "sourceId", pp.name, pp.description,
           pp.media_id AS "mediaId", pp.href, pp.sort_order AS "sortOrder", pp.status,
           m.public_url AS "mediaUrl"
    FROM region_popular_places pp
    LEFT JOIN media_assets m ON m.id = pp.media_id
    WHERE pp.region_id = $1
    ORDER BY pp.sort_order ASC, pp.id ASC
  `;
  const experiencesSql = `
    SELECT exp.id, exp.source_id AS "sourceId", exp.title, exp.description,
           exp.media_id AS "mediaId", exp.badge, exp.sort_order AS "sortOrder", exp.status,
           m.public_url AS "mediaUrl"
    FROM region_experiences exp
    LEFT JOIN media_assets m ON m.id = exp.media_id
    WHERE exp.region_id = $1
    ORDER BY exp.sort_order ASC, exp.id ASC
  `;

  const [placesRes, expRes] = await Promise.all([
    pool.query(placesSql, [id]),
    pool.query(experiencesSql, [id]),
  ]);

  region.popularPlaces = placesRes.rows;
  region.experiences = expRes.rows;

  return region;
};

export const getRegionBySlug = async (slug) => {
  const sql = `SELECT id, slug, title, destination_id FROM regions WHERE slug = $1 LIMIT 1`;
  const { rows } = await pool.query(sql, [slug]);
  return rows[0] || null;
};

export const createRegion = async (data) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const dest = await client.query("SELECT id FROM destinations WHERE id = $1", [data.destination_id]);
    if (dest.rowCount === 0) {
      throw new ApiError(400, "Referenced destination does not exist");
    }

    const publishedAt = data.status === "published"
      ? (data.published_at || new Date().toISOString())
      : (data.published_at || null);

    const insertSql = `
      INSERT INTO regions (
        destination_id, slug, title, subtitle, tagline,
        hero_media_id, about_title, about_paragraphs, status, published_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, destination_id AS "destinationId", slug, title, subtitle, tagline,
                hero_media_id AS "heroMediaId", about_title AS "aboutTitle",
                about_paragraphs AS "aboutParagraphs", status, published_at AS "publishedAt",
                created_at AS "createdAt", updated_at AS "updatedAt"
    `;

    const { rows } = await client.query(insertSql, [
      data.destination_id,
      data.slug,
      data.title,
      data.subtitle || "",
      data.tagline || "",
      data.hero_media_id || null,
      data.about_title || "",
      data.about_paragraphs || [],
      data.status || "draft",
      publishedAt,
    ]);
    const createdRegion = rows[0];

    if (Array.isArray(data.popular_places) && data.popular_places.length > 0) {
      for (const [idx, place] of data.popular_places.entries()) {
        const sourceId = place.source_id || `place-${idx + 1}-${Date.now()}`;
        await client.query(`
          INSERT INTO region_popular_places (
            region_id, source_id, name, description, media_id, href, sort_order, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          createdRegion.id,
          sourceId,
          place.name,
          place.description || "",
          place.media_id || null,
          place.href || null,
          place.sort_order ?? idx,
          place.status || "draft",
        ]);
      }
    }

    if (Array.isArray(data.experiences) && data.experiences.length > 0) {
      for (const [idx, exp] of data.experiences.entries()) {
        const sourceId = exp.source_id || `exp-${idx + 1}-${Date.now()}`;
        await client.query(`
          INSERT INTO region_experiences (
            region_id, source_id, title, description, media_id, badge, sort_order, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          createdRegion.id,
          sourceId,
          exp.title,
          exp.description || "",
          exp.media_id || null,
          exp.badge || null,
          exp.sort_order ?? idx,
          exp.status || "draft",
        ]);
      }
    }

    await client.query("COMMIT");
    return getAdminRegionById(createdRegion.id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateRegion = async (id, fields) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (fields.destination_id) {
      const dest = await client.query("SELECT id FROM destinations WHERE id = $1", [fields.destination_id]);
      if (dest.rowCount === 0) {
        throw new ApiError(400, "Referenced destination does not exist");
      }
    }

    const sets = [];
    const values = [];

    const fieldMapping = {
      destination_id: "destination_id",
      slug: "slug",
      title: "title",
      subtitle: "subtitle",
      tagline: "tagline",
      hero_media_id: "hero_media_id",
      about_title: "about_title",
      about_paragraphs: "about_paragraphs",
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

    if (sets.length > 0) {
      sets.push("updated_at = now()");
      values.push(id);
      const sql = `UPDATE regions SET ${sets.join(", ")} WHERE id = $${values.length}`;
      await client.query(sql, values);
    }

    if (Array.isArray(fields.popular_places)) {
      await client.query("DELETE FROM region_popular_places WHERE region_id = $1", [id]);
      for (const [idx, place] of fields.popular_places.entries()) {
        const sourceId = place.source_id || `place-${idx + 1}-${Date.now()}`;
        await client.query(`
          INSERT INTO region_popular_places (
            region_id, source_id, name, description, media_id, href, sort_order, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          id,
          sourceId,
          place.name,
          place.description || "",
          place.media_id || null,
          place.href || null,
          place.sort_order ?? idx,
          place.status || "draft",
        ]);
      }
    }

    if (Array.isArray(fields.experiences)) {
      await client.query("DELETE FROM region_experiences WHERE region_id = $1", [id]);
      for (const [idx, exp] of fields.experiences.entries()) {
        const sourceId = exp.source_id || `exp-${idx + 1}-${Date.now()}`;
        await client.query(`
          INSERT INTO region_experiences (
            region_id, source_id, title, description, media_id, badge, sort_order, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          id,
          sourceId,
          exp.title,
          exp.description || "",
          exp.media_id || null,
          exp.badge || null,
          exp.sort_order ?? idx,
          exp.status || "draft",
        ]);
      }
    }

    await client.query("COMMIT");
    return getAdminRegionById(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const archiveRegion = async (id) => {
  const sql = `
    UPDATE regions
    SET status = 'archived', deleted_at = now(), updated_at = now()
    WHERE id = $1
    RETURNING id, slug, title, status, deleted_at AS "deletedAt"
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const restoreRegion = async (id) => {
  const sql = `
    UPDATE regions
    SET status = 'draft', deleted_at = NULL, updated_at = now()
    WHERE id = $1
    RETURNING id, slug, title, status, deleted_at AS "deletedAt"
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const deleteRegion = async (id) => {
  const trips = await pool.query("SELECT count(*)::int AS count FROM trips WHERE region_id = $1", [id]);
  if (trips.rows[0].count > 0) {
    throw new ApiError(409, "Cannot permanently delete region because trips are linked to it. Reassign or delete linked trips first.");
  }
  const { rowCount } = await pool.query("DELETE FROM regions WHERE id = $1", [id]);
  return rowCount > 0;
};
