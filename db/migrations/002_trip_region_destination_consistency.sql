-- Enforce that a trip's optional region belongs to its selected destination.
ALTER TABLE regions
  ADD CONSTRAINT regions_destination_id_id_key UNIQUE (destination_id, id);

ALTER TABLE trips
  ADD CONSTRAINT trips_region_matches_destination_fk
  FOREIGN KEY (destination_id, region_id)
  REFERENCES regions (destination_id, id)
  ON DELETE RESTRICT;
