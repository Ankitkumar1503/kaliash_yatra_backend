ALTER TABLE reviews ADD COLUMN source_id VARCHAR(180);
CREATE UNIQUE INDEX reviews_source_id_uidx ON reviews(source_id) WHERE source_id IS NOT NULL;

ALTER TABLE gallery_items ADD COLUMN source_id VARCHAR(180);
CREATE UNIQUE INDEX gallery_items_source_id_uidx ON gallery_items(source_id) WHERE source_id IS NOT NULL;
