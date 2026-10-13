import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export const listAdminTrips = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  destination_id = "",
  region_id = "",
  activity_id = "",
  category_id = "",
  difficulty = "",
  featured = "",
  includeDeleted = "false",
}) => {
  const conditions = [];
  const params = [];

  if (includeDeleted !== "true") {
    conditions.push("t.deleted_at IS NULL");
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(t.title ILIKE $${params.length} OR t.slug ILIKE $${params.length} OR t.code ILIKE $${params.length})`);
  }

  if (status && status !== "all") {
    params.push(status);
    conditions.push(`t.status = $${params.length}`);
  }

  if (destination_id) {
    params.push(destination_id);
    conditions.push(`t.destination_id = $${params.length}`);
  }

  if (region_id) {
    params.push(region_id);
    conditions.push(`t.region_id = $${params.length}`);
  }

  if (activity_id) {
    params.push(activity_id);
    conditions.push(`t.activity_id = $${params.length}`);
  }

  if (category_id) {
    params.push(category_id);
    conditions.push(`t.category_id = $${params.length}`);
  }

  if (difficulty) {
    params.push(difficulty);
    conditions.push(`t.difficulty = $${params.length}`);
  }

  if (featured === "true" || featured === "false") {
    params.push(featured === "true");
    conditions.push(`t.featured = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countSql = `SELECT count(*)::int AS total FROM trips t ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  params.push(limit);
  const limitIndex = params.length;
  params.push((page - 1) * limit);
  const offsetIndex = params.length;

  const dataSql = `
    SELECT t.id, t.slug, t.code, t.title,
           t.short_description AS "shortDescription",
           t.duration_days AS "durationDays", t.duration_nights AS "durationNights",
           t.difficulty, t.base_price AS "basePrice", t.sale_price AS "salePrice",
           t.currency, t.featured, t.badge, t.status, t.display_area AS "displayArea",
           t.published_at AS "publishedAt", t.created_at AS "createdAt",
           t.updated_at AS "updatedAt", t.deleted_at AS "deletedAt",
           d.id AS "destinationId", d.name AS "destinationName",
           r.id AS "regionId", r.title AS "regionTitle",
           a.id AS "activityId", a.title AS "activityTitle",
           c.id AS "categoryId", c.name AS "categoryName",
           hm.public_url AS "heroMediaUrl"
    FROM trips t
    JOIN destinations d ON d.id = t.destination_id
    LEFT JOIN regions r ON r.id = t.region_id
    LEFT JOIN activities a ON a.id = t.activity_id
    LEFT JOIN trip_categories c ON c.id = t.category_id
    LEFT JOIN media_assets hm ON hm.id = t.hero_media_id
    ${whereClause}
    ORDER BY t.created_at DESC, t.id DESC
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

export const getAdminTripById = async (id) => {
  const sql = `
    SELECT t.id, t.slug, t.code, t.title,
           t.short_description AS "shortDescription", t.full_description AS "fullDescription",
           t.duration_days AS "durationDays", t.duration_nights AS "durationNights",
           t.difficulty, t.max_altitude_m AS "maxAltitudeM", t.max_altitude_label AS "maxAltitudeLabel",
           t.min_group_size AS "minGroupSize", t.max_group_size AS "maxGroupSize",
           t.start_location AS "startLocation", t.end_location AS "endLocation",
           t.best_season AS "bestSeason", t.base_price AS "basePrice", t.sale_price AS "salePrice",
           t.currency, t.single_supplement AS "singleSupplement", t.child_price AS "childPrice",
           t.featured, t.badge, t.status, t.published_at AS "publishedAt",
           t.seo_title AS "seoTitle", t.seo_description AS "seoDescription",
           t.hero_media_id AS "heroMediaId", t.display_area AS "displayArea",
           t.elevation_profile_media_id AS "elevationProfileMediaId",
           t.route_map_media_id AS "routeMapMediaId",
           t.video_url AS "videoUrl",
           COALESCE(t.departures, '[]'::jsonb) AS "departures",
           epm.public_url AS "elevationProfileMediaUrl",
           rmm.public_url AS "routeMapMediaUrl",
           COALESCE(t.group_pricing, '[]'::jsonb) AS "groupPricing",
           t.created_at AS "createdAt", t.updated_at AS "updatedAt", t.deleted_at AS "deletedAt",
           d.id AS "destinationId", d.name AS "destinationName", d.country AS "destinationCountry",
           r.id AS "regionId", r.title AS "regionTitle",
           a.id AS "activityId", a.title AS "activityTitle",
           c.id AS "categoryId", c.name AS "categoryName",
           hm.public_url AS "heroMediaUrl"
    FROM trips t
    JOIN destinations d ON d.id = t.destination_id
    LEFT JOIN regions r ON r.id = t.region_id
    LEFT JOIN activities a ON a.id = t.activity_id
    LEFT JOIN trip_categories c ON c.id = t.category_id
    LEFT JOIN media_assets hm ON hm.id = t.hero_media_id
    LEFT JOIN media_assets epm ON epm.id = t.elevation_profile_media_id
    LEFT JOIN media_assets rmm ON rmm.id = t.route_map_media_id
    WHERE t.id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [id]);
  if (!rows[0]) return null;

  const trip = rows[0];

  const [imagesRes, itineraryRes, highlightsRes, inclusionsRes, exclusionsRes, faqsRes] = await Promise.all([
    pool.query(`
      SELECT ti.id, ti.media_id AS "mediaId", ti.alt_text AS "altText",
             ti.sort_order AS "sortOrder", ti.is_hero AS "isHero", m.public_url AS "publicUrl"
      FROM trip_images ti
      JOIN media_assets m ON m.id = ti.media_id
      WHERE ti.trip_id = $1
      ORDER BY ti.sort_order ASC, ti.id ASC
    `, [id]),
    pool.query(`
      SELECT tid.id, tid.day_number AS "dayNumber", tid.title, tid.description,
             tid.altitude, tid.trekking_time AS "trekkingTime", tid.accommodation,
             tid.media_id AS "mediaId", tid.media_id_2 AS "mediaId2", tid.sort_order AS "sortOrder",
             m1.public_url AS "imageUrl", m2.public_url AS "imageUrl2"
      FROM trip_itinerary_days tid
      LEFT JOIN media_assets m1 ON m1.id = tid.media_id
      LEFT JOIN media_assets m2 ON m2.id = tid.media_id_2
      WHERE tid.trip_id = $1
      ORDER BY tid.sort_order ASC, tid.day_number ASC
    `, [id]),
    pool.query(`SELECT id, text, sort_order AS "sortOrder" FROM trip_highlights WHERE trip_id = $1 ORDER BY sort_order ASC, id ASC`, [id]),
    pool.query(`SELECT id, text, sort_order AS "sortOrder" FROM trip_inclusions WHERE trip_id = $1 ORDER BY sort_order ASC, id ASC`, [id]),
    pool.query(`SELECT id, text, sort_order AS "sortOrder" FROM trip_exclusions WHERE trip_id = $1 ORDER BY sort_order ASC, id ASC`, [id]),
    pool.query(`SELECT id, question, answer, sort_order AS "sortOrder", status FROM faqs WHERE trip_id = $1 ORDER BY sort_order ASC, id ASC`, [id]),
  ]);

  trip.images = imagesRes.rows;
  trip.itinerary = itineraryRes.rows;
  trip.highlights = highlightsRes.rows;
  trip.inclusions = inclusionsRes.rows;
  trip.exclusions = exclusionsRes.rows;
  trip.faqs = faqsRes.rows;

  return trip;
};

export const getTripBySlug = async (slug) => {
  const sql = `SELECT id, slug, title FROM trips WHERE slug = $1 LIMIT 1`;
  const { rows } = await pool.query(sql, [slug]);
  return rows[0] || null;
};

export const getTripByCode = async (code) => {
  if (!code) return null;
  const sql = `SELECT id, slug, code FROM trips WHERE code = $1 LIMIT 1`;
  const { rows } = await pool.query(sql, [code]);
  return rows[0] || null;
};

export const createTrip = async (data) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Validate relationships
    const dest = await client.query("SELECT id FROM destinations WHERE id = $1", [data.destination_id]);
    if (dest.rowCount === 0) throw new ApiError(400, "Referenced destination does not exist");

    if (data.region_id) {
      const reg = await client.query("SELECT id, destination_id FROM regions WHERE id = $1", [data.region_id]);
      if (reg.rowCount === 0) throw new ApiError(400, "Referenced region does not exist");
      if (String(reg.rows[0].destination_id) !== String(data.destination_id)) {
        throw new ApiError(400, "The specified region does not belong to the selected destination");
      }
    }

    if (data.activity_id) {
      const act = await client.query("SELECT id FROM activities WHERE id = $1", [data.activity_id]);
      if (act.rowCount === 0) throw new ApiError(400, "Referenced activity does not exist");
    }

    if (data.category_id) {
      const cat = await client.query("SELECT id FROM trip_categories WHERE id = $1", [data.category_id]);
      if (cat.rowCount === 0) throw new ApiError(400, "Referenced trip category does not exist");
    }

    const publishedAt = data.status === "published"
      ? (data.published_at || new Date().toISOString())
      : (data.published_at || null);

    const insertSql = `
      INSERT INTO trips (
        slug, code, title, short_description, full_description,
        destination_id, region_id, activity_id, category_id,
        duration_days, duration_nights, difficulty,
        max_altitude_m, max_altitude_label, min_group_size, max_group_size,
        start_location, end_location, best_season,
        base_price, sale_price, currency, single_supplement, child_price,
        featured, badge, status, published_at, seo_title, seo_description,
        hero_media_id, display_area
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32
      )
      RETURNING id
    `;

    const values = [
      data.slug,
      data.code || null,
      data.title,
      data.short_description || "",
      data.full_description || "",
      data.destination_id,
      data.region_id || null,
      data.activity_id || null,
      data.category_id || null,
      data.duration_days,
      data.duration_nights ?? null,
      data.difficulty || null,
      data.max_altitude_m ?? null,
      data.max_altitude_label || null,
      data.min_group_size ?? null,
      data.max_group_size ?? null,
      data.start_location || "",
      data.end_location || "",
      data.best_season || "",
      data.base_price,
      data.sale_price ?? null,
      data.currency || "USD",
      data.single_supplement ?? null,
      data.child_price ?? null,
      Boolean(data.featured),
      data.badge || null,
      data.status || "draft",
      publishedAt,
      data.seo_title || null,
      data.seo_description || null,
      data.hero_media_id || null,
      data.display_area || null,
      data.group_pricing ? (typeof data.group_pricing === 'string' ? data.group_pricing : JSON.stringify(data.group_pricing)) : (data.groupPricing ? JSON.stringify(data.groupPricing) : '[]'),
      data.elevation_profile_media_id || data.elevationProfileMediaId || null,
      data.route_map_media_id || data.routeMapMediaId || null,
      data.video_url || data.videoUrl || null,
      data.departures ? JSON.stringify(data.departures) : '[]',
    ];

    const { rows } = await client.query(insertSql, values);
    const tripId = rows[0].id;

    // Insert Images
    if (Array.isArray(data.images) && data.images.length > 0) {
      for (const [idx, img] of data.images.entries()) {
        await client.query(`
          INSERT INTO trip_images (trip_id, media_id, alt_text, sort_order, is_hero)
          VALUES ($1, $2, $3, $4, $5)
        `, [tripId, img.media_id, img.alt_text || null, img.sort_order ?? idx, Boolean(img.is_hero)]);
      }
    }

    // Insert Itinerary
    if (Array.isArray(data.itinerary) && data.itinerary.length > 0) {
      for (const [idx, day] of data.itinerary.entries()) {
        let mediaId = day.media_id ? Number(day.media_id) : null;
        let mediaId2 = day.media_id_2 ? Number(day.media_id_2) : null;

        if (!mediaId && (day.image_url || day.imageUrl)) {
          const urlCand = day.image_url || day.imageUrl;
          const cleanPath = urlCand.replace(/^https?:\/\/[^\/]+/, '').replace(/^\/+/, '');
          const found = await client.query(
            `SELECT id FROM media_assets WHERE public_url = $1 OR storage_key = $1 OR storage_key = $2 OR public_url = $3 LIMIT 1`,
            [urlCand, cleanPath, '/' + cleanPath]
          );
          if (found.rows.length > 0) mediaId = Number(found.rows[0].id);
        }

        if (!mediaId2 && (day.image_url_2 || day.imageUrl2)) {
          const urlCand2 = day.image_url_2 || day.imageUrl2;
          const cleanPath2 = urlCand2.replace(/^https?:\/\/[^\/]+/, '').replace(/^\/+/, '');
          const found2 = await client.query(
            `SELECT id FROM media_assets WHERE public_url = $1 OR storage_key = $1 OR storage_key = $2 OR public_url = $3 LIMIT 1`,
            [urlCand2, cleanPath2, '/' + cleanPath2]
          );
          if (found2.rows.length > 0) mediaId2 = Number(found2.rows[0].id);
        }

        await client.query(`
          INSERT INTO trip_itinerary_days (
            trip_id, day_number, title, description, altitude, trekking_time, accommodation, media_id, media_id_2, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          tripId,
          day.day_number,
          day.title,
          day.description || "",
          day.altitude || null,
          day.trekking_time || day.duration || null,
          day.accommodation || null,
          mediaId || null,
          mediaId2 || null,
          day.sort_order ?? idx,
        ]);
      }
    }

    // Insert Highlights
    if (Array.isArray(data.highlights) && data.highlights.length > 0) {
      for (const [idx, item] of data.highlights.entries()) {
        const text = typeof item === "string" ? item : item.text;
        const sortOrder = typeof item === "object" && item.sort_order !== undefined ? item.sort_order : idx;
        await client.query(`INSERT INTO trip_highlights (trip_id, text, sort_order) VALUES ($1, $2, $3)`, [tripId, text, sortOrder]);
      }
    }

    // Insert Inclusions
    if (Array.isArray(data.inclusions) && data.inclusions.length > 0) {
      for (const [idx, item] of data.inclusions.entries()) {
        const text = typeof item === "string" ? item : item.text;
        const sortOrder = typeof item === "object" && item.sort_order !== undefined ? item.sort_order : idx;
        await client.query(`INSERT INTO trip_inclusions (trip_id, text, sort_order) VALUES ($1, $2, $3)`, [tripId, text, sortOrder]);
      }
    }

    // Insert Exclusions
    if (Array.isArray(data.exclusions) && data.exclusions.length > 0) {
      for (const [idx, item] of data.exclusions.entries()) {
        const text = typeof item === "string" ? item : item.text;
        const sortOrder = typeof item === "object" && item.sort_order !== undefined ? item.sort_order : idx;
        await client.query(`INSERT INTO trip_exclusions (trip_id, text, sort_order) VALUES ($1, $2, $3)`, [tripId, text, sortOrder]);
      }
    }

    // Insert FAQs
    if (Array.isArray(data.faqs) && data.faqs.length > 0) {
      for (const [idx, faq] of data.faqs.entries()) {
        await client.query(`
          INSERT INTO faqs (trip_id, question, answer, sort_order, status)
          VALUES ($1, $2, $3, $4, $5)
        `, [tripId, faq.question, faq.answer, faq.sort_order ?? idx, faq.status || "published"]);
      }
    }

    await client.query("COMMIT");
    return getAdminTripById(tripId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateTrip = async (id, fields) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check relationship validity if changed
    const currentRes = await client.query("SELECT id, destination_id, region_id FROM trips WHERE id = $1", [id]);
    if (currentRes.rowCount === 0) throw new ApiError(404, "Trip not found");
    const current = currentRes.rows[0];

    const destId = fields.destination_id || current.destination_id;
    const regId = fields.region_id !== undefined ? fields.region_id : current.region_id;

    if (fields.destination_id) {
      const dest = await client.query("SELECT id FROM destinations WHERE id = $1", [fields.destination_id]);
      if (dest.rowCount === 0) throw new ApiError(400, "Referenced destination does not exist");
    }

    if (regId) {
      const reg = await client.query("SELECT id, destination_id FROM regions WHERE id = $1", [regId]);
      if (reg.rowCount === 0) throw new ApiError(400, "Referenced region does not exist");
      if (String(reg.rows[0].destination_id) !== String(destId)) {
        throw new ApiError(400, "The specified region does not belong to the selected destination");
      }
    }

    if (fields.activity_id) {
      const act = await client.query("SELECT id FROM activities WHERE id = $1", [fields.activity_id]);
      if (act.rowCount === 0) throw new ApiError(400, "Referenced activity does not exist");
    }

    if (fields.category_id) {
      const cat = await client.query("SELECT id FROM trip_categories WHERE id = $1", [fields.category_id]);
      if (cat.rowCount === 0) throw new ApiError(400, "Referenced trip category does not exist");
    }

    if (fields.groupPricing !== undefined && fields.group_pricing === undefined) {
      fields.group_pricing = Array.isArray(fields.groupPricing) ? JSON.stringify(fields.groupPricing) : '[]';
    } else if (Array.isArray(fields.departures)) {
      fields.departures = JSON.stringify(fields.departures);
    }
    if (Array.isArray(fields.group_pricing)) {
      fields.group_pricing = JSON.stringify(fields.group_pricing);
    }
    const sets = [];
    const values = [];

    const fieldMapping = {
      slug: "slug",
      code: "code",
      title: "title",
      short_description: "short_description",
      full_description: "full_description",
      destination_id: "destination_id",
      region_id: "region_id",
      activity_id: "activity_id",
      category_id: "category_id",
      duration_days: "duration_days",
      duration_nights: "duration_nights",
      difficulty: "difficulty",
      max_altitude_m: "max_altitude_m",
      max_altitude_label: "max_altitude_label",
      min_group_size: "min_group_size",
      max_group_size: "max_group_size",
      start_location: "start_location",
      end_location: "end_location",
      best_season: "best_season",
      base_price: "base_price",
      sale_price: "sale_price",
      currency: "currency",
      single_supplement: "single_supplement",
      child_price: "child_price",
      featured: "featured",
      badge: "badge",
      status: "status",
      published_at: "published_at",
      seo_title: "seo_title",
      seo_description: "seo_description",
      hero_media_id: "hero_media_id",
      display_area: "display_area",
      group_pricing: "group_pricing",
      elevation_profile_media_id: "elevation_profile_media_id",
      route_map_media_id: "route_map_media_id",
      video_url: "video_url",
      departures: "departures",
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
      const sql = `UPDATE trips SET ${sets.join(", ")} WHERE id = $${values.length}`;
      await client.query(sql, values);
    }

    // Replace images if provided
    if (Array.isArray(fields.images)) {
      await client.query("DELETE FROM trip_images WHERE trip_id = $1", [id]);
      for (const [idx, img] of fields.images.entries()) {
        await client.query(`
          INSERT INTO trip_images (trip_id, media_id, alt_text, sort_order, is_hero)
          VALUES ($1, $2, $3, $4, $5)
        `, [id, img.media_id, img.alt_text || null, img.sort_order ?? idx, Boolean(img.is_hero)]);
      }
    }

    // Replace itinerary if provided
    if (Array.isArray(fields.itinerary)) {
      await client.query("DELETE FROM trip_itinerary_days WHERE trip_id = $1", [id]);
      for (const [idx, day] of fields.itinerary.entries()) {
        let mediaId = day.media_id ? Number(day.media_id) : null;
        let mediaId2 = day.media_id_2 ? Number(day.media_id_2) : null;

        if (!mediaId && (day.image_url || day.imageUrl)) {
          const urlCand = day.image_url || day.imageUrl;
          const cleanPath = urlCand.replace(/^https?:\/\/[^\/]+/, '').replace(/^\/+/, '');
          const found = await client.query(
            `SELECT id FROM media_assets WHERE public_url = $1 OR storage_key = $1 OR storage_key = $2 OR public_url = $3 LIMIT 1`,
            [urlCand, cleanPath, '/' + cleanPath]
          );
          if (found.rows.length > 0) mediaId = Number(found.rows[0].id);
        }

        if (!mediaId2 && (day.image_url_2 || day.imageUrl2)) {
          const urlCand2 = day.image_url_2 || day.imageUrl2;
          const cleanPath2 = urlCand2.replace(/^https?:\/\/[^\/]+/, '').replace(/^\/+/, '');
          const found2 = await client.query(
            `SELECT id FROM media_assets WHERE public_url = $1 OR storage_key = $1 OR storage_key = $2 OR public_url = $3 LIMIT 1`,
            [urlCand2, cleanPath2, '/' + cleanPath2]
          );
          if (found2.rows.length > 0) mediaId2 = Number(found2.rows[0].id);
        }

        await client.query(`
          INSERT INTO trip_itinerary_days (
            trip_id, day_number, title, description, altitude, trekking_time, accommodation, media_id, media_id_2, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          id,
          day.day_number,
          day.title,
          day.description || "",
          day.altitude || null,
          day.trekking_time || day.duration || null,
          day.accommodation || null,
          mediaId || null,
          mediaId2 || null,
          day.sort_order ?? idx,
        ]);
      }
    }

    // Replace highlights if provided
    if (Array.isArray(fields.highlights)) {
      await client.query("DELETE FROM trip_highlights WHERE trip_id = $1", [id]);
      for (const [idx, item] of fields.highlights.entries()) {
        const text = typeof item === "string" ? item : item.text;
        const sortOrder = typeof item === "object" && item.sort_order !== undefined ? item.sort_order : idx;
        await client.query(`INSERT INTO trip_highlights (trip_id, text, sort_order) VALUES ($1, $2, $3)`, [id, text, sortOrder]);
      }
    }

    // Replace inclusions if provided
    if (Array.isArray(fields.inclusions)) {
      await client.query("DELETE FROM trip_inclusions WHERE trip_id = $1", [id]);
      for (const [idx, item] of fields.inclusions.entries()) {
        const text = typeof item === "string" ? item : item.text;
        const sortOrder = typeof item === "object" && item.sort_order !== undefined ? item.sort_order : idx;
        await client.query(`INSERT INTO trip_inclusions (trip_id, text, sort_order) VALUES ($1, $2, $3)`, [id, text, sortOrder]);
      }
    }

    // Replace exclusions if provided
    if (Array.isArray(fields.exclusions)) {
      await client.query("DELETE FROM trip_exclusions WHERE trip_id = $1", [id]);
      for (const [idx, item] of fields.exclusions.entries()) {
        const text = typeof item === "string" ? item : item.text;
        const sortOrder = typeof item === "object" && item.sort_order !== undefined ? item.sort_order : idx;
        await client.query(`INSERT INTO trip_exclusions (trip_id, text, sort_order) VALUES ($1, $2, $3)`, [id, text, sortOrder]);
      }
    }

    // Replace faqs if provided
    if (Array.isArray(fields.faqs)) {
      await client.query("DELETE FROM faqs WHERE trip_id = $1", [id]);
      for (const [idx, faq] of fields.faqs.entries()) {
        await client.query(`
          INSERT INTO faqs (trip_id, question, answer, sort_order, status)
          VALUES ($1, $2, $3, $4, $5)
        `, [id, faq.question, faq.answer, faq.sort_order ?? idx, faq.status || "published"]);
      }
    }

    await client.query("COMMIT");
    return getAdminTripById(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const archiveTrip = async (id) => {
  const sql = `
    UPDATE trips
    SET status = 'archived', deleted_at = now(), updated_at = now()
    WHERE id = $1
    RETURNING id, slug, title, status, deleted_at AS "deletedAt"
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const restoreTrip = async (id) => {
  const sql = `
    UPDATE trips
    SET status = 'draft', deleted_at = NULL, updated_at = now()
    WHERE id = $1
    RETURNING id, slug, title, status, deleted_at AS "deletedAt"
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const deleteTrip = async (id) => {
  const { rowCount } = await pool.query("DELETE FROM trips WHERE id = $1", [id]);
  return rowCount > 0;
};
