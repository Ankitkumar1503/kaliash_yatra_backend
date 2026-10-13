# Mission Nepal Holidays Backend

Node.js 20 / Express 5 REST API using PostgreSQL through `pg` with ES Modules. Content Management System (CMS) admin APIs and public website APIs share one unified PostgreSQL source of truth.

---

## 1. Requirements

- Node.js 20 or later
- Docker Desktop / Docker Engine with Compose
- PostgreSQL 17 (via Docker Compose or local instance)

---

## 2. Setup & Running

1. Copy `.env.example` to `.env` and set private database connection settings and a strong JWT secret. Never commit `.env`.
2. Start PostgreSQL with `docker compose up -d db`.
3. Install dependencies:
   ```bash
   npm ci
   ```
4. Apply additive database migrations:
   ```bash
   npm run db:migrate
   ```
5. Seed default trip categories (optional, idempotent):
   ```bash
   npm run db:seed-categories
   # or: node scripts/seed-trip-categories.js
   ```
6. Start the API server:
   ```bash
   npm run dev    # Development with nodemon
   npm start      # Production
   ```
7. Run the test suite:
   ```bash
   npm test
   ```

---

## 3. Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP server port | `5000` |
| `DB_HOST` | PostgreSQL hostname | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | PostgreSQL database name | `chaiDB` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | - |
| `DB_POOL_MAX` | Max active connection pool clients | `10` |
| `DB_IDLE_TIMEOUT_MS` | Idle client timeout | `30000` |
| `DB_CONNECTION_TIMEOUT_MS` | Connection timeout | `5000` |
| `DB_SSL` | Enable TLS for PostgreSQL | `false` |
| `JWT_ACCESS_SECRET` | HS256 secret for signing access tokens | - |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifetime (e.g. `15m`, `1d`) | `15m` |
| `PUBLIC_WEB_ORIGIN` | Public website CORS origin | `http://localhost:3000` |
| `CMS_WEB_ORIGIN` | CMS admin panel CORS origin | `http://localhost:5173` |
| `CORS_ALLOWED_ORIGINS` | Additional allowed origins (comma-separated) | - |
| `AUTH_RATE_LIMIT` | Auth attempts limit per 15 mins | `10` |
| `PUBLIC_WRITE_RATE_LIMIT` | Rate limit for public writes (reviews, inquiries, newsletter) | `10` |

---

## 4. Security & RBAC Architecture

### Granular Permission Keys (26 keys)
- **Reference Content**: `content.read`, `content.create`, `content.update`, `content.delete`
- **Trips**: `trip.read`, `trip.create`, `trip.update`, `trip.delete`
- **Blogs**: `blog.read`, `blog.create`, `blog.update`, `blog.delete`
- **Reviews**: `review.read`, `review.moderate`
- **Inquiries**: `inquiry.read`, `inquiry.update`
- **Newsletter**: `newsletter.read`, `newsletter.manage`
- **Media**: `media.read`, `media.create`, `media.update`, `media.delete`
- **Users**: `user.read`, `user.manage`
- **Roles**: `role.read`, `role.manage`

### Admin Authorization
All CMS endpoints are mounted under `/api/v1/admin` and require:
1. `requireAuth`: Valid JWT Bearer token and active user (`is_active = true`).
2. `requirePermission(...)`: User's live database RBAC assignments must include the required permission key(s).

### Privacy & Privilege Protections
- Passwords are never returned in responses.
- Public review endpoints never expose reviewer email addresses (`email` is excluded or null).
- Public registration (`POST /api/v1/register`) always assigns the default `'user'` role; privilege escalation is strictly prohibited.
- Deactivating the last active administrator or stripping `'admin'` role from the last active administrator is strictly blocked (HTTP 400).

---

## 5. API Reference

