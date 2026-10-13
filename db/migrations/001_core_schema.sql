-- Additive core schema. Existing users and user_role objects remain unchanged.

CREATE TABLE roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX user_roles_role_id_idx ON user_roles(role_id);

CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX role_permissions_permission_id_idx ON role_permissions(permission_id);

INSERT INTO roles (key, name, description) VALUES
    ('user', 'User', 'Standard account with no CMS permissions.'),
    ('vendor', 'Vendor', 'Vendor account; permissions remain disabled until vendor features are implemented.'),
    ('admin', 'Administrator', 'Full content-management access.');

INSERT INTO permissions (key, description) VALUES
    ('content.read', 'Read managed website content.'),
    ('content.create', 'Create managed website content.'),
    ('content.update', 'Update managed website content.'),
    ('content.delete', 'Delete or archive managed website content.'),
    ('trip.read', 'Read trips.'),
    ('trip.create', 'Create trips.'),
    ('trip.update', 'Update trips.'),
    ('trip.delete', 'Delete or archive trips.'),
    ('blog.read', 'Read blogs.'),
    ('blog.create', 'Create blogs.'),
    ('blog.update', 'Update blogs.'),
    ('blog.delete', 'Delete or archive blogs.'),
    ('review.read', 'Read reviews including moderation queue.'),
    ('review.moderate', 'Moderate reviews.'),
    ('inquiry.read', 'Read enquiries.'),
    ('inquiry.update', 'Update enquiry status and assignment.'),
    ('newsletter.read', 'Read newsletter subscribers.'),
    ('newsletter.manage', 'Manage newsletter subscriptions.'),
    ('media.read', 'Read media metadata.'),
    ('media.create', 'Create media metadata.'),
    ('media.update', 'Update media metadata.'),
    ('media.delete', 'Delete media metadata.'),
    ('user.read', 'Read user accounts.'),
    ('user.manage', 'Manage user accounts.'),
    ('role.read', 'Read roles and permissions.'),
    ('role.manage', 'Manage roles and permissions.');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users AS u
JOIN roles AS r ON r.key = u.role::text
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles AS r
CROSS JOIN permissions AS p
WHERE r.key = 'admin'
ON CONFLICT DO NOTHING;

CREATE TABLE media_assets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    storage_key TEXT NOT NULL UNIQUE,
    public_url TEXT NOT NULL,
    media_type VARCHAR(80) NOT NULL,
    alt_text TEXT,
    width INTEGER CHECK (width IS NULL OR width > 0),
    height INTEGER CHECK (height IS NULL OR height > 0),
    file_size BIGINT CHECK (file_size IS NULL OR file_size >= 0),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX media_assets_created_by_idx ON media_assets(created_by);

CREATE TABLE destinations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(180) NOT NULL UNIQUE,
    name VARCHAR(180) NOT NULL,
    country VARCHAR(120) NOT NULL,
    tagline TEXT NOT NULL DEFAULT '',
    short_description TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    hero_media_id BIGINT REFERENCES media_assets(id) ON DELETE SET NULL,
    featured_media_id BIGINT REFERENCES media_assets(id) ON DELETE SET NULL,
    badge VARCHAR(80),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX destinations_status_published_idx ON destinations(status, published_at DESC);
CREATE INDEX destinations_country_idx ON destinations(country);

CREATE TABLE regions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    destination_id BIGINT NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
    slug VARCHAR(180) NOT NULL UNIQUE,
    title VARCHAR(180) NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    tagline TEXT NOT NULL DEFAULT '',
    hero_media_id BIGINT REFERENCES media_assets(id) ON DELETE SET NULL,
    about_title VARCHAR(240) NOT NULL DEFAULT '',
    about_paragraphs TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX regions_destination_id_idx ON regions(destination_id);
CREATE INDEX regions_status_published_idx ON regions(status, published_at DESC);

