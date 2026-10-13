# Phase 2B source mapping report

Updated after blocker resolution and Phase 2B import. The frontend remains unchanged.

## Source inventory

| Content | Source | Records found | Source identity / important structure |
|---|---|---:|---|
| Destinations | kaliash-yatra-project/data/destinations.ts | 4 | IDs/slugs: nepal, bhutan, tibet, india; includes descriptions, image paths, region labels, featured trip slugs and display trip counts. |
| Activities | kaliash-yatra-project/data/activities.ts | 5 | IDs/slugs: trekking, cultural-tours, spiritual-journeys, adventure-sports, wildlife-nature; includes icon/badge and featured trip slugs. |
| Regions | kaliash-yatra-project/data/regions.ts | 2 | IDs/slugs: everest, annapurna; each has about paragraphs, stats, popular places, experiences and featured trip slugs. |
| Trips | kaliash-yatra-project/data/trips.ts | 4 | Stable slugs: Everest Base Camp, Kailash Mansarovar, Annapurna Circuit, Bhutan Cultural Odyssey. Includes ordered gallery, overview, highlights, itinerary, inclusions, exclusions and trip FAQs. |
| Blogs | kaliash-yatra-project/data/blogs.ts | 8 | IDs b1–b8; category strings, DD/MM/YYYY dates, author/hero image references, intro, quote, ordered sections, paragraphs and optional section media. |
| Testimonial-style reviews | kaliash-yatra-project/data/reviews.ts | 6 | IDs r1–r6; name, rating, message, location, avatar, display date and trip label. No email field. |
| Reviews page placeholders | kaliash-yatra-project/component/Reviews/reviewsData.ts | 6 | IDs r1–r6, but messages are Lorem Ipsum placeholders. The reviews page initializes from this set. Not suitable for testimonial import. |
| Gallery page | kaliash-yatra-project/component/Gallery/TravelGalleryGrid.tsx | 32 | IDs g1–g32; src, alt, title, optional location and layout-only classes. This is the gallery page's source. |
| Reused showcase strip | kaliash-yatra-project/component/TravelGallery/TravelGallery.tsx | 5 | IDs 1–5; image, alt and layout class only, with no title/location. Used on home, destination and trip pages. |
| Trip FAQs | kaliash-yatra-project/data/trips.ts | 8 | Nested per trip, with ordered question/answer pairs. |
| General FAQs | kaliash-yatra-project/component/FAQSection/FAQSection.tsx | 6 | Hard-coded in the component rather than centralized with the data fixtures; report separately per the brief. |

## Safe field mappings identified

- Destination source IDs/slugs map to destinations.slug; source text and image paths map to their same-named schema concepts. Region and featured-trip relationships can be resolved only where a corresponding source record exists. The displayed tripsCount values are fixture counters and should be derived from imported trips rather than treated as actual counts.
- Activity IDs/slugs map to activities.slug; featured trip slugs can resolve to the trip fixtures. tripsCount is likewise a display counter.
- Region IDs/slugs and text map to regions; aboutParagraphs maps to about_paragraphs. The source does not provide an explicit destination ID, though the two region labels appear in Nepal's destination list.
- Trip country values match the four destination fixture countries. Activity names match activity titles. The region strings Everest Region and Annapurna Region match the two region fixtures, but Ngari (Kailash) and Paro & Thimphu do not have region records. No source trip category exists.
- Trip rating and reviewCount values are present in the frontend fixture, but the public API derives these values from approved database reviews. The source values (for example, hundreds of reviews per trip) do not correspond to the six testimonial records; they must not be represented as imported review aggregates.
- Blog category names can map to blog_categories; DD/MM/YYYY source dates require explicit day-first parsing into published_at.
- Image paths can be retained as local /images/... public URLs and deduped by exact path for media_assets.storage_key. No upload/cloud URL is needed. Of 42 unique referenced image paths, /images/destinations/annapurna.jpg is missing from the frontend public/ directory.

## Blocker resolution

1. Region popular places now have a normalized region_popular_places child
   table. Source id is retained as source_id; name, description, optional
   media_id, optional href, sort_order and publication status are represented.
   The API maps source_id back to id and media_assets.public_url to image.
2. Region experiences now have a normalized region_experiences child table.
   Source id is retained as source_id; title, description, optional media_id,
   optional badge, sort_order and publication status are represented. The API
   maps source_id back to id and the safe public URL to image.
3. reviews.email was made nullable by an additive migration. It remains absent
   from public projections; the change permits source testimonials to be
   imported with email=NULL. No review POST endpoint exists yet, so no write
   validator was changed.
4. Kailash trip: its exact region value is Ngari (Kailash). That label also
   appears in the Tibet destination's source regions list, so classify as A:
   a source-backed region label without a detailed regionsData record. The
   importer created a minimal region row using only that label and its Tibet
   destination relationship.
5. Bhutan trip: `region_id` remains NULL and `trips.display_area` contains
   the exact source label "Paro & Thimphu". No Bhutan region rows were
   created. Other destination region labels without detailed region records
   are reported as unresolved.
6. Annapurna image: no file named Annapurna or alternate extension exists.
   public/images/destinations/pokhara.jpg is the source-backed equivalent
   already used by the Annapurna region and trip fixtures. The importer maps
   the missing reference to this existing media path; no frontend path changed.
