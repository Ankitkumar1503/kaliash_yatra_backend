import "dotenv/config";
import pool from "../src/config/db.js";
import logger from "../src/utils/logger.js";

export const defaultCategories = [
  { slug: "trekking", name: "Trekking", description: "Himalayan trekking and walking expeditions" },
  { slug: "cultural-tours", name: "Cultural Tours", description: "Heritage, temple, and village cultural sightseeing" },
  { slug: "spiritual-yatra", name: "Spiritual Yatra", description: "Pilgrimage and holy site spiritual journeys" },
  { slug: "adventure-sports", name: "Adventure Sports", description: "Rafting, paragliding, and high-altitude adventures" },
  { slug: "wildlife-nature", name: "Wildlife & Nature", description: "Jungle safaris, national parks, and flora-fauna excursions" },
  { slug: "day-tours", name: "Day Tours", description: "Single day valley and city excursions" },
];

export const seedTripCategories = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const cat of defaultCategories) {
      await client.query(
        `INSERT INTO trip_categories (slug, name, description, status)
         VALUES ($1, $2, $3, 'active')
         ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = now()`,
        [cat.slug, cat.name, cat.description],
      );
    }
    await client.query("COMMIT");
    logger.info("Trip categories seeded successfully", { count: defaultCategories.length });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

if (process.argv[1] && process.argv[1].endsWith("seed-trip-categories.js")) {
  try {
    await seedTripCategories();
  } catch (error) {
    logger.error("Failed to seed trip categories", { error: error.message });
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
