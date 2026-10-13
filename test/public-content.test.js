import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
import pool from "../src/config/db.js";

let server, baseUrl, ids = {};
const slug = `phase2-${Date.now()}`;
const req = async (path) => {
  const res = await fetch(baseUrl + path);
  return { status: res.status, body: await res.json() };
};

before(async () => {
  server = app.listen(0);
  await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const d = await pool.query("INSERT INTO destinations (slug,name,country,status,published_at) VALUES ($1,'Fixture Destination','Nepal','published',now()) RETURNING id", [slug+"-dest"]);
  ids.destination = d.rows[0].id;
  const a = await pool.query("INSERT INTO activities (slug,title,status,published_at) VALUES ($1,'Fixture Activity','published',now()) RETURNING id", [slug+"-activity"]);
  ids.activity = a.rows[0].id;
  const c = await pool.query("INSERT INTO trip_categories (slug,name,status) VALUES ($1,'Fixture Category','active') RETURNING id", [slug+"-category"]);
  ids.category = c.rows[0].id;
  const r = await pool.query("INSERT INTO regions (destination_id,slug,title,status,published_at) VALUES ($1,$2,'Fixture Region','published',now()) RETURNING id", [ids.destination,slug+"-region"]);
  ids.region = r.rows[0].id;
  const m = await pool.query("INSERT INTO media_assets (storage_key,public_url,media_type) VALUES ($1,'https://example.invalid/public.jpg','image/jpeg') RETURNING id", [slug+"-media"]);
  ids.media = m.rows[0].id;
  await pool.query("INSERT INTO region_popular_places (source_id,region_id,name,description,media_id,href,sort_order,status) VALUES ($1,$2,'Source Place','Place description',$3,'/trip/source-trip',0,'published'),($4,$2,'Draft Place','Not public',$3,NULL,1,'draft'),($5,$2,'Second Place','Second description',$3,NULL,2,'published')",[slug+"-place",ids.region,ids.media,slug+"-draft-place",slug+"-place-second"]);
  await pool.query("INSERT INTO region_experiences (source_id,region_id,title,description,media_id,badge,sort_order,status) VALUES ($1,$2,'Source Experience','Experience description',$3,'LOCAL',0,'published'),($4,$2,'Draft Experience','Not public',$3,NULL,1,'draft'),($5,$2,'Second Experience','Second description',$3,NULL,2,'published')",[slug+"-experience",ids.region,ids.media,slug+"-draft-experience",slug+"-experience-second"]);
  const t = await pool.query(`INSERT INTO trips (slug,title,destination_id,region_id,activity_id,category_id,duration_days,base_price,sale_price,currency,featured,status,published_at,hero_media_id,display_area)
    VALUES ($1,'Fixture Trip',$2,$3,$4,$5,3,1000,800,'USD',true,'published',now(),$6,'Fixture Area') RETURNING id`, [slug+"-trip",ids.destination,ids.region,ids.activity,ids.category,ids.media]);
  ids.trip = t.rows[0].id;
  await pool.query("INSERT INTO trip_images (trip_id,media_id,alt_text,sort_order) VALUES ($1,$2,'Fixture gallery',0)",[ids.trip,ids.media]);
  await pool.query("INSERT INTO trip_itinerary_days (trip_id,day_number,title,sort_order) VALUES ($1,1,'Day one',0)",[ids.trip]);
  await pool.query("INSERT INTO trip_highlights (trip_id,text,sort_order) VALUES ($1,'Highlight',0)",[ids.trip]);
  for (const [status,name] of [["approved","Public Reviewer"],["pending","Private Reviewer"],["hidden","Hidden Reviewer"],["rejected","Rejected Reviewer"]]) {
    await pool.query("INSERT INTO reviews (trip_id,name,email,message,rating,status) VALUES ($1,$2,$3,'Review message',5,$4)",[ids.trip,name,slug+"-"+status+"@example.invalid",status]);
  }
  await pool.query("INSERT INTO reviews (trip_id,name,message,rating,status) VALUES ($1,'No Email Fixture','Email remains optional and private',4,'pending')",[ids.trip]);
  await pool.query("INSERT INTO faqs (trip_id,question,answer,status) VALUES ($1,'Published question','Answer','published')",[ids.trip]);
  await pool.query("INSERT INTO gallery_items (media_id,title,alt_text,status,trip_id) VALUES ($1,'Fixture gallery','A view','published',$2)",[ids.media,ids.trip]);
  await pool.query("INSERT INTO blogs (slug,title,description,author,hero_media_id,status,published_at) VALUES ($1,'Fixture Blog','Description','Author',$2,'published',now()),($3,'Draft Blog','No','Author',$2,'draft',now())",[slug+"-blog",ids.media,slug+"-draft-blog"]);
  const b = await pool.query("SELECT id FROM blogs WHERE slug=$1",[slug+"-blog"]); ids.blog=b.rows[0].id;
  const s = await pool.query("INSERT INTO blog_sections (blog_id,title,sort_order) VALUES ($1,'Section',0) RETURNING id",[ids.blog]); ids.section=s.rows[0].id;
  await pool.query("INSERT INTO blog_section_paragraphs (blog_section_id,body,sort_order) VALUES ($1,'Paragraph',0)",[ids.section]);
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await pool.query("DELETE FROM reviews WHERE email LIKE $1 AND name IN ('Public Reviewer','Private Reviewer','Hidden Reviewer','Rejected Reviewer') AND message='Review message'",[slug+"-%@example.invalid"]);
  await pool.query("DELETE FROM reviews WHERE name='No Email Fixture' AND message='Email remains optional and private' AND trip_id IN (SELECT id FROM trips WHERE slug LIKE $1)",[slug+"-%"]);
  await pool.query("DELETE FROM gallery_items WHERE title='Fixture gallery' AND trip_id IN (SELECT id FROM trips WHERE slug LIKE $1)",[slug+"-%"]);
  await pool.query("DELETE FROM blogs WHERE slug LIKE $1 AND title IN ('Fixture Blog','Draft Blog')",[slug+"-%"]);
  await pool.query("DELETE FROM trips WHERE slug LIKE $1",[slug+"-%"]);
  await pool.query("DELETE FROM regions WHERE slug LIKE $1",[slug+"-%"]);
  await pool.query("DELETE FROM destinations WHERE slug LIKE $1",[slug+"-%"]);
  await pool.query("DELETE FROM activities WHERE slug LIKE $1",[slug+"-%"]);
  await pool.query("DELETE FROM trip_categories WHERE slug LIKE $1",[slug+"-%"]);
  await pool.query("DELETE FROM media_assets WHERE storage_key=$1",[slug+"-media"]);
  await pool.end();
});

