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

const testPrefix = `test-phase-e-${Date.now()}`;

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
    ["Phase E Admin", `${testPrefix}-admin@example.invalid`],
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
    ["Phase E User", `${testPrefix}-user@example.invalid`],
  );
  regularUserId = userRes.rows[0].id;
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT $1, id FROM roles WHERE key = 'user' ON CONFLICT DO NOTHING`,
    [regularUserId],
  );
  userToken = generateAccessToken({ id: regularUserId, email: userRes.rows[0].email, role: "user" });
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));

  await pool.query("DELETE FROM gallery_items WHERE title LIKE $1", [`${testPrefix}%`]);
  await pool.query("DELETE FROM destinations WHERE slug LIKE $1", [`${testPrefix}%`]);
  await pool.query("DELETE FROM media_assets WHERE storage_key LIKE $1", [`${testPrefix}%`]);

  if (adminUserId) await pool.query("DELETE FROM users WHERE id = $1", [adminUserId]);
  if (regularUserId) await pool.query("DELETE FROM users WHERE id = $1", [regularUserId]);

  await pool.end();
});

test("Phase E: Gallery and media metadata admin CRUD APIs", async (t) => {
  let createdMediaId;
  let createdGalleryId;
  const storageKey = `${testPrefix}-img-1`;

  await t.test("E1. Media library metadata admin CRUD & foreign key safety check", async () => {
    // 1. Unauthenticated gets 401
    const anon = await request("/api/v1/admin/media");
    assert.equal(anon.status, 401);

    // 2. Regular user gets 403
    const forbidden = await request("/api/v1/admin/media", {
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.equal(forbidden.status, 403);

    // 3. Admin creates media asset metadata
    const createRes = await request("/api/v1/admin/media", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        storage_key: storageKey,
        public_url: `https://example.invalid/${storageKey}.jpg`,
        media_type: "image/jpeg",
        alt_text: "High mountain landscape",
        width: 1920,
        height: 1080,
        file_size: 204800,
      }),
    });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.data.storageKey, storageKey);
    createdMediaId = createRes.body.data.id;

    // 4. Duplicate storage key returns 409
    const dupRes = await request("/api/v1/admin/media", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        storage_key: storageKey,
        public_url: `https://example.invalid/another.jpg`,
        media_type: "image/jpeg",
      }),
    });
    assert.equal(dupRes.status, 409);

    // 5. Admin updates media metadata
    const updateRes = await request(`/api/v1/admin/media/${createdMediaId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ alt_text: "Updated mountain landscape" }),
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.altText, "Updated mountain landscape");

    // 6. Link media to a test destination to verify FK safety on delete
    const destRes = await pool.query(
      `INSERT INTO destinations (slug, name, country, hero_media_id, status)
       VALUES ($1, 'FK Test Dest', 'Nepal', $2, 'draft') RETURNING id`,
      [`${testPrefix}-fk-dest`, createdMediaId],
    );
    const destId = destRes.rows[0].id;

    // 7. Deleting media currently referenced returns 409
    const delConflict = await request(`/api/v1/admin/media/${createdMediaId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delConflict.status, 409);

    // 8. Clean up destination link
    await pool.query("DELETE FROM destinations WHERE id = $1", [destId]);
  });

  await t.test("E2. Gallery items admin CRUD", async () => {
    // 1. Admin creates gallery item
    const createRes = await request("/api/v1/admin/gallery", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        media_id: createdMediaId,
        title: `${testPrefix} Everest Sunrise`,
        location: "Khumbu Valley",
        alt_text: "Sunrise illuminating Mount Everest",
        sort_order: 0,
        status: "draft",
      }),
    });
    assert.equal(createRes.status, 201);
    createdGalleryId = createRes.body.data.id;

    // 2. Draft gallery item is not exposed on public GET /api/v1/gallery
    const publicList = await request("/api/v1/gallery");
    assert.equal(publicList.status, 200);
    assert.ok(!publicList.body.data.items.some((g) => g.id === createdGalleryId));

    // 3. Admin gets gallery item by ID
    const getRes = await request(`/api/v1/admin/gallery/${createdGalleryId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.title, `${testPrefix} Everest Sunrise`);

    // 4. Admin updates gallery item to published
    const updateRes = await request(`/api/v1/admin/gallery/${createdGalleryId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "published" }),
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.status, "published");

    // 5. Now visible on public GET /api/v1/gallery
    const publicListAfter = await request("/api/v1/gallery");
    assert.ok(publicListAfter.body.data.items.some((g) => g.id === createdGalleryId));

    // 6. Admin archives gallery item
    const archiveRes = await request(`/api/v1/admin/gallery/${createdGalleryId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(archiveRes.status, 200);

    // 7. Admin restores gallery item
    const restoreRes = await request(`/api/v1/admin/gallery/${createdGalleryId}/restore`, {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(restoreRes.status, 200);

    // 8. Admin permanently deletes gallery item
    const permDel = await request(`/api/v1/admin/gallery/${createdGalleryId}/permanent`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(permDel.status, 200);

    // 9. Now delete unlinked media asset
    const delMedia = await request(`/api/v1/admin/media/${createdMediaId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delMedia.status, 200);
  });
});
