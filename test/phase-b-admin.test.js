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
let fixtureDestinationId;
let fixtureRegionId;
let fixtureActivityId;
let fixtureCategoryId;
let fixtureMediaId;

const testPrefix = `test-phase-b-${Date.now()}`;

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
    ["Phase B Admin", `${testPrefix}-admin@example.invalid`],
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
    ["Phase B User", `${testPrefix}-user@example.invalid`],
  );
  regularUserId = userRes.rows[0].id;
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT $1, id FROM roles WHERE key = 'user' ON CONFLICT DO NOTHING`,
    [regularUserId],
  );
  userToken = generateAccessToken({ id: regularUserId, email: userRes.rows[0].email, role: "user" });

  // Create prerequisite fixtures: media, destination, region, activity, category
  const mediaRes = await pool.query(
    `INSERT INTO media_assets (storage_key, public_url, media_type, alt_text)
     VALUES ($1, $2, 'image/jpeg', 'Test Media') RETURNING id`,
    [`${testPrefix}-media`, `https://example.invalid/${testPrefix}.jpg`],
  );
  fixtureMediaId = mediaRes.rows[0].id;

  const destRes = await pool.query(
    `INSERT INTO destinations (slug, name, country, status)
     VALUES ($1, 'Fixture Dest', 'Nepal', 'published') RETURNING id`,
    [`${testPrefix}-dest`],
  );
  fixtureDestinationId = destRes.rows[0].id;

  const regRes = await pool.query(
    `INSERT INTO regions (destination_id, slug, title, status)
     VALUES ($1, $2, 'Fixture Reg', 'published') RETURNING id`,
    [fixtureDestinationId, `${testPrefix}-reg`],
  );
  fixtureRegionId = regRes.rows[0].id;

  const actRes = await pool.query(
    `INSERT INTO activities (slug, title, status)
     VALUES ($1, 'Fixture Act', 'published') RETURNING id`,
    [`${testPrefix}-act`],
  );
  fixtureActivityId = actRes.rows[0].id;

  const catRes = await pool.query(
    `INSERT INTO trip_categories (slug, name, status)
     VALUES ($1, 'Fixture Cat', 'active') RETURNING id`,
    [`${testPrefix}-cat`],
  );
  fixtureCategoryId = catRes.rows[0].id;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));

  // Clean up trips and child records
  await pool.query("DELETE FROM faqs WHERE trip_id IN (SELECT id FROM trips WHERE slug LIKE $1)", [`${testPrefix}%`]);
  await pool.query("DELETE FROM trip_exclusions WHERE trip_id IN (SELECT id FROM trips WHERE slug LIKE $1)", [`${testPrefix}%`]);
  await pool.query("DELETE FROM trip_inclusions WHERE trip_id IN (SELECT id FROM trips WHERE slug LIKE $1)", [`${testPrefix}%`]);
  await pool.query("DELETE FROM trip_highlights WHERE trip_id IN (SELECT id FROM trips WHERE slug LIKE $1)", [`${testPrefix}%`]);
  await pool.query("DELETE FROM trip_itinerary_days WHERE trip_id IN (SELECT id FROM trips WHERE slug LIKE $1)", [`${testPrefix}%`]);
  await pool.query("DELETE FROM trip_images WHERE trip_id IN (SELECT id FROM trips WHERE slug LIKE $1)", [`${testPrefix}%`]);
  await pool.query("DELETE FROM trips WHERE slug LIKE $1", [`${testPrefix}%`]);

  // Clean up fixtures
  if (fixtureRegionId) await pool.query("DELETE FROM regions WHERE id = $1", [fixtureRegionId]);
  if (fixtureDestinationId) await pool.query("DELETE FROM destinations WHERE id = $1", [fixtureDestinationId]);
  if (fixtureActivityId) await pool.query("DELETE FROM activities WHERE id = $1", [fixtureActivityId]);
  if (fixtureCategoryId) await pool.query("DELETE FROM trip_categories WHERE id = $1", [fixtureCategoryId]);
  if (fixtureMediaId) await pool.query("DELETE FROM media_assets WHERE id = $1", [fixtureMediaId]);

  if (adminUserId) await pool.query("DELETE FROM users WHERE id = $1", [adminUserId]);
  if (regularUserId) await pool.query("DELETE FROM users WHERE id = $1", [regularUserId]);

  await pool.end();
});

