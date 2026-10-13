import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export const listAdminBlogs = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  category_id = "",
  includeDeleted = "false",
}) => {
  const conditions = [];
  const params = [];

  if (includeDeleted !== "true") {
    conditions.push("b.deleted_at IS NULL");
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(b.title ILIKE $${params.length} OR b.slug ILIKE $${params.length} OR b.author ILIKE $${params.length})`);
  }

  if (status && status !== "all") {
    params.push(status);
    conditions.push(`b.status = $${params.length}`);
  }

  if (category_id) {
    params.push(category_id);
    conditions.push(`b.category_id = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countSql = `SELECT count(*)::int AS total FROM blogs b ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  params.push(limit);
  const limitIndex = params.length;
  params.push((page - 1) * limit);
  const offsetIndex = params.length;

  const dataSql = `
    SELECT b.id, b.slug, b.title, b.description, b.published_at AS "publishedAt",
           b.author, b.author_role AS "authorRole",
           b.hero_image_alt AS "heroImageAlt", b.intro, b.quote,
           b.category_id AS "categoryId", bc.name AS "categoryName",
           b.status, b.created_at AS "createdAt", b.updated_at AS "updatedAt", b.deleted_at AS "deletedAt",
           hm.public_url AS "heroMediaUrl", am.public_url AS "authorMediaUrl",
           (SELECT count(*)::int FROM blog_sections s WHERE s.blog_id = b.id) AS "sectionsCount"
    FROM blogs b
    LEFT JOIN blog_categories bc ON bc.id = b.category_id
    LEFT JOIN media_assets hm ON hm.id = b.hero_media_id
    LEFT JOIN media_assets am ON am.id = b.author_media_id
    ${whereClause}
    ORDER BY b.created_at DESC, b.id DESC
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

export const getAdminBlogById = async (id) => {
  const sql = `
    SELECT b.id, b.slug, b.title, b.description, b.published_at AS "publishedAt",
           b.author, b.author_role AS "authorRole",
           b.author_media_id AS "authorMediaId", b.hero_media_id AS "heroMediaId",
           b.hero_image_alt AS "heroImageAlt", b.category_id AS "categoryId", bc.name AS "categoryName",
           b.intro, b.quote, b.status, b.seo_title AS "seoTitle", b.seo_description AS "seoDescription",
           b.created_at AS "createdAt", b.updated_at AS "updatedAt", b.deleted_at AS "deletedAt",
           hm.public_url AS "heroMediaUrl", am.public_url AS "authorMediaUrl"
    FROM blogs b
    LEFT JOIN blog_categories bc ON bc.id = b.category_id
    LEFT JOIN media_assets hm ON hm.id = b.hero_media_id
    LEFT JOIN media_assets am ON am.id = b.author_media_id
    WHERE b.id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [id]);
  if (!rows[0]) return null;

  const blog = rows[0];

  const sectionsSql = `
    SELECT s.id, s.title, s.media_id AS "mediaId", s.image_alt AS "imageAlt",
           s.sort_order AS "sortOrder", m.public_url AS "mediaUrl"
    FROM blog_sections s
    LEFT JOIN media_assets m ON m.id = s.media_id
    WHERE s.blog_id = $1
    ORDER BY s.sort_order ASC, s.id ASC
  `;
  const sectionsRes = await pool.query(sectionsSql, [id]);
  const sections = sectionsRes.rows;

  if (sections.length > 0) {
    const sectionIds = sections.map((s) => s.id);
    const paragraphsSql = `
      SELECT p.blog_section_id AS "sectionId", p.body, p.sort_order AS "sortOrder"
      FROM blog_section_paragraphs p
      WHERE p.blog_section_id = ANY($1::bigint[])
      ORDER BY p.sort_order ASC, p.id ASC
    `;
    const paragraphsRes = await pool.query(paragraphsSql, [sectionIds]);
    const paragraphs = paragraphsRes.rows;

    for (const section of sections) {
      section.paragraphs = paragraphs
        .filter((p) => String(p.sectionId) === String(section.id))
        .map((p) => p.body);
    }
  }

  blog.sections = sections;
  return blog;
};

export const getBlogBySlug = async (slug) => {
  const sql = `SELECT id, slug, title FROM blogs WHERE slug = $1 LIMIT 1`;
  const { rows } = await pool.query(sql, [slug]);
  return rows[0] || null;
};

export const createBlog = async (data) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (data.category_id) {
      const cat = await client.query("SELECT id FROM blog_categories WHERE id = $1", [data.category_id]);
      if (cat.rowCount === 0) throw new ApiError(400, "Referenced blog category does not exist");
    }

    const publishedAt = data.status === "published"
      ? (data.published_at || new Date().toISOString())
      : (data.published_at || null);

    const insertSql = `
      INSERT INTO blogs (
        slug, title, description, published_at, author, author_role,
        author_media_id, hero_media_id, hero_image_alt, category_id,
        intro, quote, status, seo_title, seo_description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id
    `;

    const values = [
      data.slug,
      data.title,
      data.description || "",
      publishedAt,
      data.author || "",
      data.author_role || "",
      data.author_media_id || null,
      data.hero_media_id || null,
      data.hero_image_alt || "",
      data.category_id || null,
      data.intro || null,
      data.quote || null,
      data.status || "draft",
      data.seo_title || null,
      data.seo_description || null,
    ];

    const { rows } = await client.query(insertSql, values);
    const blogId = rows[0].id;

    if (Array.isArray(data.sections) && data.sections.length > 0) {
      for (const [sIdx, sec] of data.sections.entries()) {
        const secRes = await client.query(`
          INSERT INTO blog_sections (blog_id, title, media_id, image_alt, sort_order)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [blogId, sec.title, sec.media_id || null, sec.image_alt || null, sec.sort_order ?? sIdx]);
        const sectionId = secRes.rows[0].id;

        if (Array.isArray(sec.paragraphs) && sec.paragraphs.length > 0) {
          for (const [pIdx, body] of sec.paragraphs.entries()) {
            await client.query(`
              INSERT INTO blog_section_paragraphs (blog_section_id, body, sort_order)
              VALUES ($1, $2, $3)
            `, [sectionId, body, pIdx]);
          }
        }
      }
    }

    await client.query("COMMIT");
    return getAdminBlogById(blogId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateBlog = async (id, fields) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (fields.category_id) {
      const cat = await client.query("SELECT id FROM blog_categories WHERE id = $1", [fields.category_id]);
      if (cat.rowCount === 0) throw new ApiError(400, "Referenced blog category does not exist");
    }

    const sets = [];
    const values = [];

    const fieldMapping = {
      slug: "slug",
      title: "title",
      description: "description",
      published_at: "published_at",
      author: "author",
      author_role: "author_role",
      author_media_id: "author_media_id",
      hero_media_id: "hero_media_id",
      hero_image_alt: "hero_image_alt",
      category_id: "category_id",
      intro: "intro",
      quote: "quote",
      status: "status",
      seo_title: "seo_title",
      seo_description: "seo_description",
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
      const sql = `UPDATE blogs SET ${sets.join(", ")} WHERE id = $${values.length}`;
      await client.query(sql, values);
    }

    if (Array.isArray(fields.sections)) {
      await client.query("DELETE FROM blog_sections WHERE blog_id = $1", [id]);
      for (const [sIdx, sec] of fields.sections.entries()) {
        const secRes = await client.query(`
          INSERT INTO blog_sections (blog_id, title, media_id, image_alt, sort_order)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [id, sec.title, sec.media_id || null, sec.image_alt || null, sec.sort_order ?? sIdx]);
        const sectionId = secRes.rows[0].id;

        if (Array.isArray(sec.paragraphs) && sec.paragraphs.length > 0) {
          for (const [pIdx, body] of sec.paragraphs.entries()) {
            await client.query(`
              INSERT INTO blog_section_paragraphs (blog_section_id, body, sort_order)
              VALUES ($1, $2, $3)
            `, [sectionId, body, pIdx]);
          }
        }
      }
    }

    await client.query("COMMIT");
    return getAdminBlogById(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const archiveBlog = async (id) => {
  const sql = `
    UPDATE blogs
    SET status = 'archived', deleted_at = now(), updated_at = now()
    WHERE id = $1
    RETURNING id, slug, title, status, deleted_at AS "deletedAt"
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const restoreBlog = async (id) => {
  const sql = `
    UPDATE blogs
    SET status = 'draft', deleted_at = NULL, updated_at = now()
    WHERE id = $1
    RETURNING id, slug, title, status, deleted_at AS "deletedAt"
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

export const deleteBlog = async (id) => {
  const { rowCount } = await pool.query("DELETE FROM blogs WHERE id = $1", [id]);
  return rowCount > 0;
};