All successful responses follow the standard JSON envelope:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "pagination": { ... } // (when paginated)
}
```

### Phase A: Reference Content

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/trip-categories` | *Public* | List active trip categories |
| `GET` | `/api/v1/admin/trip-categories` | `content.read` | Admin list trip categories (supports `search`, `status`) |
| `GET` | `/api/v1/admin/trip-categories/:id` | `content.read` | Admin get trip category detail |
| `POST` | `/api/v1/admin/trip-categories` | `content.create` | Create trip category |
| `PATCH` | `/api/v1/admin/trip-categories/:id` | `content.update` | Update trip category |
| `DELETE` | `/api/v1/admin/trip-categories/:id` | `content.delete` | Delete trip category (guards FK references) |
| `GET` | `/api/v1/admin/destinations` | `content.read` | Admin list destinations (`page`, `limit`, `search`, `status`, `country`) |
| `GET` | `/api/v1/admin/destinations/:id` | `content.read` | Admin get destination detail |
| `POST` | `/api/v1/admin/destinations` | `content.create` | Create destination |
| `PATCH` | `/api/v1/admin/destinations/:id` | `content.update` | Update destination (`status`: draft, published, archived) |
| `DELETE` | `/api/v1/admin/destinations/:id` | `content.delete` | Archive destination (`status = 'archived'`, `deleted_at = now()`) |
| `GET` | `/api/v1/admin/activities` | `content.read` | Admin list activities (`page`, `limit`, `search`, `status`) |
| `GET` | `/api/v1/admin/activities/:id` | `content.read` | Admin get activity detail |
| `POST` | `/api/v1/admin/activities` | `content.create` | Create activity |
| `PATCH` | `/api/v1/admin/activities/:id` | `content.update` | Update activity |
| `DELETE` | `/api/v1/admin/activities/:id` | `content.delete` | Archive activity |
| `GET` | `/api/v1/admin/regions` | `content.read` | Admin list regions (`page`, `limit`, `search`, `status`, `destination_id`) |
| `GET` | `/api/v1/admin/regions/:id` | `content.read` | Admin get region with popular places and experiences |
| `POST` | `/api/v1/admin/regions` | `content.create` | Create region with nested popular places & experiences |
| `PATCH` | `/api/v1/admin/regions/:id` | `content.update` | Update region and replace popular places / experiences |
| `DELETE` | `/api/v1/admin/regions/:id` | `content.delete` | Archive region |

---

### Phase B: Trips & Child Records

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/trips` | `trip.read` | Admin list trips (`page`, `limit`, `search`, `status`, `destination_id`, `category_id`, etc.) |
| `GET` | `/api/v1/admin/trips/:id` | `trip.read` | Admin get trip with all child records (images, itinerary, highlights, inclusions, exclusions, FAQs) |
| `POST` | `/api/v1/admin/trips` | `trip.create` | Create trip with complete nested child records in a single transaction |
| `PATCH` | `/api/v1/admin/trips/:id` | `trip.update` | Update trip and replace child record collections |
| `DELETE` | `/api/v1/admin/trips/:id` | `trip.delete` | Archive trip (`status = 'archived'`, `deleted_at = now()`) |

**Validation Highlights**:
- Checks composite foreign key `(destination_id, region_id)` against `regions(destination_id, id)`.
- Validates `sale_price <= base_price`.
- Itinerary days, highlights, inclusions, and exclusions maintain strict sequential `sort_order`.

---

### Phase C: Blogs & Blog Categories

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/blog-categories` | `content.read` | Admin list blog categories |
| `GET` | `/api/v1/admin/blog-categories/:id` | `content.read` | Admin get blog category detail |
| `POST` | `/api/v1/admin/blog-categories` | `content.create` | Create blog category |
| `PATCH` | `/api/v1/admin/blog-categories/:id` | `content.update` | Update blog category |
| `DELETE` | `/api/v1/admin/blog-categories/:id` | `content.delete` | Delete blog category (guards assigned blogs) |
| `GET` | `/api/v1/admin/blogs` | `blog.read` | Admin list blogs (`page`, `limit`, `search`, `status`, `category_id`) |
| `GET` | `/api/v1/admin/blogs/:id` | `blog.read` | Admin get blog with ordered sections & paragraphs |
| `POST` | `/api/v1/admin/blogs` | `blog.create` | Create blog with nested sections & paragraphs |
| `PATCH` | `/api/v1/admin/blogs/:id` | `blog.update` | Update blog with nested sections & paragraphs |
| `DELETE` | `/api/v1/admin/blogs/:id` | `blog.delete` | Archive blog |

---

