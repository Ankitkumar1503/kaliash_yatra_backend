# Phase 2C frontend integration mapping

This mapping was recorded before frontend code changes. Phase 2C implementation
uses typed adapters in the frontend `lib/api/` directory and fetches public
content from the existing API. Pages retain their existing component layouts.

| Frontend page/component | Current source | Backend endpoint | Response adaptation | Component boundary |
|---|---|---|---|---|
| `/destination?country=...` and `FeaturedDestination` | `data/destinations.ts`; rest of page cards partly component-local | `GET /destinations?country=...`; `GET /destinations/:slug` | media objects to existing image strings; preserve `country` query; use destination counts and relation slugs | server page fetches; pass display props to existing client cards where a prop interface exists |
| `/activities`, `PopularActivities`, `FeaturedActivity` | activity cards partly component-local; FeaturedActivity defaults | `GET /activities`; `GET /activities/:slug` | media object to image string; activity relations to existing card fields | server page fetches, passes items/data into existing client components |
| `/trip`, `/trip/[slug]` | `/trip` previously wrapped the Everest detail route; `/trip-details` is a separate legacy static page | `GET /trips`; `GET /trips/:slug` | trip listing uses the existing tour card carousel; detail adapter maps API fields to the existing `Trip` UI shape | `/trip` now lists all published trips at the same URL; `/trip/[slug]` remains the dynamic detail page; `/trip-details` remains unchanged |
| `/region`, `/region/[slug]` | `data/regions.ts`; dynamic route falls back to Everest | `GET /regions`; `GET /regions/:slug` | media object to URL; child rows already expose `popularPlaces`/`experiences`; preserve optional destination/trip relationships | server pages; props to existing region components |
| `/blog`, `/blog/[slug]`, `TravelTips` | list page uses `component/Blog/blogData.ts`; detail uses `data/blogs.ts` and a default article fallback | `GET /blogs` with backend search/category; `GET /blogs/:slug` | map published date/media/category and ordered paragraphs into existing `BlogPost` and `BlogDetailArticle` shapes | server pages fetch; client `TravelTips` keeps its interactive search/filter controls |
| `/reviews`, `ReviewsSection` | `component/Reviews/reviewsData.ts` plus `lib/storage.ts` localStorage submissions | `GET /reviews` | public reviews have no email; map avatar/trip objects to strings; merge API reviews with browser-submitted localStorage reviews | server page fetches approved reviews and passes them to existing client section; localStorage submission remains |
| `/gallery`, `TravelGalleryGrid` | component-local `galleryPhotos` in `component/Gallery/TravelGalleryGrid.tsx` | `GET /gallery` | media URL to `src`; map title/location/alt/order; discard backend storage details and keep existing layout behavior | server page fetches, passes records into existing client lightbox |
| Homepage trip carousels | component-local `BestTour` and `AdventuresSection` card fixtures | `GET /trips?featured=true` | adapt trip title, source image, display area, rating, review count, badge, and price to the existing cards | same carousel components; API errors and empty results render in place without fixture fallback |
| Homepage popular destinations | component-local country cards plus one region card | `GET /destinations`; `GET /regions` | four destination cards and the Everest region card retain their original order and href format | same carousel; cards come from public API records |
| Homepage gallery strip | five component-local image records and layout classes | `GET /gallery` | use the first five ordered gallery records; retain the existing alternating height pattern | same image grid; API errors and empty results render inline |
| Homepage blog tips and reviews | previously component-local fixtures | `GET /blogs`; `GET /reviews` | API adapters feed existing components | already connected in Phase 2C; no mock fallback is used when API calls fail |
| Homepage `DestinationsWeLove` tabs | local Regions/Cities/Places arrays and marketing counts | no complete endpoint/data set | backend has selected region popular places and experiences, but no complete city catalogue or equivalent tab/count records | intentionally static; preserve all existing labels and copy |
| Homepage hero/banner and FAQ | component-local promotional slides/copy; six global FAQ question/answer pairs | no matching banner data; `GET /faqs` provides trip-scoped FAQ records only | the six FAQ entries were skipped during import and have no matching global page-key rows; current API list contains trip FAQ rows | intentionally static; do not substitute unrelated trip FAQs or change the copy |

Activity cards still point to `/activities/cultural-tours`, `/activities/adventure`,
`/activities/spiritual-journeys`, `/activities/trekking`, and
`/activities/wildlife-nature`. There is no `/activities/[slug]` route; links are
preserved and no detail page was created. `/trip-details` has no current
internal navigation references and remains as a legacy static route. LocalStorage
keys for reviews, newsletter, and bookings remain in place. No CMS routes or
schema changes are in scope.

The homepage Annapurna trip card now uses the imported trip's existing
`/images/destinations/pokhara.jpg` media reference; the nonexistent
`/images/destinations/annapurna.jpg` card fixture was removed with the unused
homepage tour fixture.

The unused frontend fixture modules `data/activities.ts`, `data/blogs.ts`,
`data/destinations.ts`, `data/regions.ts`, `data/reviews.ts`, `data/trips.ts`,
`component/Blog/blogData.ts`, and `component/Reviews/reviewsData.ts` were
removed after confirming no runtime imports remained. The unused default blog
article and popular-article arrays were also removed; their exported shapes
remain as types. Shared fallback fixtures still used by other routes/components
remain untouched.
