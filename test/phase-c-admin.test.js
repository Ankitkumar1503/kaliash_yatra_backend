import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
import pool from "../src/config/db.js";
import { generateAccessToken } from "../src/utils/token.js";

let server;
let baseUrl;
let adminToken;
let userToken;
let adminUserId;
let regularUserId;
let fixtureMediaId;

const testPrefix = `test-phase-c-${Date.now()}`;

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...options.headers },
  });
  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, body };
};

before(async () => {
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  // Admin user
  const adminRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, 'hash', 'admin') RETURNING id, email`,
    ["Phase C Admin", `${testPrefix}-admin@example.invalid`],
  );
  adminUserId = adminRes.rows[0].id;
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT $1, id FROM roles WHERE key = 'admin' ON CONFLICT DO NOTHING`,
    [adminUserId],
  );
  adminToken = generateAccessToken({ id: adminUserId, email: adminRes.rows[0].email, role: "admin" });

  // Regular user
  const userRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, 'hash', 'user') RETURNING id, email`,
    ["Phase C User", `${testPrefix}-user@example.invalid`],
  );
  regularUserId = userRes.rows[0].id;
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT $1, id FROM roles WHERE key = 'user' ON CONFLICT DO NOTHING`,
    [regularUserId],
  );
  userToken = generateAccessToken({ id: regularUserId, email: userRes.rows[0].email, role: "user" });

  // Media asset fixture
  const mediaRes = await pool.query(
    `INSERT INTO media_assets (storage_key, public_url, media_type, alt_text)
     VALUES ($1, $2, 'image/jpeg', 'Blog Media') RETURNING id`,
    [`${testPrefix}-media`, `https://example.invalid/${testPrefix}.jpg`],
  );
  fixtureMediaId = mediaRes.rows[0].id;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));

  // Clean up blogs and categories
  await pool.query("DELETE FROM blog_section_paragraphs WHERE blog_section_id IN (SELECT id FROM blog_sections WHERE blog_id IN (SELECT id FROM blogs WHERE slug LIKE $1))", [`${testPrefix}%`]);
  await pool.query("DELETE FROM blog_sections WHERE blog_id IN (SELECT id FROM blogs WHERE slug LIKE $1)", [`${testPrefix}%`]);
  await pool.query("DELETE FROM blogs WHERE slug LIKE $1", [`${testPrefix}%`]);
  await pool.query("DELETE FROM blog_categories WHERE slug LIKE $1", [`${testPrefix}%`]);
  if (fixtureMediaId) await pool.query("DELETE FROM media_assets WHERE id = $1", [fixtureMediaId]);

  if (adminUserId) await pool.query("DELETE FROM users WHERE id = $1", [adminUserId]);
  if (regularUserId) await pool.query("DELETE FROM users WHERE id = $1", [regularUserId]);

  await pool.end();
});

test("Phase C: Blogs and blog categories admin CRUD APIs", async (t) => {
  let createdCategoryId;
  let createdBlogId;
  const catSlug = `${testPrefix}-cat`;
  const blogSlug = `${testPrefix}-blog`;

  await t.test("C1. Blog categories admin CRUD", async () => {
    // 1. Unauthenticated gets 401
    const anon = await request("/api/v1/admin/blog-categories");
    assert.equal(anon.status, 401);

    // 2. Regular user gets 403
    const forbidden = await request("/api/v1/admin/blog-categories", {
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.equal(forbidden.status, 403);

    // 3. Admin creates blog category
    const createRes = await request("/api/v1/admin/blog-categories", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: "Trekking Guides", slug: catSlug, status: "active" }),
    });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.data.slug, catSlug);
    createdCategoryId = createRes.body.data.id;

    // 4. Duplicate slug returns 409
    const dupRes = await request("/api/v1/admin/blog-categories", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: "Duplicate", slug: catSlug }),
    });
    assert.equal(dupRes.status, 409);

    // 5. Admin gets category by ID
    const getRes = await request(`/api/v1/admin/blog-categories/${createdCategoryId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.name, "Trekking Guides");

    // 6. Admin updates category
    const updateRes = await request(`/api/v1/admin/blog-categories/${createdCategoryId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: "Himalayan Guides" }),
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.name, "Himalayan Guides");
  });

  await t.test("C2. Blogs admin CRUD with sections and paragraphs", async () => {
    // 1. Admin creates blog
    const createRes = await request("/api/v1/admin/blogs", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: "Essential Packing Tips for Kailash Yatra",
        slug: blogSlug,
        description: "Everything you need to pack for a high altitude pilgrimage.",
        category_id: createdCategoryId,
        author: "Tenzing Sherpa",
        author_role: "Lead Guide",
        hero_media_id: fixtureMediaId,
        hero_image_alt: "Kailash Peak",
        status: "draft",
        sections: [
          {
            title: "Layering Clothing",
            media_id: fixtureMediaId,
            sort_order: 0,
            paragraphs: [
              "Thermal base layers are mandatory for freezing nights.",
              "Waterproof outer shell guards against sudden snowfall.",
            ],
          },
          {
            title: "Footwear & Socks",
            sort_order: 1,
            paragraphs: [
              "Break in your trekking boots at least a month prior.",
            ],
          },
        ],
      }),
    });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.data.slug, blogSlug);
    assert.equal(createRes.body.data.sections.length, 2);
    assert.equal(createRes.body.data.sections[0].paragraphs.length, 2);
    createdBlogId = createRes.body.data.id;

    // 2. Draft is not visible on public GET /blogs
    const publicList = await request("/api/v1/blogs");
    assert.equal(publicList.status, 200);
    assert.ok(!publicList.body.data.items.some((b) => b.slug === blogSlug));

    // 3. Admin gets blog by ID
    const getRes = await request(`/api/v1/admin/blogs/${createdBlogId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.sections[0].title, "Layering Clothing");

    // 4. Admin updates blog to published
    const updateRes = await request(`/api/v1/admin/blogs/${createdBlogId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "published" }),
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.status, "published");

    // 5. Now visible on public GET /blogs
    const publicListAfter = await request("/api/v1/blogs");
    assert.ok(publicListAfter.body.data.items.some((b) => b.slug === blogSlug));

    // 6. Admin archives blog
    const archiveRes = await request(`/api/v1/admin/blogs/${createdBlogId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(archiveRes.status, 200);
    assert.equal(archiveRes.body.data.status, "archived");

    // 7. Admin restores blog
    const restoreRes = await request(`/api/v1/admin/blogs/${createdBlogId}/restore`, {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(restoreRes.status, 200);
    assert.equal(restoreRes.body.data.status, "draft");

    // 8. Admin permanent delete
    const permDel = await request(`/api/v1/admin/blogs/${createdBlogId}/permanent`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(permDel.status, 200);

    // 9. Now delete category
    const delCat = await request(`/api/v1/admin/blog-categories/${createdCategoryId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delCat.status, 200);
  });
});
