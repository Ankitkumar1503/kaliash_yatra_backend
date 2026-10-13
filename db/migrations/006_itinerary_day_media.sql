ALTER TABLE trip_itinerary_days
ADD COLUMN IF NOT EXISTS media_id BIGINT REFERENCES media_assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS trip_itinerary_days_media_id_idx ON trip_itinerary_days(media_id);
