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
let fixtureTripId;

const testPrefix = `test-phase-d-${Date.now()}`;

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
    ["Phase D Admin", `${testPrefix}-admin@example.invalid`],
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
    ["Phase D User", `${testPrefix}-user@example.invalid`],
  );
  regularUserId = userRes.rows[0].id;
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT $1, id FROM roles WHERE key = 'user' ON CONFLICT DO NOTHING`,
    [regularUserId],
  );
  userToken = generateAccessToken({ id: regularUserId, email: userRes.rows[0].email, role: "user" });

  // Destination & Trip fixture
  const destRes = await pool.query(
    `INSERT INTO destinations (slug, name, country, status)
     VALUES ($1, 'Fixture Dest D', 'Nepal', 'published') RETURNING id`,
    [`${testPrefix}-dest`],
  );
  const tripRes = await pool.query(
    `INSERT INTO trips (slug, title, destination_id, duration_days, base_price, status)
     VALUES ($1, 'Fixture Trip D', $2, 5, 500, 'published') RETURNING id`,
    [`${testPrefix}-trip`, destRes.rows[0].id],
  );
  fixtureTripId = tripRes.rows[0].id;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));

  await pool.query("DELETE FROM faqs WHERE question LIKE $1", [`${testPrefix}%`]);
  await pool.query("DELETE FROM reviews WHERE name LIKE $1", [`${testPrefix}%`]);
  if (fixtureTripId) await pool.query("DELETE FROM trips WHERE id = $1", [fixtureTripId]);
  await pool.query("DELETE FROM destinations WHERE slug = $1", [`${testPrefix}-dest`]);

  if (adminUserId) await pool.query("DELETE FROM users WHERE id = $1", [adminUserId]);
  if (regularUserId) await pool.query("DELETE FROM users WHERE id = $1", [regularUserId]);

  await pool.end();
});

test("Phase D: FAQs and Reviews admin & public APIs", async (t) => {
  let createdFaqId;
  let createdReviewId;

  await t.test("D1. FAQs admin CRUD and XOR constraint handling", async () => {
    // 1. Both trip_id and page_key fails validation (XOR violation -> 400)
    const badFaq = await request("/api/v1/admin/faqs", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        trip_id: fixtureTripId,
        page_key: "home",
        question: `${testPrefix} Both keys question`,
        answer: "Invalid XOR",
      }),
    });
    assert.equal(badFaq.status, 400);

    // 2. Neither trip_id nor page_key fails validation (400)
    const emptyFaq = await request("/api/v1/admin/faqs", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        question: `${testPrefix} No keys question`,
        answer: "Invalid XOR",
      }),
    });
    assert.equal(emptyFaq.status, 400);

    // 3. Create trip-specific FAQ
    const tripFaq = await request("/api/v1/admin/faqs", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        trip_id: fixtureTripId,
        question: `${testPrefix} What gear is required?`,
        answer: "Warm clothes and good trekking shoes.",
        sort_order: 0,
        status: "published",
      }),
    });
    assert.equal(tripFaq.status, 201);
    createdFaqId = tripFaq.body.data.id;

    // 4. Create page-level FAQ
    const pageFaq = await request("/api/v1/admin/faqs", {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        page_key: "booking-terms",
        question: `${testPrefix} What is the cancellation policy?`,
        answer: "Full refund 30 days prior.",
        sort_order: 0,
        status: "published",
      }),
    });
    assert.equal(pageFaq.status, 201);

    // 5. Admin gets FAQ by ID
    const getRes = await request(`/api/v1/admin/faqs/${createdFaqId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.question, `${testPrefix} What gear is required?`);

    // 6. Admin updates FAQ
    const updateRes = await request(`/api/v1/admin/faqs/${createdFaqId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ answer: "Updated answer" }),
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.answer, "Updated answer");

    // 7. Admin deletes FAQ
    const delRes = await request(`/api/v1/admin/faqs/${createdFaqId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delRes.status, 200);
  });

  await t.test("D2. Public review submission and admin moderation queue", async () => {
    // 1. Public submits review (POST /api/v1/reviews)
    const submitRes = await request("/api/v1/reviews", {
      method: "POST",
      body: JSON.stringify({
        trip_id: fixtureTripId,
        name: `${testPrefix} John Traveler`,
        email: `${testPrefix}-john@example.invalid`,
        location: "London, UK",
        title: "Unforgettable Experience",
        message: "The mountain guides were exceptional from day one.",
        rating: 5,
      }),
    });
    assert.equal(submitRes.status, 201);
    assert.equal(submitRes.body.data.status, "pending");
    createdReviewId = submitRes.body.data.id;

    // 2. Pending review is NOT visible on public GET /api/v1/reviews
    const publicReviews = await request(`/api/v1/reviews?trip=${testPrefix}-trip`);
    assert.equal(publicReviews.status, 200);
    assert.ok(!publicReviews.body.data.items.some((r) => r.id === createdReviewId));

    // 3. Admin lists reviews (includes pending review and reveals email for moderation)
    const adminReviews = await request(`/api/v1/admin/reviews?status=pending`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminReviews.status, 200);
    const found = adminReviews.body.data.items.find((r) => String(r.id) === String(createdReviewId));
    assert.ok(found);
    assert.equal(found.email, `${testPrefix}-john@example.invalid`);

    // 4. Admin approves review (PATCH /api/v1/admin/reviews/:id)
    const approveRes = await request(`/api/v1/admin/reviews/${createdReviewId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "approved" }),
    });
    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.body.data.status, "approved");

    // 5. Approved review is now visible on public GET /api/v1/reviews
    const publicReviewsAfter = await request(`/api/v1/reviews?trip=${testPrefix}-trip`);
    assert.ok(publicReviewsAfter.body.data.items.some((r) => String(r.id) === String(createdReviewId)));

    // 6. Assert public response does NOT expose email
    assert.equal(JSON.stringify(publicReviewsAfter.body).includes("@example.invalid"), false);

    // 7. Admin archives/hides review
    const hideRes = await request(`/api/v1/admin/reviews/${createdReviewId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(hideRes.status, 200);

    // 8. Admin permanently deletes review
    const permDel = await request(`/api/v1/admin/reviews/${createdReviewId}/permanent`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(permDel.status, 200);
  });
});
