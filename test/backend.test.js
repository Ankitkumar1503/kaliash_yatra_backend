import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
import pool from "../src/config/db.js";

let server;
let baseUrl;
let userCountBefore;
let testEmail;
let registeredUserId;
let token;

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...options.headers },
  });
  const body = await response.json();
  return { response, body };
};

before(async () => {
  const result = await pool.query("SELECT count(*)::int AS count FROM users");
  userCountBefore = result.rows[0].count;
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  testEmail = `codex-test-${Date.now()}-${Math.random().toString(16).slice(2)}@example.invalid`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (testEmail) await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
  const result = await pool.query("SELECT count(*)::int AS count FROM users");
  assert.equal(result.rows[0].count, userCountBefore, "temporary test account cleanup preserves the existing user count");
  await pool.end();
});

test("authentication, validation, live RBAC, and database constraints", async (t) => {
  await t.test("health, validation, registration, duplicate handling, and login", async () => {
    const health = await request("/health");
    assert.equal(health.response.status, 200);

    const invalid = await request("/api/v1/register", {
      method: "POST",
      body: JSON.stringify({ name: "", email: "bad", password: "short" }),
    });
    assert.equal(invalid.response.status, 400);
    assert.equal(invalid.body.success, false);
    assert.ok(invalid.body.errors.length > 0);

    const registration = await request("/api/v1/register", {
      method: "POST",
      body: JSON.stringify({ name: "API Test", email: testEmail.toUpperCase(), password: "safe-test-pass-123" }),
    });
    assert.equal(registration.response.status, 201);
    assert.equal(registration.body.data.email, testEmail);
    assert.equal("password_hash" in registration.body.data, false);
    registeredUserId = registration.body.data.id;

    const duplicate = await request("/api/v1/register", {
      method: "POST",
      body: JSON.stringify({ name: "API Test", email: testEmail, password: "safe-test-pass-123" }),
    });
    assert.equal(duplicate.response.status, 409);

    const badLogin = await request("/api/v1/login", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: "wrong-password" }),
    });
    assert.equal(badLogin.response.status, 401);

    const login = await request("/api/v1/login", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: "safe-test-pass-123" }),
    });
    assert.equal(login.response.status, 200);
    token = login.body.token;
    assert.ok(token);
    assert.equal("password_hash" in login.body.user, false);
  });

  await t.test("authentication and permissions use current database grants", async () => {
    const anonymous = await request("/api/v1/auth/me");
    assert.equal(anonymous.response.status, 401);

    const me = await request("/api/v1/auth/me", { headers: { authorization: `Bearer ${token}` } });
    assert.equal(me.response.status, 200, JSON.stringify(me.body));
    assert.deepEqual(me.body.data.roles, ["user"]);
    assert.deepEqual(me.body.data.permissions, []);

    const denied = await request("/api/v1/admin/permissions", { headers: { authorization: `Bearer ${token}` } });
    assert.equal(denied.response.status, 403);

    await pool.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE key = 'admin' ON CONFLICT DO NOTHING`,
      [registeredUserId],
    );
    const allowed = await request("/api/v1/admin/permissions", { headers: { authorization: `Bearer ${token}` } });
    assert.equal(allowed.response.status, 200);
    assert.ok(allowed.body.data.includes("role.read"));
  });

  await t.test("RBAC seeds and database constraints are present", async () => {
    const seed = await pool.query(`
      SELECT r.key AS role, count(rp.permission_id)::int AS permission_count
      FROM roles r LEFT JOIN role_permissions rp ON rp.role_id = r.id
      GROUP BY r.key ORDER BY r.key
    `);
    assert.deepEqual(seed.rows.map((row) => row.role), ["admin", "user", "vendor"]);
    assert.ok(seed.rows.find((row) => row.role === "admin").permission_count > 0);
    assert.equal(seed.rows.find((row) => row.role === "user").permission_count, 0);
    assert.equal(seed.rows.find((row) => row.role === "vendor").permission_count, 0);

    await assert.rejects(
      pool.query(`INSERT INTO reviews (name, email, message, rating) VALUES ('Test', 'test@example.invalid', 'Bad rating', 6)`),
      (error) => error.code === "23514",
    );
    await assert.rejects(
      pool.query(`INSERT INTO trip_highlights (trip_id, text, sort_order) VALUES (9223372036854775000, 'orphan', 0)`),
      (error) => error.code === "23503",
    );

    const migrations = await pool.query("SELECT name FROM schema_migrations ORDER BY name");
    assert.deepEqual(migrations.rows.map((row) => row.name), [
      "001_core_schema.sql",
      "002_trip_region_destination_consistency.sql",
      "003_region_children_and_review_email_optional.sql",
      "004_trip_display_area.sql",
      "005_content_source_ids.sql",
    ]);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const slug = `test-destination-${Date.now()}`;
      await client.query("INSERT INTO destinations (slug, name, country) VALUES ($1, 'Test', 'Test')", [slug]);
      await assert.rejects(
        client.query("INSERT INTO destinations (slug, name, country) VALUES ($1, 'Duplicate', 'Test')", [slug]),
        (error) => error.code === "23505",
      );
      await client.query("ROLLBACK");
    } finally {
      client.release();
    }

    const emailClient = await pool.connect();
    try {
      await emailClient.query("BEGIN");
      await emailClient.query("INSERT INTO newsletter_subscribers (email) VALUES ('TEST-UNIQUE@example.invalid')");
      await assert.rejects(
        emailClient.query("INSERT INTO newsletter_subscribers (email) VALUES ('test-unique@example.invalid')"),
        (error) => error.code === "23505",
      );
      await emailClient.query("ROLLBACK");
    } finally {
      emailClient.release();
    }
  });

  await t.test("auth rate limit and explicit CORS rejection", async () => {
    const statuses = [];
    for (let index = 0; index < 6; index += 1) {
      const result = await request("/api/v1/login", {
        method: "POST",
        body: JSON.stringify({ email: `missing-${index}@example.invalid`, password: "not-a-real-password" }),
      });
      statuses.push(result.response.status);
    }
    assert.ok(statuses.includes(429), `expected auth limiter to return 429, received ${statuses.join(",")}`);

    const writeStatuses = [];
    for (let index = 0; index < 21; index += 1) {
      const result = await request("/api/v1/inquiries", {
        method: "POST",
        body: JSON.stringify({}),
      });
      writeStatuses.push(result.response.status);
    }
    assert.equal(writeStatuses.at(-1), 429);

    const cors = await fetch(`${baseUrl}/health`, { headers: { origin: "https://not-allowed.invalid" } });
    assert.equal(cors.status, 403);
  });

  await t.test("unknown routes return the standard not-found response", async () => {
    const missing = await request("/api/v1/not-a-route");
    assert.equal(missing.response.status, 404);
    assert.equal(missing.body.success, false);
    assert.ok(Array.isArray(missing.body.errors));
  });
});
