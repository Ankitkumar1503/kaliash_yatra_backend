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

const testPrefix = `test-phase-a-${Date.now()}`;

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

  // Create temporary admin user
  const adminRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, 'hash', 'admin')
     RETURNING id, email, role`,
    ["Phase A Admin", `${testPrefix}-admin@example.invalid`],
  );
  adminUserId = adminRes.rows[0].id;
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT $1, id FROM roles WHERE key = 'admin' ON CONFLICT DO NOTHING`,
    [adminUserId],
  );
  adminToken = generateAccessToken({ id: adminUserId, email: adminRes.rows[0].email, role: "admin" });

  // Create temporary regular user without permissions
  const userRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, 'hash', 'user')
     RETURNING id, email, role`,
    ["Phase A User", `${testPrefix}-user@example.invalid`],
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

  // Clean up any test records created with testPrefix
  await pool.query("DELETE FROM region_experiences WHERE source_id LIKE $1", [`${testPrefix}%`]);
  await pool.query("DELETE FROM region_popular_places WHERE source_id LIKE $1", [`${testPrefix}%`]);
  await pool.query("DELETE FROM regions WHERE slug LIKE $1", [`${testPrefix}%`]);
  await pool.query("DELETE FROM destinations WHERE slug LIKE $1", [`${testPrefix}%`]);
  await pool.query("DELETE FROM activities WHERE slug LIKE $1", [`${testPrefix}%`]);
  await pool.query("DELETE FROM trip_categories WHERE slug LIKE $1", [`${testPrefix}%`]);

  if (adminUserId) await pool.query("DELETE FROM users WHERE id = $1", [adminUserId]);
  if (regularUserId) await pool.query("DELETE FROM users WHERE id = $1", [regularUserId]);

  await pool.end();
});

test("Phase A: Reference content admin CRUD APIs", async (t) => {
  let createdCategoryId;
  let createdDestinationId;
  let createdActivityId;
  let createdRegionId;

  await t.test("A1. Trip Categories admin & public APIs", async () => {
    // 1. Unauthenticated gets 401
    const anon = await request("/api/v1/admin/trip-categories");
    assert.equal(anon.status, 401);

    // 2. Regular user gets 403
    const forbidden = await request("/api/v1/admin/trip-categories", {
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.equal(forbidden.status, 403);

    // 3. Admin creates category
    const catSlug = `${testPrefix}-cat`;
    const createRes = await request("/api/v1/admin/trip-categories", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: "Test Category",
        slug: catSlug,
        description: "Test category description",
        status: "active",
      }),
    });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.data.slug, catSlug);
    createdCategoryId = createRes.body.data.id;

    // 4. Duplicate slug returns 409
    const dupRes = await request("/api/v1/admin/trip-categories", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: "Duplicate", slug: catSlug }),
    });
    assert.equal(dupRes.status, 409);

    // 5. Admin gets category by ID
    const getRes = await request(`/api/v1/admin/trip-categories/${createdCategoryId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.name, "Test Category");

    // 6. Admin updates category
    const updateRes = await request(`/api/v1/admin/trip-categories/${createdCategoryId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: "Updated Category Name" }),
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.name, "Updated Category Name");

    // 7. Public GET /trip-categories includes active category
    const publicRes = await request("/api/v1/trip-categories");
    assert.equal(publicRes.status, 200);
    assert.ok(publicRes.body.data.some((c) => c.slug === catSlug));

    // 8. Admin deletes category
    const delRes = await request(`/api/v1/admin/trip-categories/${createdCategoryId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delRes.status, 200);
  });

  await t.test("A2. Destinations admin CRUD and status management", async () => {
    const destSlug = `${testPrefix}-dest`;
    // 1. Admin creates destination
    const createRes = await request("/api/v1/admin/destinations", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: "Test Destination Country",
        slug: destSlug,
        country: "Testland",
        tagline: "The land of tests",
        status: "draft",
      }),
    });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.data.slug, destSlug);
    createdDestinationId = createRes.body.data.id;

    // 2. Draft is not visible on public GET /destinations
    const publicList = await request("/api/v1/destinations");
    assert.equal(publicList.status, 200);
    assert.ok(!publicList.body.data.items.some((d) => d.slug === destSlug));

    // 3. Admin lists destinations including drafts
    const adminList = await request(`/api/v1/admin/destinations?search=${destSlug}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminList.status, 200);
    assert.ok(adminList.body.data.items.some((d) => d.slug === destSlug));

    // 4. Admin updates destination to published
    const updateRes = await request(`/api/v1/admin/destinations/${createdDestinationId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "published" }),
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.status, "published");

    // 5. Now visible publicly
    const publicListAfter = await request("/api/v1/destinations");
    assert.ok(publicListAfter.body.data.items.some((d) => d.slug === destSlug));

    // 6. Admin archives destination
    const archiveRes = await request(`/api/v1/admin/destinations/${createdDestinationId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(archiveRes.status, 200);
    assert.equal(archiveRes.body.data.status, "archived");

    // 7. Admin restores destination
    const restoreRes = await request(`/api/v1/admin/destinations/${createdDestinationId}/restore`, {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(restoreRes.status, 200);
    assert.equal(restoreRes.body.data.status, "draft");
  });

  await t.test("A3. Activities admin CRUD", async () => {
    const actSlug = `${testPrefix}-act`;
    // 1. Create activity
    const createRes = await request("/api/v1/admin/activities", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: "Test Activity Style",
        slug: actSlug,
        description: "Thrilling activities",
        status: "draft",
      }),
    });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.data.slug, actSlug);
    createdActivityId = createRes.body.data.id;

    // 2. Admin get by ID
    const getRes = await request(`/api/v1/admin/activities/${createdActivityId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.title, "Test Activity Style");

    // 3. Admin archive activity
    const archiveRes = await request(`/api/v1/admin/activities/${createdActivityId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(archiveRes.status, 200);
    assert.equal(archiveRes.body.data.status, "archived");

    // 4. Admin restore activity
    const restoreRes = await request(`/api/v1/admin/activities/${createdActivityId}/restore`, {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(restoreRes.status, 200);
    assert.equal(restoreRes.body.data.status, "draft");

    // 5. Admin permanent delete
    const permDel = await request(`/api/v1/admin/activities/${createdActivityId}/permanent`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(permDel.status, 200);
  });

  await t.test("A4. Regions admin CRUD with child records", async () => {
    const regSlug = `${testPrefix}-reg`;
    // 1. Create region with places and experiences
    const createRes = await request("/api/v1/admin/regions", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        destination_id: createdDestinationId,
        title: "Test Region Area",
        slug: regSlug,
        subtitle: "Beautiful valleys",
        status: "draft",
        popular_places: [
          {
            source_id: `${testPrefix}-place-1`,
            name: "Summit Viewpoint",
            description: "Panoramic views",
            sort_order: 0,
            status: "draft",
          },
        ],
        experiences: [
          {
            source_id: `${testPrefix}-exp-1`,
            title: "Local Homestay",
            description: "Authentic living",
            badge: "POPULAR",
            sort_order: 0,
            status: "draft",
          },
        ],
      }),
    });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.data.slug, regSlug);
    assert.equal(createRes.body.data.popularPlaces.length, 1);
    assert.equal(createRes.body.data.experiences.length, 1);
    createdRegionId = createRes.body.data.id;

    // 2. Admin get region by ID
    const getRes = await request(`/api/v1/admin/regions/${createdRegionId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.popularPlaces[0].name, "Summit Viewpoint");
    assert.equal(getRes.body.data.experiences[0].title, "Local Homestay");

    // 3. Admin archive region
    const archiveRes = await request(`/api/v1/admin/regions/${createdRegionId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(archiveRes.status, 200);
    assert.equal(archiveRes.body.data.status, "archived");

    // 4. Admin restore region
    const restoreRes = await request(`/api/v1/admin/regions/${createdRegionId}/restore`, {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(restoreRes.status, 200);
    assert.equal(restoreRes.body.data.status, "draft");

    // 5. Admin permanent delete region
    const delReg = await request(`/api/v1/admin/regions/${createdRegionId}/permanent`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delReg.status, 200);

    // 6. Clean up destination permanently
    const delDest = await request(`/api/v1/admin/destinations/${createdDestinationId}/permanent`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delDest.status, 200);
  });
});