test("public content APIs enforce published and private-field boundaries", async (t) => {
  await t.test("resource lists, details, and unknown slugs", async () => {
    for (const [path, field] of [["destinations","name"],["activities","title"],["regions","title"]]) {
      const list=await req("/api/v1/"+path);assert.equal(list.status,200);assert.ok(list.body.data.items.some(x=>x.slug===slug+"-"+(path==="destinations"?"dest":path==="activities"?"activity":"region")));
    }
    const dest=await req("/api/v1/destinations/"+slug+"-dest");assert.equal(dest.status,200);assert.equal(dest.body.data.regions.length,1);assert.equal(dest.body.data.featuredTrips.length,1);
    const activity=await req("/api/v1/activities/"+slug+"-activity");assert.equal(activity.status,200);assert.equal(activity.body.data.featuredTrips.length,1);
    const region=await req("/api/v1/regions/"+slug+"-region");assert.equal(region.status,200);assert.equal(region.body.data.destination.slug,slug+"-dest");
    assert.deepEqual(region.body.data.popularPlaces.map(x=>x.id),[slug+"-place",slug+"-place-second"]);
    assert.deepEqual(region.body.data.experiences.map(x=>x.id),[slug+"-experience",slug+"-experience-second"]);
    assert.equal(region.body.data.popularPlaces[0].image,"https://example.invalid/public.jpg");
    for(const path of ["destinations","activities","regions"]) assert.equal((await req("/api/v1/"+path+"/not-a-real-slug")).status,404);
  });
  await t.test("trip filtering, sorting, pagination, detail, and reviews privacy", async () => {
    const list=await req(`/api/v1/trips?destination=${slug}-dest&activity=${slug}-activity&minPrice=700&maxPrice=900&sort=price&limit=1&page=1`);
    assert.equal(list.status,200);assert.equal(list.body.data.items.length,1);assert.equal(list.body.data.pagination.total,1);
    const trip=await req("/api/v1/trips/"+slug+"-trip");assert.equal(trip.status,200);assert.equal(trip.body.data.rating,5);assert.equal(trip.body.data.reviewCount,1);
    assert.equal(trip.body.data.displayArea,"Fixture Area");
    assert.equal(trip.body.data.itinerary[0].dayNumber,1);assert.deepEqual(trip.body.data.highlights,["Highlight"]);
    const reviews=await req("/api/v1/reviews?trip="+slug+"-trip");assert.equal(reviews.body.data.items.length,1);
    assert.equal(JSON.stringify(reviews.body).includes("@example.invalid"),false);
    assert.equal((await req("/api/v1/trips/unknown-slug")).status,404);
    assert.equal((await req("/api/v1/trips?sort=title%3Bdrop%20table")).status,400);
  });
  await t.test("published blogs, FAQs, and gallery expose presentation-safe fields", async () => {
    const blogs=await req("/api/v1/blogs?search=Fixture&limit=1");assert.equal(blogs.status,200);assert.ok(blogs.body.data.items.some(b=>b.slug===slug+"-blog"));assert.equal(blogs.body.data.items.some(b=>b.slug===slug+"-draft-blog"),false);
    const blog=await req("/api/v1/blogs/"+slug+"-blog");assert.deepEqual(blog.body.data.sections[0].paragraphs,["Paragraph"]);
    assert.equal((await req("/api/v1/blogs/not-a-real-slug")).status,404);
    const faqs=await req("/api/v1/faqs?trip="+slug+"-trip");assert.equal(faqs.body.data.items.length,1);
    const gallery=await req("/api/v1/gallery?trip="+slug+"-trip");assert.equal(gallery.body.data.items.length,1);
    assert.equal(JSON.stringify(gallery.body).includes("storage_key"),false);
  });
});