### Phase D: FAQs & Reviews

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/faqs` | `content.read` | Admin list FAQs (`page`, `limit`, `search`, `status`, `page_key`, `trip_id`) |
| `GET` | `/api/v1/admin/faqs/:id` | `content.read` | Admin get FAQ detail |
| `POST` | `/api/v1/admin/faqs` | `content.create` | Create FAQ (enforces database XOR: trip_id OR page_key) |
| `PATCH` | `/api/v1/admin/faqs/:id` | `content.update` | Update FAQ |
| `DELETE` | `/api/v1/admin/faqs/:id` | `content.delete` | Delete FAQ |
| `POST` | `/api/v1/reviews` | *Public* | Submit customer review (default status: `pending`, rate-limited) |
| `GET` | `/api/v1/admin/reviews` | `review.read` | Admin list reviews (`page`, `limit`, `status`, `trip_id`) |
| `GET` | `/api/v1/admin/reviews/:id` | `review.read` | Admin get review detail |
| `PATCH` | `/api/v1/admin/reviews/:id` | `review.moderate` | Moderate review (`status`: `pending`, `approved`, `rejected`, `hidden`) |
| `DELETE` | `/api/v1/admin/reviews/:id` | `review.moderate` | Soft-delete review (`deleted_at = now()`) |

---

### Phase E: Media Library & Gallery

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/media` | `media.read` | List media library metadata (`page`, `limit`, `search`, `media_type`) |
| `GET` | `/api/v1/admin/media/:id` | `media.read` | Get media metadata |
| `POST` | `/api/v1/admin/media` | `media.create` | Create media asset record |
| `PATCH` | `/api/v1/admin/media/:id` | `media.update` | Update media asset metadata (`alt_text`, `width`, `height`, etc.) |
| `DELETE` | `/api/v1/admin/media/:id` | `media.delete` | Delete media metadata (guards 8 referencing tables; returns 409 if referenced) |
| `GET` | `/api/v1/admin/gallery` | `content.read` | Admin list gallery items (`page`, `limit`, `status`, `trip_id`, `blog_id`) |
| `GET` | `/api/v1/admin/gallery/:id` | `content.read` | Admin get gallery item detail |
| `POST` | `/api/v1/admin/gallery` | `content.create` | Create gallery item |
| `PATCH` | `/api/v1/admin/gallery/:id` | `content.update` | Update gallery item |
| `DELETE` | `/api/v1/admin/gallery/:id` | `content.delete` | Archive gallery item |

*Note on Media Uploads*: In this phase, media management manages database metadata (`storage_key`, `public_url`, dimensions, etc.). File binary uploads require an external storage provider (S3 / Cloudflare R2 / local uploads folder) which can easily hook into `storage_key`.

---

### Phase F: Inquiries & Newsletter

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `POST` | `/api/v1/inquiries` | *Public* | Submit customer inquiry (rate-limited) |
| `GET` | `/api/v1/admin/inquiries` | `inquiry.read` | Admin list inquiries (`page`, `limit`, `search`, `status`, `inquiry_type`) |
| `GET` | `/api/v1/admin/inquiries/:id` | `inquiry.read` | Admin get inquiry detail |
| `PATCH` | `/api/v1/admin/inquiries/:id` | `inquiry.update` | Update inquiry status (`new`, `in_progress`, `resolved`, `closed`, `spam`) |
| `POST` | `/api/v1/newsletter/subscribe` | *Public* | Subscribe to newsletter (idempotent, safely activates or re-subscribes) |
| `GET` | `/api/v1/admin/newsletter` | `newsletter.read` | Admin list subscribers (`page`, `limit`, `search`, `status`) |
| `PATCH` | `/api/v1/admin/newsletter/:id` | `newsletter.manage` | Update subscription status (`active`, `unsubscribed`) |

---

### Phase G: Admin User & Role Management

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/users` | `user.read` | Admin list users (`page`, `limit`, `search`, `role`, `is_active`) |
| `GET` | `/api/v1/admin/users/:id` | `user.read` | Admin get user profile with assigned roles and permissions |
| `PATCH` | `/api/v1/admin/users/:id` | `user.manage` | Update user name or active status (protects last active admin) |
| `PUT` | `/api/v1/admin/users/:id/roles` | `user.manage` | Assign roles (`roles: ['admin', ...]`), syncs legacy `users.role` |
| `GET` | `/api/v1/admin/roles` | `role.read` | List system roles with permission counts |
| `GET` | `/api/v1/admin/roles/permissions` | `role.read` | List all 26 available system permissions |
| `GET` | `/api/v1/admin/roles/:id` | `role.read` | Get role detail with assigned permissions |
| `PUT` | `/api/v1/admin/roles/:id/permissions` | `role.manage` | Update role permissions (prevents lockout on admin role) |

---

## 6. Testing

The backend test suite covers 100% of the CMS modules and public contracts:
```bash
npm test
```
All 9 test suites execute sequentially with test isolation:
1. `backend.test.js`: Core auth, rate limit, CORS, and database constraints.
2. `phase-a-admin.test.js`: Trip categories, destinations, activities, and regions.
3. `phase-b-admin.test.js`: Trips with nested child records (images, itinerary, FAQs, etc.).
4. `phase-c-admin.test.js`: Blogs with sections & paragraphs, and blog categories.
5. `phase-d-admin.test.js`: FAQs with XOR check and public review moderation.
6. `phase-e-admin.test.js`: Media metadata with foreign key guards and gallery items.
7. `phase-f-admin.test.js`: Public inquiries & newsletter subscribe and admin management.
8. `phase-g-admin.test.js`: User management, role assignments, last-admin lockout protections.
9. `public-content.test.js`: Public read APIs, privacy guarantees, published-only status filtering.