CREATE TABLE activities (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(180) NOT NULL UNIQUE,
    title VARCHAR(180) NOT NULL,
    short_description TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    hero_media_id BIGINT REFERENCES media_assets(id) ON DELETE SET NULL,
    icon_name VARCHAR(100) NOT NULL DEFAULT '',
    badge VARCHAR(80),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX activities_status_published_idx ON activities(status, published_at DESC);

CREATE TABLE trip_categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(180) NOT NULL UNIQUE,
    name VARCHAR(180) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    media_id BIGINT REFERENCES media_assets(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX trip_categories_status_idx ON trip_categories(status);

CREATE TABLE trips (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(220) NOT NULL UNIQUE,
    code VARCHAR(80) UNIQUE,
    title VARCHAR(240) NOT NULL,
    short_description TEXT NOT NULL DEFAULT '',
    full_description TEXT NOT NULL DEFAULT '',
    destination_id BIGINT NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
    region_id BIGINT REFERENCES regions(id) ON DELETE RESTRICT,
    activity_id BIGINT REFERENCES activities(id) ON DELETE RESTRICT,
    category_id BIGINT REFERENCES trip_categories(id) ON DELETE RESTRICT,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    duration_nights INTEGER CHECK (duration_nights IS NULL OR duration_nights >= 0),
    difficulty VARCHAR(20) CHECK (difficulty IS NULL OR difficulty IN ('easy', 'moderate', 'challenging', 'strenuous')),
    max_altitude_m INTEGER CHECK (max_altitude_m IS NULL OR max_altitude_m > 0),
    max_altitude_label TEXT,
    min_group_size INTEGER CHECK (min_group_size IS NULL OR min_group_size > 0),
    max_group_size INTEGER CHECK (max_group_size IS NULL OR max_group_size > 0),
    start_location TEXT NOT NULL DEFAULT '',
    end_location TEXT NOT NULL DEFAULT '',
    best_season TEXT NOT NULL DEFAULT '',
    base_price NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
    sale_price NUMERIC(12,2) CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price <= base_price)),
    currency CHAR(3) NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
    single_supplement NUMERIC(12,2) CHECK (single_supplement IS NULL OR single_supplement >= 0),
    child_price NUMERIC(12,2) CHECK (child_price IS NULL OR child_price >= 0),
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    badge VARCHAR(80),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    seo_title VARCHAR(240),
    seo_description TEXT,
    hero_media_id BIGINT REFERENCES media_assets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CHECK (max_group_size IS NULL OR min_group_size IS NULL OR max_group_size >= min_group_size)
);

CREATE INDEX trips_destination_id_idx ON trips(destination_id);
CREATE INDEX trips_region_id_idx ON trips(region_id);
CREATE INDEX trips_activity_id_idx ON trips(activity_id);
CREATE INDEX trips_category_id_idx ON trips(category_id);
CREATE INDEX trips_status_published_idx ON trips(status, published_at DESC);
CREATE INDEX trips_featured_idx ON trips(featured) WHERE featured AND deleted_at IS NULL;

CREATE TABLE trip_images (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trip_id BIGINT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    media_id BIGINT NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    is_hero BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (trip_id, sort_order)
);

CREATE INDEX trip_images_media_id_idx ON trip_images(media_id);
CREATE UNIQUE INDEX trip_images_one_hero_idx ON trip_images(trip_id) WHERE is_hero;

CREATE TABLE trip_itinerary_days (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trip_id BIGINT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number > 0),
    title VARCHAR(240) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    altitude TEXT,
    trekking_time TEXT,
    accommodation TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (trip_id, day_number),
    UNIQUE (trip_id, sort_order)
);

CREATE INDEX trip_itinerary_days_trip_id_idx ON trip_itinerary_days(trip_id);

CREATE TABLE trip_highlights (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trip_id BIGINT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
    UNIQUE (trip_id, sort_order)
);

CREATE TABLE trip_inclusions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trip_id BIGINT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
    UNIQUE (trip_id, sort_order)
);

CREATE TABLE trip_exclusions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trip_id BIGINT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
    UNIQUE (trip_id, sort_order)
);

