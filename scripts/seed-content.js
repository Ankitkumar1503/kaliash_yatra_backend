import "dotenv/config";
import { createRequire } from "node:module";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import pool from "../src/config/db.js";

const frontendRoot = process.env.FRONTEND_PROJECT_PATH || "E:/Nepal_project/kaliash-yatra-project";
const typescriptEntry = path.join(frontendRoot, "node_modules/typescript/lib/typescript.js");
const require = createRequire(import.meta.url);
let ts;
try { ts = require(typescriptEntry); }
catch { throw new Error(`Cannot load the frontend's installed TypeScript compiler at ${typescriptEntry}; set FRONTEND_PROJECT_PATH if needed.`); }

async function loadModule(relativePath, exportName) {
  const filename = path.join(frontendRoot, relativePath);
  const source = await readFile(filename, "utf8");
  let javascript;
  if (relativePath.endsWith(".tsx")) {
    const sf = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const declaration = sf.statements.filter(ts.isVariableStatement).flatMap((node) => [...node.declarationList.declarations]).find((d) => d.name.getText(sf) === exportName);
    if (!declaration) throw new Error(`Export ${exportName} was not found in ${relativePath}`);
    javascript = ts.transpile(`const ${exportName} = ${declaration.initializer.getText(sf)}; module.exports.${exportName}=${exportName};`, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS });
  } else {
    javascript = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  }
  const module = { exports: {} };
  vm.runInNewContext(javascript, { module, exports: module.exports }, { filename });
  if (!(exportName in module.exports)) throw new Error(`Export ${exportName} was not evaluated from ${relativePath}`);
  return module.exports[exportName];
}

const source = {
  destinations: await loadModule("data/destinations.ts", "destinationsData"),
  activities: await loadModule("data/activities.ts", "activitiesData"),
  regions: await loadModule("data/regions.ts", "regionsData"),
  trips: await loadModule("data/trips.ts", "tripsData"),
  blogs: await loadModule("data/blogs.ts", "blogsData"),
  reviews: await loadModule("data/reviews.ts", "initialReviewsData"),
  gallery: await loadModule("component/Gallery/TravelGalleryGrid.tsx", "galleryPhotos"),
};

