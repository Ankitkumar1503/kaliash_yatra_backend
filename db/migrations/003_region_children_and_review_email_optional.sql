-- Additive public region content and allow imported testimonials without a source email.
-- The email column remains private in all public API projections.
ALTER TABLE reviews
  ALTER COLUMN email DROP NOT NULL;

CREATE TABLE region_popular_places (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id VARCHAR(180) NOT NULL,
  region_id BIGINT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  name VARCHAR(240) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  media_id BIGINT REFERENCES media_assets(id) ON DELETE SET NULL,
  href TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (region_id, source_id),
  UNIQUE (region_id, sort_order)
);

CREATE INDEX region_popular_places_public_order_idx
  ON region_popular_places(region_id, status, sort_order, id);
CREATE INDEX region_popular_places_media_id_idx
  ON region_popular_places(media_id);

CREATE TABLE region_experiences (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id VARCHAR(180) NOT NULL,
  region_id BIGINT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  title VARCHAR(240) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  media_id BIGINT REFERENCES media_assets(id) ON DELETE SET NULL,
  badge VARCHAR(80),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (region_id, source_id),
  UNIQUE (region_id, sort_order)
);

CREATE INDEX region_experiences_public_order_idx
  ON region_experiences(region_id, status, sort_order, id);
CREATE INDEX region_experiences_media_id_idx
  ON region_experiences(media_id);