CREATE TABLE faqs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trip_id BIGINT REFERENCES trips(id) ON DELETE CASCADE,
    page_key VARCHAR(120),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((trip_id IS NOT NULL) <> (page_key IS NOT NULL))
);

CREATE INDEX faqs_trip_status_order_idx ON faqs(trip_id, status, sort_order);
CREATE INDEX faqs_page_status_order_idx ON faqs(page_key, status, sort_order);

CREATE TABLE blog_categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(180) NOT NULL UNIQUE,
    name VARCHAR(180) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE blogs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(220) NOT NULL UNIQUE,
    title VARCHAR(240) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    published_at TIMESTAMPTZ,
    author VARCHAR(180) NOT NULL DEFAULT '',
    author_role VARCHAR(180) NOT NULL DEFAULT '',
    author_media_id BIGINT REFERENCES media_assets(id) ON DELETE SET NULL,
    hero_media_id BIGINT REFERENCES media_assets(id) ON DELETE SET NULL,
    hero_image_alt TEXT NOT NULL DEFAULT '',
    category_id BIGINT REFERENCES blog_categories(id) ON DELETE SET NULL,
    intro TEXT,
    quote TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    seo_title VARCHAR(240),
    seo_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX blogs_category_id_idx ON blogs(category_id);
CREATE INDEX blogs_status_published_idx ON blogs(status, published_at DESC);

CREATE TABLE blog_sections (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    blog_id BIGINT NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    title VARCHAR(240) NOT NULL,
    media_id BIGINT REFERENCES media_assets(id) ON DELETE SET NULL,
    image_alt TEXT,
    sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (blog_id, sort_order)
);

CREATE INDEX blog_sections_media_id_idx ON blog_sections(media_id);

CREATE TABLE blog_section_paragraphs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    blog_section_id BIGINT NOT NULL REFERENCES blog_sections(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
    UNIQUE (blog_section_id, sort_order)
);

CREATE INDEX blog_section_paragraphs_section_id_idx ON blog_section_paragraphs(blog_section_id);

CREATE TABLE reviews (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trip_id BIGINT REFERENCES trips(id) ON DELETE SET NULL,
    name VARCHAR(180) NOT NULL,
    email VARCHAR(254) NOT NULL,
    location VARCHAR(180) NOT NULL DEFAULT '',
    title VARCHAR(240),
    message TEXT NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    photo_media_id BIGINT REFERENCES media_assets(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX reviews_trip_id_idx ON reviews(trip_id);
CREATE INDEX reviews_status_created_idx ON reviews(status, created_at DESC);

CREATE TABLE newsletter_subscribers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unsubscribed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((status = 'active' AND unsubscribed_at IS NULL) OR (status = 'unsubscribed' AND unsubscribed_at IS NOT NULL))
);

CREATE UNIQUE INDEX newsletter_subscribers_email_lower_uidx ON newsletter_subscribers(lower(email));
CREATE INDEX newsletter_subscribers_status_idx ON newsletter_subscribers(status);

CREATE TABLE inquiries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trip_id BIGINT REFERENCES trips(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('trip', 'contact', 'plan_my_trip')),
    name VARCHAR(180) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(80),
    travel_date DATE,
    travelers INTEGER CHECK (travelers IS NULL OR travelers > 0),
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'closed', 'converted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX inquiries_trip_id_idx ON inquiries(trip_id);
CREATE INDEX inquiries_status_created_idx ON inquiries(status, created_at DESC);
CREATE INDEX inquiries_email_idx ON inquiries(email);

CREATE TABLE gallery_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    media_id BIGINT NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
    title VARCHAR(240) NOT NULL,
    location VARCHAR(180),
    alt_text TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    trip_id BIGINT REFERENCES trips(id) ON DELETE SET NULL,
    blog_id BIGINT REFERENCES blogs(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX gallery_items_media_id_idx ON gallery_items(media_id);
CREATE INDEX gallery_items_trip_id_idx ON gallery_items(trip_id);
CREATE INDEX gallery_items_blog_id_idx ON gallery_items(blog_id);
CREATE INDEX gallery_items_status_order_idx ON gallery_items(status, sort_order);