const alias = new Map([["/images/destinations/annapurna.jpg", "/images/destinations/pokhara.jpg"]]);
const canonicalPath = (url) => alias.get(url) || url;
const slugify = (value) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const parseMoney = (value) => Number(value.replace(/[^0-9.]/g, ""));
const parseAltitude = (value) => {
  const match = value.match(/([\d,]+)\s*m/i);
  return match ? Number(match[1].replaceAll(",", "")) : null;
};
const parseGroup = (value) => {
  const matches = [...value.matchAll(/\d+/g)].map((m) => Number(m[0]));
  return { min: matches[0] ?? null, max: matches[1] ?? matches[0] ?? null };
};
const dayFirstDate = (value) => {
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}T00:00:00Z`;
  const d = new Date(`${value} UTC`);
  if (Number.isNaN(d.valueOf())) throw new Error(`Unparseable source date: ${value}`);
  return d.toISOString();
};
const requireValue = (v, label) => { if (v === undefined || v === null || v === "") throw new Error(`Missing required source value: ${label}`); return v; };

async function validateSource() {
  const issues = [];
  const paths = new Set();
  const destinationsByCountry = new Map(source.destinations.map((x) => [x.country, x]));
  const activitiesByTitle = new Map(source.activities.map((x) => [x.title, x]));
  const tripSlugs = new Set(Object.keys(source.trips));
  const regionEntries = Object.values(source.regions);
  const knownRegionTitles = new Set(regionEntries.map((x) => x.title.toLowerCase()));
  const allFeatureSlugs = new Set();
  for (const d of source.destinations) for (const s of d.featuredTrips) allFeatureSlugs.add(s);
  for (const a of source.activities) for (const s of a.featuredTrips) allFeatureSlugs.add(s);
  for (const r of regionEntries) for (const s of r.featuredTrips) allFeatureSlugs.add(s);
  for (const [key, trip] of Object.entries(source.trips)) {
    requireValue(trip.slug, `trip ${key} slug`);
    if (key !== trip.slug) throw new Error(`Trip key and slug differ for ${key}`);
    if (!destinationsByCountry.has(trip.country)) issues.push(`Trip ${key}: destination country '${trip.country}' not found`);
    if (!activitiesByTitle.has(trip.activity)) issues.push(`Trip ${key}: activity '${trip.activity}' not found`);
    if (trip.region !== "Paro & Thimphu" && !knownRegionTitles.has(trip.region.toLowerCase()) && trip.region !== "Ngari (Kailash)") issues.push(`Trip ${key}: region '${trip.region}' has no detailed source region`);
    for (const value of Object.values(trip)) collectImages(value, paths);
    allFeatureSlugs.add(key);
  }
  for (const d of source.destinations) {
    for (const label of d.regions) {
      if (!knownRegionTitles.has(label.toLowerCase()) && !(d.slug === "tibet" && label === "Ngari (Kailash)")) issues.push(`Destination ${d.slug}: region label '${label}' has no detailed region source`);
    }
  }
  for (const s of allFeatureSlugs) if (!tripSlugs.has(s)) issues.push(`Featured-trip reference '${s}' has no trip fixture`);
  for (const x of source.blogs) {
    requireValue(x.slug, `blog ${x.id} slug`); dayFirstDate(x.date);
    for (const value of Object.values(x)) collectImages(value, paths);
  }
  for (const x of source.reviews) { dayFirstDate(x.date); collectImages(x.avatar, paths); }
  for (const x of source.gallery) collectImages(x.src, paths);
  for (const x of Object.values(source.regions)) for (const value of Object.values(x)) collectImages(value, paths);
  for (const x of source.destinations) for (const value of Object.values(x)) collectImages(value, paths);
  for (const x of source.activities) for (const value of Object.values(x)) collectImages(value, paths);
  const missing = [];
  for (const url of paths) {
    const actual = canonicalPath(url);
    try { await awaitStat(path.join(frontendRoot, "public", actual.replace(/^\//, ""))); }
    catch { missing.push(`${url} (mapped to ${actual})`); }
  }
  if (missing.length) throw new Error(`Source image file(s) missing: ${missing.join(", ")}`);
  const reviewTripTitles = new Set(Object.values(source.trips).map((x) => x.title));
  const unresolvedReviewTrips = source.reviews.filter((r) => r.trip && !reviewTripTitles.has(r.trip)).map((r) => `${r.id} -> ${r.trip}`);
  return { imageReferences: paths.size, issues, unresolvedReviewTrips };
}
function collectImages(value, paths) {
  if (typeof value === "string" && value.startsWith("/images/")) paths.add(value);
  else if (Array.isArray(value)) value.forEach((v) => collectImages(v, paths));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectImages(v, paths));
}
function awaitStat(file) { return stat(file); }

const client = await pool.connect();
const inserted = Object.fromEntries(["media_assets","destinations","activities","regions","region_popular_places","region_experiences","trips","trip_images","trip_itinerary_days","trip_highlights","trip_inclusions","trip_exclusions","faqs","blog_categories","blogs","blog_sections","blog_section_paragraphs","reviews","gallery_items"].map((x) => [x, 0]));
const updated = Object.fromEntries(Object.keys(inserted).map((x) => [x, 0]));
async function upsert(table, keyColumn, keyValue, columns, values) {
  const names = [keyColumn, ...columns];
  const params = [keyValue, ...values];
  const set = columns.map((name, i) => `${name}=$${i + 2}`).join(",");
  const q = await client.query(`INSERT INTO ${table} (${names.join(",")}) VALUES (${params.map((_, i) => `$${i + 1}`).join(",")}) ON CONFLICT (${keyColumn}) DO UPDATE SET ${set},updated_at=now() RETURNING id,(xmax=0) AS inserted`, params);
  const key = table;
  q.rows[0].inserted ? inserted[key]++ : updated[key]++;
  return q.rows[0];
}
const ids = { destinations: new Map(), activities: new Map(), regions: new Map(), trips: new Map(), blogCategories: new Map(), blogs: new Map(), media: new Map() };
async function media(pathname, alt = null) {
  if (!pathname) return null;
  const url = canonicalPath(pathname);
  if (ids.media.has(url)) return ids.media.get(url);
  const ext = path.extname(url).toLowerCase();
  const type = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".svg" ? "image/svg+xml" : "image/jpeg";
  const q = await client.query(`INSERT INTO media_assets(storage_key,public_url,media_type,alt_text) VALUES($1,$1,$2,$3)
    ON CONFLICT(storage_key) DO UPDATE SET public_url=EXCLUDED.public_url,media_type=EXCLUDED.media_type,alt_text=COALESCE(media_assets.alt_text,EXCLUDED.alt_text),updated_at=now() RETURNING id,(xmax=0) AS inserted`, [url,type,alt]);
  ids.media.set(url, q.rows[0].id); q.rows[0].inserted ? inserted.media_assets++ : updated.media_assets++;
  return q.rows[0].id;
}
async function child(table, sql, params) { await client.query(sql, params); inserted[table]++; }

try {
  const validation = await validateSource();
  const tableNames=Object.keys(inserted);
  const beforeCounts={};
  for(const table of tableNames){const q=await pool.query(`SELECT count(*)::int AS count FROM ${table}`);beforeCounts[table]=q.rows[0].count;}
  await client.query("BEGIN");
  const now = new Date();
  for (const d of source.destinations) {
    const hero = await media(d.heroImage, `${d.name} destination`), featured = await media(d.featuredImage, `${d.name} featured`);
    const row = await upsert("destinations","slug",d.slug,["name","country","tagline","short_description","description","hero_media_id","featured_media_id","badge","status","published_at"],[d.name,d.country,d.tagline,d.shortDescription,d.description,hero,featured,d.badge ?? null,"published",now]); ids.destinations.set(d.country,row.id);
  }
  for (const a of source.activities) {
    const hero = await media(a.heroImage, a.title);
    const row = await upsert("activities","slug",a.slug,["title","short_description","description","hero_media_id","icon_name","badge","status","published_at"],[a.title,a.shortDescription,a.description,hero,a.iconName,a.badge ?? null,"published",now]); ids.activities.set(a.title,row.id);
  }
  for (const [slug,r] of Object.entries(source.regions)) {
    const dest = source.destinations.find((d) => d.regions.some((label) => label.toLowerCase() === r.title.toLowerCase()));
    if (!dest) throw new Error(`Region ${slug} has no exact destination label`);
    const hero = await media(r.heroImage,r.title);
    const row = await upsert("regions","slug",r.slug,["destination_id","title","subtitle","tagline","hero_media_id","about_title","about_paragraphs","status","published_at"],[ids.destinations.get(dest.country),r.title,r.subtitle,r.tagline,hero,r.aboutTitle,r.aboutParagraphs,"published",now]); ids.regions.set(r.slug,row.id);
    for (const [i,p] of r.popularPlaces.entries()) {
      const m=await media(p.image,p.name); await child("region_popular_places",`INSERT INTO region_popular_places(source_id,region_id,name,description,media_id,href,sort_order,status) VALUES($1,$2,$3,$4,$5,$6,$7,'published') ON CONFLICT(region_id,source_id) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,media_id=EXCLUDED.media_id,href=EXCLUDED.href,sort_order=EXCLUDED.sort_order,status='published',updated_at=now()`,[p.id,row.id,p.name,p.description,m,p.href,i]);
    }
    for (const [i,e] of r.experiences.entries()) {
      const m=await media(e.image,e.title); await child("region_experiences",`INSERT INTO region_experiences(source_id,region_id,title,description,media_id,badge,sort_order,status) VALUES($1,$2,$3,$4,$5,$6,$7,'published') ON CONFLICT(region_id,source_id) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,media_id=EXCLUDED.media_id,badge=EXCLUDED.badge,sort_order=EXCLUDED.sort_order,status='published',updated_at=now()`,[e.id,row.id,e.title,e.description,m,e.badge ?? null,i]);
    }
  }
  const tibet = ids.destinations.get("Tibet");
  const ngari = await upsert("regions","slug","ngari-kailash",["destination_id","title","status","published_at"],[tibet,"Ngari (Kailash)","published",now]); ids.regions.set("Ngari (Kailash)",ngari.id);
  const activityFeatured = new Set(source.activities.flatMap((a) => a.featuredTrips));
  const destinationByCountry = new Map(source.destinations.map((x) => [x.country,x]));
  for (const t of Object.values(source.trips)) {
    const dest = destinationByCountry.get(t.country), activity = source.activities.find((x) => x.title === t.activity);
    let regionId = null;
    if (t.region === "Ngari (Kailash)") regionId = ngari.id;
    else if (t.region !== "Paro & Thimphu") regionId = ids.regions.get(Object.values(source.regions).find((r) => r.title.toLowerCase() === t.region.toLowerCase())?.slug);
    const hero = await media(t.heroImage,t.title), price=parseMoney(t.price), original=t.originalPrice?parseMoney(t.originalPrice):price, group=parseGroup(t.groupSize);
    const fullDescription=(t.overview ?? []).join("\n\n");
    const row = await upsert("trips","slug",t.slug,["title","short_description","full_description","destination_id","region_id","activity_id","duration_days","duration_nights","difficulty","max_altitude_m","max_altitude_label","min_group_size","max_group_size","base_price","sale_price","currency","featured","badge","status","published_at","hero_media_id","display_area"],[t.title,t.overview?.[0] ?? "",fullDescription,ids.destinations.get(dest.country),regionId,ids.activities.get(activity.title),t.days,null,t.difficulty.toLowerCase(),parseAltitude(t.maxAltitude),t.maxAltitude,group.min,group.max,original,price<original?price:null,"USD",activityFeatured.has(t.slug),t.badge ?? null,"published",now,hero,t.region === "Paro & Thimphu" ? t.region : null]);
    ids.trips.set(t.slug,row.id);
    for (const [i,url] of t.gallery.entries()) { const m=await media(url,t.title); await client.query(`INSERT INTO trip_images(trip_id,media_id,alt_text,sort_order,is_hero) VALUES($1,$2,$3,$4,$5) ON CONFLICT(trip_id,sort_order) DO UPDATE SET media_id=EXCLUDED.media_id,alt_text=EXCLUDED.alt_text,is_hero=EXCLUDED.is_hero`,[row.id,m,t.title,i,canonicalPath(url)===canonicalPath(t.heroImage)]); inserted.trip_images++; }
    for (const [i,d] of t.itinerary.entries()) { await client.query(`INSERT INTO trip_itinerary_days(trip_id,day_number,title,description,altitude,trekking_time,accommodation,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(trip_id,day_number) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,altitude=EXCLUDED.altitude,trekking_time=EXCLUDED.trekking_time,accommodation=EXCLUDED.accommodation,sort_order=EXCLUDED.sort_order,updated_at=now()`,[row.id,d.dayNumber,d.title,d.description,d.details?.altitude ?? null,d.details?.trekkingTime ?? null,d.details?.accommodation ?? null,i]); inserted.trip_itinerary_days++; }
    for (const [table,items] of [["trip_highlights",t.highlights],["trip_inclusions",t.inclusions],["trip_exclusions",t.exclusions]]) for (const [i,text] of items.entries()) { await client.query(`INSERT INTO ${table}(trip_id,text,sort_order) VALUES($1,$2,$3) ON CONFLICT(trip_id,sort_order) DO UPDATE SET text=EXCLUDED.text`,[row.id,text,i]); inserted[table]++; }
    for (const [i,f] of t.faqs.entries()) {
      const existing=await client.query("SELECT id FROM faqs WHERE trip_id=$1 AND sort_order=$2 ORDER BY id LIMIT 1",[row.id,i]);
      if(existing.rowCount) await client.query("UPDATE faqs SET question=$1,answer=$2,status='published',updated_at=now() WHERE id=$3",[f.question,f.answer,existing.rows[0].id]);
      else await client.query("INSERT INTO faqs(trip_id,question,answer,sort_order,status) VALUES($1,$2,$3,$4,'published')",[row.id,f.question,f.answer,i]);
      inserted.faqs++;
    }
  }
  const categories = [...new Set(source.blogs.map((b)=>b.category))];
  for(const name of categories){const slug=slugify(name);const q=await client.query("INSERT INTO blog_categories(slug,name,status) VALUES($1,$2,'active') ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,status='active',updated_at=now() RETURNING id,(xmax=0) AS inserted",[slug,name]);ids.blogCategories.set(name,q.rows[0].id);q.rows[0].inserted?inserted.blog_categories++:updated.blog_categories++;}
  for(const b of source.blogs){
    const author=await media(b.authorImage,`${b.author} avatar`),hero=await media(b.heroImage,b.heroImageAlt);
    const row=await upsert("blogs","slug",b.slug,["title","description","published_at","author","author_role","author_media_id","hero_media_id","hero_image_alt","category_id","intro","quote","status"],[b.title,b.description,dayFirstDate(b.date),b.author,b.authorRole,author,hero,b.heroImageAlt,ids.blogCategories.get(b.category),b.intro??null,b.quote??null,"published"]);ids.blogs.set(b.slug,row.id);
    for(const [i,s] of (b.sections??[]).entries()){
      const m=await media(s.image,s.imageAlt??s.title);
      const section=await client.query(`INSERT INTO blog_sections(blog_id,title,media_id,image_alt,sort_order) VALUES($1,$2,$3,$4,$5) ON CONFLICT(blog_id,sort_order) DO UPDATE SET title=EXCLUDED.title,media_id=EXCLUDED.media_id,image_alt=EXCLUDED.image_alt,updated_at=now() RETURNING id`,[row.id,s.title,m,s.imageAlt??null,i]);inserted.blog_sections++;
      for(const [j,p] of s.paragraphs.entries()){await client.query(`INSERT INTO blog_section_paragraphs(blog_section_id,body,sort_order) VALUES($1,$2,$3) ON CONFLICT(blog_section_id,sort_order) DO UPDATE SET body=EXCLUDED.body`,[section.rows[0].id,p,j]);inserted.blog_section_paragraphs++;}
    }
  }
  const tripByTitle=new Map(Object.values(source.trips).map((t)=>[t.title,ids.trips.get(t.slug)]));
  for(const r of source.reviews){
    const avatar=await media(r.avatar,`${r.name} review`),tripId=tripByTitle.get(r.trip)??null;
    const q=await client.query(`INSERT INTO reviews(source_id,trip_id,name,email,location,title,message,rating,photo_media_id,status,created_at)
      VALUES($1,$2,$3,NULL,$4,$5,$6,$7,$8,'approved',$9)
      ON CONFLICT(source_id) WHERE source_id IS NOT NULL DO UPDATE SET trip_id=EXCLUDED.trip_id,name=EXCLUDED.name,location=EXCLUDED.location,title=EXCLUDED.title,message=EXCLUDED.message,rating=EXCLUDED.rating,photo_media_id=EXCLUDED.photo_media_id,status='approved',created_at=EXCLUDED.created_at,updated_at=now()
      RETURNING id,(xmax=0) AS inserted`,[`public-site:${r.id}`,tripId,r.name,r.location,r.title??null,r.message,r.rating,avatar,dayFirstDate(r.date)]);q.rows[0].inserted?inserted.reviews++:updated.reviews++;
  }
  for(const [i,g] of source.gallery.entries()){
    const m=await media(g.src,g.alt);
    const q=await client.query(`INSERT INTO gallery_items(source_id,media_id,title,location,alt_text,sort_order,status) VALUES($1,$2,$3,$4,$5,$6,'published')
      ON CONFLICT(source_id) WHERE source_id IS NOT NULL DO UPDATE SET media_id=EXCLUDED.media_id,title=EXCLUDED.title,location=EXCLUDED.location,alt_text=EXCLUDED.alt_text,sort_order=EXCLUDED.sort_order,status='published',updated_at=now() RETURNING id,(xmax=0) AS inserted`,[`public-site:${g.id}`,m,g.title,g.location??null,g.alt,i]);q.rows[0].inserted?inserted.gallery_items++:updated.gallery_items++;
  }
  await client.query("COMMIT");
  const counts={};
  for(const table of tableNames){const q=await pool.query(`SELECT count(*)::int AS count FROM ${table}`);counts[table]=q.rows[0].count;}
  const insertedThisRun=Object.fromEntries(tableNames.map((table)=>[table,Math.max(0,counts[table]-beforeCounts[table])]));
  const fk=await pool.query(`SELECT conrelid::regclass::text AS table,conname FROM pg_constraint WHERE contype='f' AND convalidated AND connamespace='public'::regnamespace ORDER BY 1,2`);
  const report={sourceRecords:{destinations:source.destinations.length,activities:source.activities.length,regions:Object.keys(source.regions).length+1,trips:Object.keys(source.trips).length,blogs:source.blogs.length,blogCategories:categories.length,reviews:source.reviews.length,galleryItems:source.gallery.length,tripFaqs:Object.values(source.trips).reduce((n,t)=>n+t.faqs.length,0),regionPopularPlaces:Object.values(source.regions).reduce((n,r)=>n+r.popularPlaces.length,0),regionExperiences:Object.values(source.regions).reduce((n,r)=>n+r.experiences.length,0),imageReferences:validation.imageReferences},recordsImportedThisRun:Object.values(insertedThisRun).reduce((n,x)=>n+x,0),insertedThisRun,counts,recordsRejected:0,foreignKeyConstraintsValidated:fk.rowCount,unresolved:validation.issues,unresolvedReviewTripLinks:validation.unresolvedReviewTrips,skipped:{showcaseStripRecords:5,globalFaqs:6,mockReviewPlaceholders:6,fixtureRatingAggregates:"not imported; public aggregates are derived from approved reviews",unsupportedFrontendRegionLabels:validation.issues.filter((x)=>x.includes("region label")),missingFeaturedTrips:validation.issues.filter((x)=>x.includes("Featured-trip reference"))}};
  process.stdout.write(`${JSON.stringify(report,null,2)}\n`);
} catch(error) {
  await client.query("ROLLBACK").catch(()=>{});
  throw error;
} finally {client.release(); await pool.end();}
