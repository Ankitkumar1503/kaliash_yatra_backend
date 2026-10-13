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

const testPrefix = `test-phase-f-${Date.now()}`;

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
    ["Phase F Admin", `${testPrefix}-admin@example.invalid`],
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
    ["Phase F User", `${testPrefix}-user@example.invalid`],
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

  await pool.query("DELETE FROM inquiries WHERE email LIKE $1", [`${testPrefix}%`]);
  await pool.query("DELETE FROM newsletter_subscribers WHERE email LIKE $1", [`${testPrefix}%`]);

  if (adminUserId) await pool.query("DELETE FROM users WHERE id = $1", [adminUserId]);
  if (regularUserId) await pool.query("DELETE FROM users WHERE id = $1", [regularUserId]);

  await pool.end();
});

test("Phase F: Inquiries and Newsletter public writes & admin management APIs", async (t) => {
  let createdInquiryId;
  let createdSubscriberId;

  await t.test("F1. Inquiries public submission and admin management", async () => {
    // 1. Public submits inquiry (POST /api/v1/inquiries)
    const inquiryRes = await request("/api/v1/inquiries", {
      method: "POST",
      body: JSON.stringify({
        type: "contact",
        name: "Test Traveler",
        email: `${testPrefix}-traveler@example.invalid`,
        phone: "+977-9800000000",
        message: "Interested in the 14-day Kailash Yatra package next May.",
      }),
    });
    assert.equal(inquiryRes.status, 201);
    assert.equal(inquiryRes.body.data.status, "new");
    createdInquiryId = inquiryRes.body.data.id;

    // 2. Unauthenticated admin access gets 401
    const anon = await request("/api/v1/admin/inquiries");
    assert.equal(anon.status, 401);

    // 3. User without inquiry.read gets 403
    const forbidden = await request("/api/v1/admin/inquiries", {
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.equal(forbidden.status, 403);

    // 4. Admin lists inquiries
    const adminList = await request("/api/v1/admin/inquiries?status=new", {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminList.status, 200);
    assert.ok(adminList.body.data.items.some((i) => String(i.id) === String(createdInquiryId)));

    // 5. Admin gets inquiry by ID
    const getRes = await request(`/api/v1/admin/inquiries/${createdInquiryId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.name, "Test Traveler");

    // 6. Admin updates inquiry status to in_progress
    const updateRes = await request(`/api/v1/admin/inquiries/${createdInquiryId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "in_progress" }),
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.status, "in_progress");

    // 7. Admin deletes inquiry
    const delRes = await request(`/api/v1/admin/inquiries/${createdInquiryId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delRes.status, 200);
  });

  await t.test("F2. Newsletter public subscription and admin management", async () => {
    const subEmail = `${testPrefix}-sub@example.invalid`;

    // 1. Public subscribes to newsletter (POST /api/v1/newsletter/subscribe)
    const subRes = await request("/api/v1/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({ email: subEmail }),
    });
    assert.equal(subRes.status, 200);
    assert.equal(subRes.body.data.status, "active");
    createdSubscriberId = subRes.body.data.id;

    // 2. Duplicate subscription is safe/idempotent
    const dupRes = await request("/api/v1/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({ email: subEmail }),
    });
    assert.equal(dupRes.status, 200);
    assert.equal(dupRes.body.data.status, "active");

    // 3. Admin lists subscribers
    const adminList = await request("/api/v1/admin/newsletter?status=active", {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminList.status, 200);
    assert.ok(adminList.body.data.items.some((s) => s.email === subEmail));

    // 4. Admin updates subscriber to unsubscribed
    const unsubsRes = await request(`/api/v1/admin/newsletter/${createdSubscriberId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "unsubscribed" }),
    });
    assert.equal(unsubsRes.status, 200);
    assert.equal(unsubsRes.body.data.status, "unsubscribed");

    // 5. Admin deletes subscriber
    const delRes = await request(`/api/v1/admin/newsletter/${createdSubscriberId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delRes.status, 200);
  });
});