7. Five reused showcase-strip records have no title/location, while
   gallery_items.title is required. The gallery page's 32 records do have
   titles; the showcase strip remains a presentation-only source and is not a
   separate gallery import target without a mapping decision.
8. General FAQs remain hard-coded in FAQSection.tsx and are reported
   separately. The eight trip FAQs are centralized in trips.ts.

## Phase 2A API compatibility notes

- Destination/activity IDs, slugs, descriptive text, icon/badge and image references have equivalents. The API returns database IDs and safe media objects instead of the fixture IDs and image strings. Its featured-trip relationships are richer than the frontend slug arrays.
- Region title, subtitle, tagline, hero image, about title/paragraphs, featured trip relationship, popularPlaces and experiences have API mappings. The region child collections are returned on detail only, ordered by sort_order, and filtered to published rows; their image fields use public URL strings or null.
- Trip title, country, difficulty, days/nights, badge and ordered content have equivalents. Current API returns relational objects for destination/country, region, activity and category; numeric database prices, media objects, max-altitude/group-size representations and ISO timestamps need frontend adapters. Frontend duration/price display strings differ from normalized database values. API ratings/review counts are approved-review aggregates, not the fixture counters. No frontend trip category is present.
- Blog title, slug, description, author, role, intro, quote and ordered sections/paragraphs map. Current API returns a category object and safe media objects where the frontend types use category/image strings; source dates are day-first formatted strings while API dates are timestamps.
- Review name, rating, message, location, title, date and trip label map conceptually. API avatar/trip values are objects and IDs are database IDs; local fixture avatar/trip fields are strings. Email is private to the API and cannot be supplied by these fixtures.
- FAQ question/answer values match. Gallery output uses a media object; the frontend gallery shape uses src/image strings and its layout classes are presentation-only.
- All public list endpoints wrap results in items/pagination; frontend fixture consumers currently work with arrays or keyed objects, so an API adapter will be needed when frontend integration is authorized.
- Existing database fields not needed by current public types include trip code, currency, numeric altitude/group bounds and timestamps/SEO metadata; they remain useful backend fields and are not a reason to change frontend types.
- Browser-only keys in lib/storage.ts: mission-nepal-reviews, mission-nepal-newsletter and mission-nepal-bookings. The importer cannot access browser localStorage. User-entered reviews may contain a temporary URL.createObjectURL avatar and must not be imported as a persistent media URL.

The additive migrations add the two region child tables, nullable trip display
area, and nullable source IDs for idempotent review/gallery imports, and relax
reviews.email nullability. They do not modify users, RBAC, authentication or
existing review rows.

## Import implementation and results

`npm run db:seed-content` runs `scripts/seed-content.js`. It reads actual
frontend TypeScript fixture exports with the frontend's installed TypeScript
compiler, without modifying the frontend. It validates source references and
local image files, normalizes media by existing public path, and imports
supported records in one transaction. Source slugs, child IDs and ordering
are retained. Reviews and gallery rows retain namespaced source IDs for stable
reruns. Set `FRONTEND_PROJECT_PATH` only if the frontend is elsewhere.

The importer was run twice. The first run imported the records below; the
second run inserted zero rows into every imported table and left all counts
unchanged.

| Record type | Source records | Final database count |
|---|---:|---:|
| Destinations | 4 | 4 |
| Activities | 5 | 5 |
| Regions (2 detailed + source-backed Ngari) | 3 | 3 |
| Region popular places | 9 | 9 |
| Region experiences | 6 | 6 |
| Trips | 4 | 4 |
| Trip images | 18 | 18 |
| Itinerary days | 50 | 50 |
| Trip highlights | 19 | 19 |
| Trip inclusions | 24 | 24 |
| Trip exclusions | 16 | 16 |
| Trip FAQs | 8 | 8 |
| Blog categories | 4 | 4 |
| Blogs | 8 | 8 |
| Blog sections | 12 | 12 |
| Blog paragraphs | 18 | 18 |
| Approved testimonials | 6 | 6 |
| Gallery items | 32 | 32 |
| Deduplicated media paths | 41 | 41 |

No records were rejected. Five reused presentation-strip images have no
title/location and were not imported as extra gallery items. Six component-
only general FAQs and six Lorem Ipsum review placeholders were excluded.
Fixture rating/review-count aggregates were not imported because public
aggregates derive from approved reviews. No review emails were invented;
imported reviews have `email=NULL`.

Unresolved source relationships are reported rather than guessed: 13
destination region labels lack detailed region records; three featured-trip
slugs point to missing trip fixtures (`kathmandu-valley-heritage`,
`lhasa-central-tibet-explorer`, `golden-triangle-india`); and four testimonial
trip labels do not exactly match imported trip titles. Those four reviews
were imported with `trip_id=NULL`. Kailash links to the exact source-backed
`Ngari (Kailash)` region under Tibet. Bhutan has `region_id=NULL` and
`display_area='Paro & Thimphu'`.

All 40 database foreign-key constraints are validated. Targeted orphan checks
for destination/region/activity trip references, trip images, blog sections,
review media and gallery media each returned zero. Public API checks returned
four trips, eight blogs, six reviews, 32 gallery items and the Ngari region;
Bhutan returned a null canonical region and the exact display area. Public
review projections contained no email field. `/health` returned 200 with
status `ok`.

All tests passed: 10 tests, 0 failures. `git diff --check` passed.
