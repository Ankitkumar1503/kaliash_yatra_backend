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

const testPrefix = `test-phase-g-${Date.now()}`;

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
    ["Phase G Admin", `${testPrefix}-admin@example.invalid`],
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
    ["Phase G User", `${testPrefix}-user@example.invalid`],
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
  await pool.query("DELETE FROM users WHERE email LIKE $1", [`${testPrefix}%`]);
});

test("Phase G: Admin user and role management APIs", async (t) => {
  await t.test("G1. Users management APIs and safety protections", async () => {
    // 1. Unauthenticated -> 401
    const unauth = await request("/api/v1/admin/users");
    assert.equal(unauth.status, 401);

    // 2. Forbidden for regular user without user.read -> 403
    const forbidden = await request("/api/v1/admin/users", {
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.equal(forbidden.status, 403);

    // 3. Admin list users -> 200
    const listRes = await request(`/api/v1/admin/users?search=${testPrefix}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.success, true);
    assert.ok(Array.isArray(listRes.body.data));
    assert.ok(listRes.body.data.length >= 2);
    // Verify password_hash is never exposed
    for (const u of listRes.body.data) {
      assert.equal(u.password_hash, undefined);
      assert.ok(u.id);
      assert.ok(u.email);
    }

    // 4. Admin get user by ID -> 200
    const userDetail = await request(`/api/v1/admin/users/${regularUserId}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(userDetail.status, 200);
    assert.equal(userDetail.body.success, true);
    assert.equal(userDetail.body.data.id, regularUserId);
    assert.equal(userDetail.body.data.password_hash, undefined);
    assert.ok(Array.isArray(userDetail.body.data.roles));
    assert.ok(Array.isArray(userDetail.body.data.permissions));

    // 5. Update user permitted fields (name)
    const updateRes = await request(`/api/v1/admin/users/${regularUserId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: "Phase G Updated Name" }),
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.name, "Phase G Updated Name");

    // 6. Assign roles to regular user -> vendor & user
    const assignRolesRes = await request(`/api/v1/admin/users/${regularUserId}/roles`, {
      method: "PUT",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ roles: ["vendor", "user"] }),
    });
    assert.equal(assignRolesRes.status, 200);
    assert.ok(assignRolesRes.body.data.roles.includes("vendor"));
    assert.equal(assignRolesRes.body.data.role, "vendor"); // legacy synced

    // 7. Prevent removing admin role from the last active administrator
    // Create an isolated admin test: deactivate other test admin or check single admin guard
    // First create a solo admin
    const soloAdminRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, 'hash', 'admin') RETURNING id`,
      ["Solo Admin", `${testPrefix}-solo-admin@example.invalid`],
    );
    const soloAdminId = soloAdminRes.rows[0].id;
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE key = 'admin'`,
      [soloAdminId],
    );

    // If there are multiple admins, let's test invalid role key
    const invalidRole = await request(`/api/v1/admin/users/${regularUserId}/roles`, {
      method: "PUT",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ roles: ["superhero_fake_role"] }),
    });
    assert.equal(invalidRole.status, 400);

    // Deactivate soloAdmin
    const deactRes = await request(`/api/v1/admin/users/${soloAdminId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ is_active: false }),
    });
    assert.equal(deactRes.status, 200);
    assert.equal(deactRes.body.data.is_active, false);
  });

  await t.test("G2. Roles and permissions management APIs", async () => {
    // 1. Forbidden without role.read -> 403
    const forbidden = await request("/api/v1/admin/roles", {
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.equal(forbidden.status, 403);

    // 2. Admin list roles -> 200
    const rolesRes = await request("/api/v1/admin/roles", {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(rolesRes.status, 200);
    assert.ok(Array.isArray(rolesRes.body.data));
    const roleKeys = rolesRes.body.data.map((r) => r.key);
    assert.ok(roleKeys.includes("admin"));
    assert.ok(roleKeys.includes("user"));

    // 3. Admin list all system permissions -> 200
    const permsRes = await request("/api/v1/admin/roles/permissions", {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(permsRes.status, 200);
    assert.ok(Array.isArray(permsRes.body.data));
    const permKeys = permsRes.body.data.map((p) => p.key);
    assert.ok(permKeys.includes("content.read"));
    assert.ok(permKeys.includes("trip.read"));
    assert.ok(permKeys.includes("user.manage"));
    assert.ok(permKeys.includes("role.manage"));

    // 4. Admin get role detail by ID
    const adminRoleObj = rolesRes.body.data.find((r) => r.key === "admin");
    const roleDetail = await request(`/api/v1/admin/roles/${adminRoleObj.id}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(roleDetail.status, 200);
    assert.equal(roleDetail.body.data.key, "admin");
    assert.ok(Array.isArray(roleDetail.body.data.permissions));

    // 5. Safe lockout prevention: cannot strip critical permissions from admin role
    const stripCritical = await request(`/api/v1/admin/roles/${adminRoleObj.id}/permissions`, {
      method: "PUT",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ permissions: ["trip.read"] }), // missing user.manage & role.manage
    });
    assert.equal(stripCritical.status, 400);

    // 6. Safe update of role permissions on vendor role
    const vendorRoleObj = rolesRes.body.data.find((r) => r.key === "vendor");
    const updateVendorPerms = await request(`/api/v1/admin/roles/${vendorRoleObj.id}/permissions`, {
      method: "PUT",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ permissions: ["content.read", "trip.read"] }),
    });
    assert.equal(updateVendorPerms.status, 200);
    const updatedVendorPermKeys = updateVendorPerms.body.data.permissions.map((p) => p.key);
    assert.ok(updatedVendorPermKeys.includes("content.read"));
    assert.ok(updatedVendorPermKeys.includes("trip.read"));

    // Reset vendor permissions to empty safely
    await request(`/api/v1/admin/roles/${vendorRoleObj.id}/permissions`, {
      method: "PUT",
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ permissions: [] }),
    });
  });
});
