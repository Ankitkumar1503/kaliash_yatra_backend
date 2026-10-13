import pool from "../config/db.js";

const media = (m, alt) => `CASE WHEN ${m}.id IS NULL THEN NULL ELSE jsonb_build_object('id',${m}.id,'url',${m}.public_url,'type',${m}.media_type,'alt',COALESCE(${alt},${m}.alt_text,'')) END`;
const active = (a) => `${a}.status='published' AND ${a}.deleted_at IS NULL AND (${a}.published_at IS NULL OR ${a}.published_at<=now())`;
const paged = async (sql, countSql, params, { page, limit }) => {
  const [items, count] = await Promise.all([
    pool.query(sql, [...params, limit, (page - 1) * limit]), pool.query(countSql, params),
  ]);
  const total = Number(count.rows[0].total);
  return { items: items.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
const entity = {
  destinations: {
    from: "FROM destinations d LEFT JOIN media_assets h ON h.id=d.hero_media_id LEFT JOIN media_assets f ON f.id=d.featured_media_id",
    where: [active("d")], count: "FROM destinations d",
    fields: `d.id,d.slug,d.name,d.country,d.tagline,d.short_description AS "shortDescription",d.description,d.badge,
      ${media("h","NULL")} AS "heroImage",${media("f","NULL")} AS "featuredImage",
      (SELECT count(*)::int FROM trips t WHERE t.destination_id=d.id AND ${active("t")}) AS "tripsCount",
      COALESCE((SELECT jsonb_agg(t.slug ORDER BY t.published_at DESC NULLS LAST,t.id DESC) FROM trips t WHERE t.destination_id=d.id AND t.featured AND ${active("t")}), '[]'::jsonb) AS "featuredTrips",
      COALESCE((SELECT jsonb_agg(r.slug ORDER BY r.title,r.id) FROM regions r WHERE r.destination_id=d.id AND ${active("r")}), '[]'::jsonb) AS regions`,
    order: { name:"d.name,d.id", published:"d.published_at DESC NULLS LAST,d.id DESC" },
  },
  activities: {
    from: "FROM activities a LEFT JOIN media_assets h ON h.id=a.hero_media_id",
    where: [active("a")], count: "FROM activities a",
    fields: `a.id,a.slug,a.title,a.short_description AS "shortDescription",a.description,a.icon_name AS "iconName",a.badge,
      ${media("h","NULL")} AS "heroImage",
      (SELECT count(*)::int FROM trips t WHERE t.activity_id=a.id AND ${active("t")}) AS "tripsCount",
      COALESCE((SELECT jsonb_agg(t.slug ORDER BY t.published_at DESC NULLS LAST,t.id DESC) FROM trips t WHERE t.activity_id=a.id AND t.featured AND ${active("t")}), '[]'::jsonb) AS "featuredTrips"`,
    order: { title:"a.title,a.id", published:"a.published_at DESC NULLS LAST,a.id DESC" },
  },
  regions: {
    from: "FROM regions r JOIN destinations d ON d.id=r.destination_id LEFT JOIN media_assets h ON h.id=r.hero_media_id",
    where: [active("r"),active("d")], count: "FROM regions r JOIN destinations d ON d.id=r.destination_id",
    fields: `r.id,r.slug,r.title,r.subtitle,r.tagline,r.about_title AS "aboutTitle",r.about_paragraphs AS "aboutParagraphs",
      ${media("h","NULL")} AS "heroImage",jsonb_build_object('id',d.id,'slug',d.slug,'name',d.name,'country',d.country) AS destination,
      (SELECT count(*)::int FROM trips t WHERE t.region_id=r.id AND ${active("t")}) AS "tripsCount",
      COALESCE((SELECT jsonb_agg(t.slug ORDER BY t.published_at DESC NULLS LAST,t.id DESC) FROM trips t WHERE t.region_id=r.id AND t.featured AND ${active("t")}), '[]'::jsonb) AS "featuredTrips"`,
    order: { title:"r.title,r.id", published:"r.published_at DESC NULLS LAST,r.id DESC" },
  },
};
const tripFields = `t.id,t.slug,t.code,t.title,t.short_description AS "shortDescription",t.full_description AS "fullDescription",
  t.duration_days AS days,t.duration_days AS duration,t.duration_nights AS nights,COALESCE(t.sale_price,t.base_price) AS price,
  CASE WHEN t.sale_price IS NOT NULL THEN t.base_price ELSE NULL END AS "originalPrice",t.currency,t.difficulty,
  t.max_altitude_m AS "maxAltitudeM",COALESCE(t.max_altitude_label,CASE WHEN t.max_altitude_m IS NULL THEN NULL ELSE t.max_altitude_m::text||' m' END) AS "maxAltitude",
  t.min_group_size AS "minGroupSize",t.max_group_size AS "maxGroupSize",
  CASE WHEN t.min_group_size IS NULL AND t.max_group_size IS NULL THEN NULL ELSE concat_ws('-',t.min_group_size,t.max_group_size) END AS "groupSize",
  t.badge,t.featured,t.best_season AS "bestSeason",t.start_location AS "startLocation",t.end_location AS "endLocation",
  t.display_area AS "displayArea", COALESCE(t.group_pricing, '[]'::jsonb) AS "groupPricing", t.base_price AS "basePrice", t.sale_price AS "salePrice",
  jsonb_build_object('id',d.id,'slug',d.slug,'name',d.name,'country',d.country) AS destination,
  d.country AS country,r.title AS region,a.title AS activity,c.name AS category,
  CASE WHEN r.id IS NULL THEN NULL ELSE jsonb_build_object('id',r.id,'slug',r.slug,'title',r.title) END AS "regionInfo",
  CASE WHEN a.id IS NULL THEN NULL ELSE jsonb_build_object('id',a.id,'slug',a.slug,'title',a.title) END AS "activityInfo",
  CASE WHEN c.id IS NULL THEN NULL ELSE jsonb_build_object('id',c.id,'slug',c.slug,'name',c.name) END AS "categoryInfo",
  ${media("hm","NULL")} AS "heroImage",
    epm.public_url AS "elevationProfileUrl",
    rmm.public_url AS "routeMapUrl",
    t.video_url AS "videoUrl",
    COALESCE(t.departures, '[]'::jsonb) AS "departures",COALESCE(rv.rating,0)::numeric(3,2)::float AS rating,COALESCE(rv.total,0)::int AS "reviewCount",
  t.published_at AS "publishedAt"`;
const tripFrom = `FROM trips t JOIN destinations d ON d.id=t.destination_id AND ${active("d")} LEFT JOIN regions r ON r.id=t.region_id AND ${active("r")} LEFT JOIN media_assets epm ON epm.id=t.elevation_profile_media_id LEFT JOIN media_assets rmm ON rmm.id=t.route_map_media_id
  LEFT JOIN activities a ON a.id=t.activity_id AND ${active("a")} LEFT JOIN trip_categories c ON c.id=t.category_id AND c.status='active' LEFT JOIN media_assets hm ON hm.id=t.hero_media_id
  LEFT JOIN LATERAL (SELECT avg(rating) AS rating,count(*) AS total FROM reviews WHERE trip_id=t.id AND status='approved' AND deleted_at IS NULL) rv ON TRUE`;
function filter(where, values, clause, value) { if (value !== undefined) { values.push(value); where.push(clause.replace("?", "$"+values.length)); } }
function tripFilters(f) {
  const w=[active("t"),active("d")],v=[];
  filter(w,v,"d.slug = ?",f.destination); filter(w,v,"r.slug = ?",f.region); filter(w,v,"a.slug = ?",f.activity);
  filter(w,v,"c.slug = ?",f.category); filter(w,v,"t.difficulty = ?",f.difficulty); filter(w,v,"t.featured = ?",f.featured);
  filter(w,v,"COALESCE(t.sale_price,t.base_price) >= ?",f.minPrice); filter(w,v,"COALESCE(t.sale_price,t.base_price) <= ?",f.maxPrice);
  if(f.search){v.push("%"+f.search+"%");w.push("(t.title ILIKE $"+v.length+" OR t.short_description ILIKE $"+v.length+" OR t.full_description ILIKE $"+v.length+")");}
  return {w,v};
}
export async function listResource(type,f) {
  const c=entity[type],w=[...c.where],v=[];
  const col=type==="destinations"?"d.name":type==="activities"?"a.title":"r.title";
  if(f.search){v.push("%"+f.search+"%");w.push(col+" ILIKE $"+v.length);}
  if(type==="destinations"&&f.country){v.push(f.country);w.push("d.country=$"+v.length);}
  if(type==="regions"&&f.destination){v.push(f.destination);w.push("d.slug=$"+v.length);}
  return paged("SELECT "+c.fields+" "+c.from+" WHERE "+w.join(" AND ")+" ORDER BY "+c.order[f.sort]+" LIMIT $"+(v.length+1)+" OFFSET $"+(v.length+2),
    "SELECT count(*)::int AS total "+c.count+" WHERE "+w.join(" AND "),v,f);
}
export async function getResource(type,slug) {
  const c=entity[type],a=type==="destinations"?"d":type==="activities"?"a":"r";
  const q=await pool.query("SELECT "+c.fields+" "+c.from+" WHERE "+a+".slug=$1 AND "+c.where.join(" AND "),[slug]);
  if(!q.rowCount)return null;
  const x=q.rows[0];
  if(type==="destinations") {
    const [rs,ts]=await Promise.all([
      pool.query(`SELECT r.id,r.slug,r.title,r.subtitle,r.tagline,${media("m","NULL")} AS "heroImage" FROM regions r LEFT JOIN media_assets m ON m.id=r.hero_media_id WHERE r.destination_id=$1 AND ${active("r")} ORDER BY r.title,r.id`,[x.id]),
      pool.query(`SELECT ${tripFields} ${tripFrom} WHERE t.destination_id=$1 AND t.featured AND ${active("t")} AND ${active("d")} ORDER BY t.published_at DESC NULLS LAST,t.id DESC LIMIT 12`,[x.id]),
    ]); x.regionDetails=rs.rows;x.regions=rs.rows.map(r=>r.slug);x.featuredTripDetails=ts.rows;x.featuredTrips=ts.rows.map(t=>t.slug);
  } else if(type==="activities") {
    const ts=await pool.query(`SELECT ${tripFields} ${tripFrom} WHERE t.activity_id=$1 AND t.featured AND ${active("t")} AND ${active("d")} ORDER BY t.published_at DESC NULLS LAST,t.id DESC LIMIT 12`,[x.id]);x.featuredTripDetails=ts.rows;x.featuredTrips=ts.rows.map(t=>t.slug);
  } else {
    const [ts,places,experiences]=await Promise.all([
      pool.query(`SELECT ${tripFields} ${tripFrom} WHERE t.region_id=$1 AND ${active("t")} AND ${active("d")} ORDER BY t.featured DESC,t.published_at DESC NULLS LAST,t.id DESC`,[x.id]),
      pool.query(`SELECT p.source_id AS id,p.name,p.description,m.public_url AS image,p.href
        FROM region_popular_places p LEFT JOIN media_assets m ON m.id=p.media_id
        WHERE p.region_id=$1 AND p.status='published' ORDER BY p.sort_order,p.id`,[x.id]),
      pool.query(`SELECT e.source_id AS id,e.title,e.description,m.public_url AS image,e.badge
        FROM region_experiences e LEFT JOIN media_assets m ON m.id=e.media_id
        WHERE e.region_id=$1 AND e.status='published' ORDER BY e.sort_order,e.id`,[x.id]),
    ]);
    x.tripDetails=ts.rows;x.trips=ts.rows.map(t=>t.slug);x.featuredTrips=ts.rows.filter(t=>t.featured).map(t=>t.slug);
    x.popularPlaces=places.rows;x.experiences=experiences.rows;
  }
  return x;
}
export async function listTrips(f) {
  const {w,v}=tripFilters(f),orders={published:"t.published_at DESC NULLS LAST,t.id DESC",price:"COALESCE(t.sale_price,t.base_price),t.id",duration:"t.duration_days,t.id",title:"t.title,t.id"};
  return paged(`SELECT ${tripFields} ${tripFrom} WHERE ${w.join(" AND ")} ORDER BY ${orders[f.sort]} LIMIT $${v.length+1} OFFSET $${v.length+2}`,
    `SELECT count(*)::int AS total ${tripFrom} WHERE ${w.join(" AND ")}`,v,f);
}
export async function getTrip(slug) {
  const q=await pool.query(`SELECT ${tripFields} ${tripFrom} WHERE t.slug=$1 AND ${active("t")} AND ${active("d")}`,[slug]);
  if(!q.rowCount)return null;const t=q.rows[0],id=t.id;
  const [g,it,hi,inc,exc,faqs,rev]=await Promise.all([
    pool.query(`SELECT ${media("m","i.alt_text")} AS image FROM trip_images i JOIN media_assets m ON m.id=i.media_id WHERE i.trip_id=$1 ORDER BY i.sort_order,i.id`,[id]),
    pool.query(`SELECT tid.day_number AS "dayNumber",tid.title,tid.description,tid.altitude,tid.trekking_time AS "trekkingTime",tid.accommodation,tid.media_id AS "mediaId",tid.media_id_2 AS "mediaId2",m1.public_url AS "imageUrl",m2.public_url AS "imageUrl2",${media("m1","NULL")} AS image,${media("m2","NULL")} AS image2 FROM trip_itinerary_days tid LEFT JOIN media_assets m1 ON m1.id=tid.media_id LEFT JOIN media_assets m2 ON m2.id=tid.media_id_2 WHERE tid.trip_id=$1 ORDER BY tid.sort_order,tid.day_number,tid.id`,[id]),
    ...["highlights","inclusions","exclusions"].map(s=>pool.query("SELECT text FROM trip_"+s+" WHERE trip_id=$1 ORDER BY sort_order,id",[id])),
    pool.query("SELECT question,answer FROM faqs WHERE trip_id=$1 AND status='published' ORDER BY sort_order,id",[id]),
    pool.query(`SELECT rv.id,rv.rating,rv.message,rv.name,rv.location,rv.title,rv.created_at AS date,${media("m","NULL")} AS avatar FROM reviews rv LEFT JOIN media_assets m ON m.id=rv.photo_media_id WHERE rv.trip_id=$1 AND rv.status='approved' AND rv.deleted_at IS NULL ORDER BY rv.created_at DESC LIMIT 20`,[id]),
  ]);
  t.gallery=g.rows.map(r=>r.image);t.itinerary=it.rows;t.highlights=hi.rows.map(r=>r.text);t.inclusions=inc.rows.map(r=>r.text);t.exclusions=exc.rows.map(r=>r.text);t.faqs=faqs.rows;t.reviews=rev.rows;t.overview=t.fullDescription?[t.fullDescription]:[];
  return t;
}
const blogFields=`b.id,b.slug,b.title,b.description,b.published_at AS date,b.author,b.author_role AS "authorRole",b.hero_image_alt AS "heroImageAlt",b.intro,b.quote,
  c.name AS category,CASE WHEN c.id IS NULL THEN NULL ELSE jsonb_build_object('id',c.id,'slug',c.slug,'name',c.name) END AS "categoryInfo",
  ${media("hm","b.hero_image_alt")} AS "heroImage",${media("am","NULL")} AS "authorImage"`;
const blogFrom="FROM blogs b LEFT JOIN blog_categories c ON c.id=b.category_id AND c.status='active' LEFT JOIN media_assets hm ON hm.id=b.hero_media_id LEFT JOIN media_assets am ON am.id=b.author_media_id";
export async function listBlogs(f) {
  const w=[active("b")],v=[];if(f.search){v.push("%"+f.search+"%");w.push("(b.title ILIKE $"+v.length+" OR b.description ILIKE $"+v.length+")");}
  if(f.category){v.push(f.category);w.push("c.slug=$"+v.length+" AND c.status='active'");}
  const order=f.sort==="title"?"b.title,b.id":"b.published_at DESC NULLS LAST,b.id DESC";
  return paged("SELECT "+blogFields+" "+blogFrom+" WHERE "+w.join(" AND ")+" ORDER BY "+order+" LIMIT $"+(v.length+1)+" OFFSET $"+(v.length+2),
    "SELECT count(*)::int AS total "+blogFrom+" WHERE "+w.join(" AND "),v,f);
}
export async function getBlog(slug) {
  const q=await pool.query("SELECT "+blogFields+" "+blogFrom+" WHERE b.slug=$1 AND "+active("b"),[slug]);if(!q.rowCount)return null;
  const b=q.rows[0],sections=await pool.query(`SELECT s.id,s.title,s.image_alt AS "imageAlt",${media("m","s.image_alt")} AS image FROM blog_sections s LEFT JOIN media_assets m ON m.id=s.media_id WHERE s.blog_id=$1 ORDER BY s.sort_order,s.id`,[b.id]);
  const ids=sections.rows.map(s=>s.id),p=ids.length?await pool.query("SELECT blog_section_id,body FROM blog_section_paragraphs WHERE blog_section_id=ANY($1::bigint[]) ORDER BY sort_order,id",[ids]):{rows:[]};
  b.sections=sections.rows.map(s=>({...s,paragraphs:p.rows.filter(x=>String(x.blog_section_id)===String(s.id)).map(x=>x.body)}));return b;
}
export async function listReviews(f) {
  const w=["rv.status='approved'","rv.deleted_at IS NULL"],v=[];if(f.trip){v.push(f.trip);w.push("t.slug=$"+v.length);}
  const from=`FROM reviews rv LEFT JOIN trips t ON t.id=rv.trip_id AND ${active("t")} LEFT JOIN media_assets m ON m.id=rv.photo_media_id`;
  const fields=`rv.id,rv.rating,rv.message,rv.name,rv.location,rv.title,rv.created_at AS date,CASE WHEN t.id IS NULL THEN NULL ELSE jsonb_build_object('id',t.id,'slug',t.slug,'title',t.title) END AS trip,${media("m","NULL")} AS avatar`;
  return paged("SELECT "+fields+" "+from+" WHERE "+w.join(" AND ")+" ORDER BY rv.created_at DESC,rv.id DESC LIMIT $"+(v.length+1)+" OFFSET $"+(v.length+2),
    "SELECT count(*)::int AS total "+from+" WHERE "+w.join(" AND "),v,f);
}
export async function listFaqs(f) {
  const w=["f.status='published'","(f.trip_id IS NULL OR EXISTS(SELECT 1 FROM trips t WHERE t.id=f.trip_id AND "+active("t")+"))"],v=[];
  if(f.trip){v.push(f.trip);w.push("EXISTS(SELECT 1 FROM trips t WHERE t.id=f.trip_id AND t.slug=$"+v.length+" AND "+active("t")+")");}
  if(f.pageKey){v.push(f.pageKey);w.push("f.page_key=$"+v.length);}
  const from="FROM faqs f", fields='f.id,f.trip_id AS "tripId",f.page_key AS "pageKey",f.question,f.answer';
  return paged("SELECT "+fields+" "+from+" WHERE "+w.join(" AND ")+" ORDER BY f.sort_order,f.id LIMIT $"+(v.length+1)+" OFFSET $"+(v.length+2),
    "SELECT count(*)::int AS total "+from+" WHERE "+w.join(" AND "),v,f);
}
export async function listGallery(f) {
  const w=["g.status='published'","(g.trip_id IS NULL OR EXISTS(SELECT 1 FROM trips t WHERE t.id=g.trip_id AND "+active("t")+"))",
    "(g.blog_id IS NULL OR EXISTS(SELECT 1 FROM blogs b WHERE b.id=g.blog_id AND "+active("b")+"))"],v=[];
  if(f.trip){v.push(f.trip);w.push("EXISTS(SELECT 1 FROM trips t WHERE t.id=g.trip_id AND t.slug=$"+v.length+" AND "+active("t")+")");}
  if(f.search){v.push("%"+f.search+"%");w.push("(g.title ILIKE $"+v.length+" OR g.location ILIKE $"+v.length+")");}
  const from=`FROM gallery_items g JOIN media_assets m ON m.id=g.media_id LEFT JOIN trips t ON t.id=g.trip_id AND ${active("t")}`;
  const fields=`g.id,g.title,g.location,g.alt_text AS "altText",g.sort_order AS "sortOrder",CASE WHEN t.id IS NULL THEN NULL ELSE jsonb_build_object('id',t.id,'slug',t.slug,'title',t.title) END AS trip,${media("m","g.alt_text")} AS media`;
  return paged("SELECT "+fields+" "+from+" WHERE "+w.join(" AND ")+" ORDER BY g.sort_order,g.id LIMIT $"+(v.length+1)+" OFFSET $"+(v.length+2),
    "SELECT count(*)::int AS total "+from+" WHERE "+w.join(" AND "),v,f);
}