test("Phase B: Trips and related child records admin CRUD APIs", async (t) => {
  let createdTripId;
  const tripSlug = `${testPrefix}-trip`;

  await t.test("Authorization & validation gates", async () => {
    // 1. Unauthenticated gets 401
    const anon = await request("/api/v1/admin/trips");
    assert.equal(anon.status, 401);

    // 2. Regular user without trip.read gets 403
    const forbidden = await request("/api/v1/admin/trips", {
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.equal(forbidden.status, 403);

    // 3. Invalid payload (missing required fields like base_price, duration_days) gets 400
    const invalid = await request("/api/v1/admin/trips", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ title: "Incomplete Trip" }),
    });
    assert.equal(invalid.status, 400);

    // 4. Sale price > base price returns 400
    const badPrice = await request("/api/v1/admin/trips", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: "Bad Price Trip",
        destination_id: fixtureDestinationId,
        duration_days: 5,
        base_price: 500,
        sale_price: 600,
      }),
    });
    assert.equal(badPrice.status, 400);
  });

  await t.test("Admin creates trip with complete nested child records", async () => {
    const createRes = await request("/api/v1/admin/trips", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: "Annapurna Sanctuary Trek",
        slug: tripSlug,
        code: `${testPrefix}-CODE`,
        short_description: "Scenic trek into the sanctuary",
        full_description: "Full description of the trek across rhododendron forests.",
        destination_id: fixtureDestinationId,
        region_id: fixtureRegionId,
        activity_id: fixtureActivityId,
        category_id: fixtureCategoryId,
        duration_days: 10,
        duration_nights: 9,
        difficulty: "moderate",
        max_altitude_m: 4130,
        max_altitude_label: "4,130 m (Sanctuary)",
        min_group_size: 2,
        max_group_size: 14,
        start_location: "Pokhara",
        end_location: "Pokhara",
        best_season: "Spring, Autumn",
        base_price: 1200,
        sale_price: 999,
        currency: "USD",
        featured: true,
        badge: "BESTSELLER",
        status: "draft",
        hero_media_id: fixtureMediaId,
        display_area: "Annapurna Base Camp",
        images: [
          {
            media_id: fixtureMediaId,
            alt_text: "Mountain view",
            sort_order: 0,
            is_hero: true,
          },
        ],
        itinerary: [
          {
            day_number: 1,
            title: "Arrival in Pokhara",
            description: "Drive to Nayapul and trek to Tikhedhunga.",
            altitude: "1,540 m",
            trekking_time: "4-5 hours",
            accommodation: "Teahouse",
            sort_order: 0,
          },
          {
            day_number: 2,
            title: "Trek to Ghorepani",
            description: "Ascend through Ulleri stone steps.",
            altitude: "2,860 m",
            trekking_time: "6 hours",
            accommodation: "Guesthouse",
            sort_order: 1,
          },
        ],
        highlights: [
          "Panoramic sunrise from Poon Hill",
          "360-degree amphitheater of peaks at ABC",
        ],
        inclusions: [
          "All teahouse accommodation during trek",
          "TIMS and ACAP permits",
        ],
        exclusions: [
          "Personal travel insurance",
          "Tips for guide and porter",
        ],
        faqs: [
          {
            question: "Is acute mountain sickness common on this trek?",
            answer: "The ascent profile is gradual, minimizing risk.",
            sort_order: 0,
            status: "published",
          },
        ],
      }),
    });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.data.slug, tripSlug);
    assert.equal(createRes.body.data.images.length, 1);
    assert.equal(createRes.body.data.itinerary.length, 2);
    assert.equal(createRes.body.data.highlights.length, 2);
    assert.equal(createRes.body.data.inclusions.length, 2);
    assert.equal(createRes.body.data.exclusions.length, 2);
    assert.equal(createRes.body.data.faqs.length, 1);
    createdTripId = createRes.body.data.id;
  });

  await t.test("Admin reads, updates, publishes, archives, and deletes trip", async () => {
    // 1. Admin gets trip detail by ID
    const getRes = await request(`/api/v1/admin/trips/${createdTripId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.title, "Annapurna Sanctuary Trek");
    assert.equal(getRes.body.data.itinerary[0].dayNumber, 1);

    // 2. Draft is not visible publicly
    const publicList = await request("/api/v1/trips");
    assert.equal(publicList.status, 200);
    assert.ok(!publicList.body.data.items.some((t) => t.slug === tripSlug));

    // 3. Admin updates trip to published
    const updateRes = await request(`/api/v1/admin/trips/${createdTripId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "published" }),
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.status, "published");

    // 4. Now visible on public GET /trips
    const publicListAfter = await request("/api/v1/trips");
    assert.ok(publicListAfter.body.data.items.some((t) => t.slug === tripSlug));

    // 5. Admin archives trip
    const archiveRes = await request(`/api/v1/admin/trips/${createdTripId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(archiveRes.status, 200);
    assert.equal(archiveRes.body.data.status, "archived");

    // 6. Admin restores trip
    const restoreRes = await request(`/api/v1/admin/trips/${createdTripId}/restore`, {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(restoreRes.status, 200);
    assert.equal(restoreRes.body.data.status, "draft");

    // 7. Admin permanent delete
    const permDel = await request(`/api/v1/admin/trips/${createdTripId}/permanent`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(permDel.status, 200);
  });
});
