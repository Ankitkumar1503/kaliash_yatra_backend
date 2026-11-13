--
-- PostgreSQL database dump
--

\restrict QHRdMdDFBJrjQAzp0pc7yRlWMs1GRA2erCPwhnSa8v5ZCXC4Z3bqJmFNd2BZxQZ

-- Dumped from database version 17.11 (Debian 17.11-1.pgdg12+2)
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'vendor',
    'admin'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id bigint NOT NULL,
    slug character varying(180) NOT NULL,
    title character varying(180) NOT NULL,
    short_description text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    hero_media_id bigint,
    icon_name character varying(100) DEFAULT ''::character varying NOT NULL,
    badge character varying(80),
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT activities_status_check CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('published'::character varying)::text, ('archived'::character varying)::text])))
);


--
-- Name: activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.activities ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: blog_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_categories (
    id bigint NOT NULL,
    slug character varying(180) NOT NULL,
    name character varying(180) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT blog_categories_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text])))
);


--
-- Name: blog_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.blog_categories ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.blog_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: blog_section_paragraphs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_section_paragraphs (
    id bigint NOT NULL,
    blog_section_id bigint NOT NULL,
    body text NOT NULL,
    sort_order integer NOT NULL,
    CONSTRAINT blog_section_paragraphs_sort_order_check CHECK ((sort_order >= 0))
);


--
-- Name: blog_section_paragraphs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.blog_section_paragraphs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.blog_section_paragraphs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: blog_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_sections (
    id bigint NOT NULL,
    blog_id bigint NOT NULL,
    title character varying(240) NOT NULL,
    media_id bigint,
    image_alt text,
    sort_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT blog_sections_sort_order_check CHECK ((sort_order >= 0))
);


--
-- Name: blog_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.blog_sections ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.blog_sections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: blogs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blogs (
    id bigint NOT NULL,
    slug character varying(220) NOT NULL,
    title character varying(240) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    published_at timestamp with time zone,
    author character varying(180) DEFAULT ''::character varying NOT NULL,
    author_role character varying(180) DEFAULT ''::character varying NOT NULL,
    author_media_id bigint,
    hero_media_id bigint,
    hero_image_alt text DEFAULT ''::text NOT NULL,
    category_id bigint,
    intro text,
    quote text,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    seo_title character varying(240),
    seo_description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT blogs_status_check CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('published'::character varying)::text, ('archived'::character varying)::text])))
);


--
-- Name: blogs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.blogs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.blogs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: destinations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.destinations (
    id bigint NOT NULL,
    slug character varying(180) NOT NULL,
    name character varying(180) NOT NULL,
    country character varying(120) NOT NULL,
    tagline text DEFAULT ''::text NOT NULL,
    short_description text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    hero_media_id bigint,
    featured_media_id bigint,
    badge character varying(80),
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT destinations_status_check CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('published'::character varying)::text, ('archived'::character varying)::text])))
);


--
-- Name: destinations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.destinations ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.destinations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: faqs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faqs (
    id bigint NOT NULL,
    trip_id bigint,
    page_key character varying(120),
    question text NOT NULL,
    answer text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT faqs_check CHECK (((trip_id IS NOT NULL) <> (page_key IS NOT NULL))),
    CONSTRAINT faqs_sort_order_check CHECK ((sort_order >= 0)),
    CONSTRAINT faqs_status_check CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('published'::character varying)::text, ('archived'::character varying)::text])))
);


--
-- Name: faqs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.faqs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.faqs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: gallery_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery_items (
    id bigint NOT NULL,
    media_id bigint NOT NULL,
    title character varying(240) NOT NULL,
    location character varying(180),
    alt_text text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    trip_id bigint,
    blog_id bigint,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source_id character varying(180),
    CONSTRAINT gallery_items_sort_order_check CHECK ((sort_order >= 0)),
    CONSTRAINT gallery_items_status_check CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('published'::character varying)::text, ('archived'::character varying)::text])))
);


--
-- Name: gallery_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.gallery_items ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.gallery_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: inquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inquiries (
    id bigint NOT NULL,
    trip_id bigint,
    type character varying(20) NOT NULL,
    name character varying(180) NOT NULL,
    email character varying(254) NOT NULL,
    phone character varying(80),
    travel_date date,
    travelers integer,
    message text,
    status character varying(20) DEFAULT 'new'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT inquiries_status_check CHECK (((status)::text = ANY (ARRAY[('new'::character varying)::text, ('in_progress'::character varying)::text, ('closed'::character varying)::text, ('converted'::character varying)::text]))),
    CONSTRAINT inquiries_travelers_check CHECK (((travelers IS NULL) OR (travelers > 0))),
    CONSTRAINT inquiries_type_check CHECK (((type)::text = ANY (ARRAY[('trip'::character varying)::text, ('contact'::character varying)::text, ('plan_my_trip'::character varying)::text])))
);


--
-- Name: inquiries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.inquiries ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.inquiries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: media_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_assets (
    id bigint NOT NULL,
    storage_key text NOT NULL,
    public_url text NOT NULL,
    media_type character varying(80) NOT NULL,
    alt_text text,
    width integer,
    height integer,
    file_size bigint,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT media_assets_file_size_check CHECK (((file_size IS NULL) OR (file_size >= 0))),
    CONSTRAINT media_assets_height_check CHECK (((height IS NULL) OR (height > 0))),
    CONSTRAINT media_assets_width_check CHECK (((width IS NULL) OR (width > 0)))
);


--
-- Name: media_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.media_assets ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.media_assets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_subscribers (
    id bigint NOT NULL,
    email character varying(254) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    subscribed_at timestamp with time zone DEFAULT now() NOT NULL,
    unsubscribed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT newsletter_subscribers_check CHECK (((((status)::text = 'active'::text) AND (unsubscribed_at IS NULL)) OR (((status)::text = 'unsubscribed'::text) AND (unsubscribed_at IS NOT NULL)))),
    CONSTRAINT newsletter_subscribers_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('unsubscribed'::character varying)::text])))
);


--
-- Name: newsletter_subscribers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_subscribers ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.newsletter_subscribers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id bigint NOT NULL,
    key character varying(100) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.permissions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: region_experiences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.region_experiences (
    id bigint NOT NULL,
    source_id character varying(180) NOT NULL,
    region_id bigint NOT NULL,
    title character varying(240) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    media_id bigint,
    badge character varying(80),
    sort_order integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT region_experiences_sort_order_check CHECK ((sort_order >= 0)),
    CONSTRAINT region_experiences_status_check CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('published'::character varying)::text, ('archived'::character varying)::text])))
);


--
-- Name: region_experiences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.region_experiences ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.region_experiences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: region_popular_places; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.region_popular_places (
    id bigint NOT NULL,
    source_id character varying(180) NOT NULL,
    region_id bigint NOT NULL,
    name character varying(240) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    media_id bigint,
    href text,
    sort_order integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT region_popular_places_sort_order_check CHECK ((sort_order >= 0)),
    CONSTRAINT region_popular_places_status_check CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('published'::character varying)::text, ('archived'::character varying)::text])))
);


--
-- Name: region_popular_places_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.region_popular_places ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.region_popular_places_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regions (
    id bigint NOT NULL,
    destination_id bigint NOT NULL,
    slug character varying(180) NOT NULL,
    title character varying(180) NOT NULL,
    subtitle text DEFAULT ''::text NOT NULL,
    tagline text DEFAULT ''::text NOT NULL,
    hero_media_id bigint,
    about_title character varying(240) DEFAULT ''::character varying NOT NULL,
    about_paragraphs text[] DEFAULT '{}'::text[] NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT regions_status_check CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('published'::character varying)::text, ('archived'::character varying)::text])))
);


--
-- Name: regions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.regions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.regions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id bigint NOT NULL,
    trip_id bigint,
    name character varying(180) NOT NULL,
    email character varying(254),
    location character varying(180) DEFAULT ''::character varying NOT NULL,
    title character varying(240),
    message text NOT NULL,
    rating smallint NOT NULL,
    photo_media_id bigint,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    source_id character varying(180),
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT reviews_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('hidden'::character varying)::text])))
);


--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.reviews ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id bigint NOT NULL,
    permission_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    key character varying(80) NOT NULL,
    name character varying(120) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    is_system boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.roles ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    name character varying(255) NOT NULL,
    checksum character(64) NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: trip_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_categories (
    id bigint NOT NULL,
    slug character varying(180) NOT NULL,
    name character varying(180) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    media_id bigint,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT trip_categories_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text])))
);


--
-- Name: trip_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.trip_categories ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.trip_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: trip_exclusions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_exclusions (
    id bigint NOT NULL,
    trip_id bigint NOT NULL,
    text text NOT NULL,
    sort_order integer NOT NULL,
    CONSTRAINT trip_exclusions_sort_order_check CHECK ((sort_order >= 0))
);


--
-- Name: trip_exclusions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.trip_exclusions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.trip_exclusions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: trip_highlights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_highlights (
    id bigint NOT NULL,
    trip_id bigint NOT NULL,
    text text NOT NULL,
    sort_order integer NOT NULL,
    CONSTRAINT trip_highlights_sort_order_check CHECK ((sort_order >= 0))
);


--
-- Name: trip_highlights_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.trip_highlights ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.trip_highlights_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: trip_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_images (
    id bigint NOT NULL,
    trip_id bigint NOT NULL,
    media_id bigint NOT NULL,
    alt_text text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_hero boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT trip_images_sort_order_check CHECK ((sort_order >= 0))
);


--
-- Name: trip_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.trip_images ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.trip_images_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: trip_inclusions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_inclusions (
    id bigint NOT NULL,
    trip_id bigint NOT NULL,
    text text NOT NULL,
    sort_order integer NOT NULL,
    CONSTRAINT trip_inclusions_sort_order_check CHECK ((sort_order >= 0))
);


--
-- Name: trip_inclusions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.trip_inclusions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.trip_inclusions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: trip_itinerary_days; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_itinerary_days (
    id bigint NOT NULL,
    trip_id bigint NOT NULL,
    day_number integer NOT NULL,
    title character varying(240) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    altitude text,
    trekking_time text,
    accommodation text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    media_id bigint,
    media_id_2 bigint,
    CONSTRAINT trip_itinerary_days_day_number_check CHECK ((day_number > 0)),
    CONSTRAINT trip_itinerary_days_sort_order_check CHECK ((sort_order >= 0))
);


--
-- Name: trip_itinerary_days_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.trip_itinerary_days ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.trip_itinerary_days_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: trips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trips (
    id bigint NOT NULL,
    slug character varying(220) NOT NULL,
    code character varying(80),
    title character varying(240) NOT NULL,
    short_description text DEFAULT ''::text NOT NULL,
    full_description text DEFAULT ''::text NOT NULL,
    destination_id bigint NOT NULL,
    region_id bigint,
    activity_id bigint,
    category_id bigint,
    duration_days integer NOT NULL,
    duration_nights integer,
    difficulty character varying(20),
    max_altitude_m integer,
    max_altitude_label text,
    min_group_size integer,
    max_group_size integer,
    start_location text DEFAULT ''::text NOT NULL,
    end_location text DEFAULT ''::text NOT NULL,
    best_season text DEFAULT ''::text NOT NULL,
    base_price numeric(12,2) NOT NULL,
    sale_price numeric(12,2),
    currency character(3) DEFAULT 'USD'::bpchar NOT NULL,
    single_supplement numeric(12,2),
    child_price numeric(12,2),
    featured boolean DEFAULT false NOT NULL,
    badge character varying(80),
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    published_at timestamp with time zone,
    seo_title character varying(240),
    seo_description text,
    hero_media_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    display_area text,
    group_pricing jsonb DEFAULT '[]'::jsonb,
    elevation_profile_media_id bigint,
    route_map_media_id bigint,
    video_url text,
    departures jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT trips_base_price_check CHECK ((base_price >= (0)::numeric)),
    CONSTRAINT trips_check CHECK (((sale_price IS NULL) OR ((sale_price >= (0)::numeric) AND (sale_price <= base_price)))),
    CONSTRAINT trips_check1 CHECK (((max_group_size IS NULL) OR (min_group_size IS NULL) OR (max_group_size >= min_group_size))),
    CONSTRAINT trips_child_price_check CHECK (((child_price IS NULL) OR (child_price >= (0)::numeric))),
    CONSTRAINT trips_currency_check CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT trips_difficulty_check CHECK (((difficulty IS NULL) OR ((difficulty)::text = ANY (ARRAY[('easy'::character varying)::text, ('moderate'::character varying)::text, ('challenging'::character varying)::text, ('strenuous'::character varying)::text])))),
    CONSTRAINT trips_duration_days_check CHECK ((duration_days > 0)),
    CONSTRAINT trips_duration_nights_check CHECK (((duration_nights IS NULL) OR (duration_nights >= 0))),
    CONSTRAINT trips_max_altitude_m_check CHECK (((max_altitude_m IS NULL) OR (max_altitude_m > 0))),
    CONSTRAINT trips_max_group_size_check CHECK (((max_group_size IS NULL) OR (max_group_size > 0))),
    CONSTRAINT trips_min_group_size_check CHECK (((min_group_size IS NULL) OR (min_group_size > 0))),
    CONSTRAINT trips_single_supplement_check CHECK (((single_supplement IS NULL) OR (single_supplement >= (0)::numeric))),
    CONSTRAINT trips_status_check CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('published'::character varying)::text, ('archived'::character varying)::text])))
);


--
-- Name: trips_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.trips ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.trips_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id bigint NOT NULL,
    role_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(120) NOT NULL,
    email character varying(190) NOT NULL,
    password_hash character varying(100) NOT NULL,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_email_lower CHECK (((email)::text = lower((email)::text)))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activities (id, slug, title, short_description, description, hero_media_id, icon_name, badge, status, published_at, created_at, updated_at, deleted_at) FROM stdin;
15	trekking	Trekking & Mountaineering	High-altitude mountain passes, base camp expeditions, and alpine trails.	Trek along legendary Himalayan trails with certified Sherpa guides, stay in cozy teahouses, and gaze upon the highest peaks on planet Earth.	20	hiking	POPULAR	published	2026-09-30 18:24:52.894+00	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N
16	cultural-tours	Cultural & Heritage Tours	Centuries-old UNESCO temples, sacred stupas, monasteries, and living crafts.	Immerse yourself in authentic rituals, living festivals, ancient palace squares, and historic Buddhist Dzongs across Nepal, Bhutan, Tibet, and India.	21	temple	HERITAGE	published	2026-09-30 18:24:52.894+00	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N
17	spiritual-journeys	Spiritual & Pilgrimage Yatra	Sacred Mount Kailash, holy Lake Mansarovar, Muktinath, and Buddhist circuits.	Deeply transformative pilgrimages to sacred mountain peaks, ancient meditation caves, and blessed waters of the Himalayas.	24	spiritual	SACRED	published	2026-09-30 18:24:52.894+00	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N
18	adventure-sports	Himalayan Adventure & Rafting	Whitewater rapids, paragliding over mountain lakes, and jungle safaris.	Experience adrenaline-fueled whitewater expeditions, scenic mountain flights, ultralight adventures, and deep canyoning.	28	rafting	ADVENTURE	published	2026-09-30 18:24:52.894+00	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N
19	wildlife-nature	Wildlife Safaris & Nature	Chitwan National Park, one-horned rhinos, Bengal tigers, and bird sanctuaries.	Encounter rare one-horned rhinoceroses, Royal Bengal tigers, wild elephants, and exotic Himalayan flora in pristine national parks.	29	safari	WILDLIFE	published	2026-09-30 18:24:52.894+00	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N
41	testing	testing	testing	testing	\N		Pilgrimage	published	2026-10-11 08:35:14.88+00	2026-10-11 08:35:14.881992+00	2026-10-11 08:35:14.881992+00	\N
\.


--
-- Data for Name: blog_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_categories (id, slug, name, status, created_at, updated_at) FROM stdin;
1	trekking-expeditions	Trekking & Expeditions	active	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
2	travel-guides	Travel Guides	active	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
3	pilgrimage	Pilgrimage	active	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
4	cultural-tours	Cultural Tours	active	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
12	testing	testing	active	2026-10-11 08:42:09.904868+00	2026-10-11 08:42:09.904868+00
\.


--
-- Data for Name: blog_section_paragraphs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_section_paragraphs (id, blog_section_id, body, sort_order) FROM stdin;
9	9	For many, Everest Base Camp (EBC) is more than a destination — it's a dream. A journey to the foot of the world's highest peak represents adventure, personal growth and a connection with nature that few experiences can match.	0
10	9	The trek begins in the vibrant city of Kathmandu, where ancient temples, bustling streets and warm smiles set the tone for the adventure ahead.	1
11	10	As you make your way through charming Sherpa villages like Namche Bazaar, Tengboche and Dingboche, you'll be surrounded by incredible landscape, prayer flags fluttering in the wind and the rich culture of the people.	0
12	10	Daily life on the trail offers a humbling reminder of resilience and simple contentment.	1
13	11	Reaching Everest Base Camp at 5,364 meters is a monumental moment.	0
14	11	Standing at the base of the world's tallest peak surrounded by ancient glaciers, you'll feel a profound sense of accomplishment and awe. The vistas across the Khumbu Icefall and towering peaks are a reward that stays with you forever.	1
15	12	The lessons of the trail stay with you long after the trek is over — from learning to pace yourself to appreciating the warmth of a shared meal in a mountain teahouse.	0
16	12	It's a journey that transforms your perspective on what's possible.	1
17	13	Nepal welcomes international adventurers with instant on-arrival visas, world-class trekking infrastructure, and unmatched warm hospitality.	0
18	14	Bhutan has reopened its scenic valleys with an emphasis on sustainable, low-impact luxury travel.	0
19	15	Revered by over a billion people across Hinduism, Buddhism, Jainism, and Bon, Mount Kailash is considered the cosmological center of the universe.	0
20	16	Clinging to a vertical granite cliff 900 meters above Paro Valley, this iconic monastery is Bhutan's most sacred cultural treasure.	0
21	17	May to September provides moderate temperatures, clear visibility, and open high mountain passes like Dolma La (5,630m).	0
22	17	June, July, and August coincide with the auspicious Saga Dawa festival and full-moon dates, where pilgrims circle Kailash under illuminated skies.	1
23	18	The golden rule of high altitude is gradual ascent. Never gain more than 400-500 meters of sleeping altitude in a single day once past 3,000 meters.	0
24	18	Keep hydrated with at least 3-4 liters of water and garlic soup daily, and listen closely to your body.	1
25	19	Rising early at 4 AM from High Camp to cross Thorong La at 5,416 meters is an adrenaline-filled triumph accompanied by fluttering prayer flags and panoramic views.	0
26	20	Located in the Tashi Palkhel Tibetan Settlement, this monastery features deep monk chanting sessions every afternoon that captivate visitors from across the globe.	0
63	48	testing	0
64	49	Mount Kailash and Lake Mansarovar are among the most revered pilgrimage destinations in the Himalayan region. Mount Kailash holds profound spiritual significance in Hinduism and is also sacred in Buddhism, Jainism and the Bon tradition.	0
65	49	Lake Mansarovar is known for its religious importance and dramatic high-altitude setting. For many pilgrims, visiting this region represents an opportunity for prayer, reflection and a deeper connection with their spiritual beliefs.	1
66	49	The journey is also physically demanding. Travellers should prepare for long transfers, changing weather, high elevations and limited facilities in remote areas. Understanding the route and the conditions before departure is an important part of planning a responsible pilgrimage.	2
\.


--
-- Data for Name: blog_sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_sections (id, blog_id, title, media_id, image_alt, sort_order, created_at, updated_at) FROM stdin;
9	17	1. The Dream Begins	46	Hiker standing on cliff edge overlooking turquoise mountain lake and snow covered peaks	0	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
10	17	2. Trails, Villages & Warm Smiles	\N	\N	1	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
11	17	3. The Reward: Everest Base Camp	\N	\N	2	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
12	17	4. More Than Just a Trek	\N	\N	3	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
13	18	1. Nepal: The Kingdom of High Peaks	39	Green jagged peaks in Nepal	0	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
14	18	2. Bhutan: Untouched Himalayan Harmony	\N	\N	1	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
15	19	1. The Sacred Axis of the World	\N	\N	0	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
16	20	1. Paro Taktsang (Tiger's Nest)	\N	\N	0	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
17	21	1. The Ideal Window: May to September	46	Pilgrims trekking along Mount Kailash north face	0	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
18	22	1. Climb High, Sleep Low	\N	\N	0	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
19	23	1. Conquering Thorong La Pass	\N	\N	0	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
20	24	1. Jangchub Choeling Monastery	\N	\N	0	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
48	54	Article Overview	\N	testing	0	2026-10-11 08:41:55.955447+00	2026-10-11 08:41:55.955447+00
49	55	Understanding the Kailash Mansarovar Yatra	\N	\N	0	2026-10-13 11:08:03.784013+00	2026-10-13 11:08:03.784013+00
\.


--
-- Data for Name: blogs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blogs (id, slug, title, description, published_at, author, author_role, author_media_id, hero_media_id, hero_image_alt, category_id, intro, quote, status, seo_title, seo_description, created_at, updated_at, deleted_at) FROM stdin;
17	everest-base-camp-a-journey-that-changes-you	Everest Base Camp: A Journey That Changes You	From breathtaking views to unforgettable life lessons, discover why Everest Base Camp is more than just a trek — it's a transformative experience.	2022-09-22 00:00:00+00	Sarah Mitchell	Travel Enthusiast & Writer	45	24	Himalayan mountain landscape with prayer flags overlooking Mount Everest	1	For many, Everest Base Camp (EBC) is more than a destination — it's a lifelong dream. A journey to the foot of the world's highest peak represents adventure, personal growth, and an intimate connection with nature that few experiences on Earth can rival.	The mountains teach us that it's not about how fast you reach the top, but about the courage to keep going.	published	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N
54	testing	testing	testing	2026-10-11 08:41:55.957+00	Editorial Team	Travel Guide & Writer	\N	\N	testing	2	testing	testing	published	testing	testing	2026-10-11 08:41:55.955447+00	2026-10-11 08:41:55.955447+00	\N
55	kailash-mansarovar-yatra-preparation-guide	Kailash Mansarovar Yatra Preparation Guide	Planning a Kailash Mansarovar Yatra? Learn about travel documents, permits, high-altitude preparation, packing essentials, acclimatization and important travel tips before beginning this sacred Himalayan pilgrimage.	2026-10-13 11:08:03.785+00	Editorial Team	Travel Guide & Writer	\N	\N	Mount Kailash rising above the Tibetan Plateau during a sacred Himalayan pilgrimage	4	A journey to Mount Kailash and Lake Mansarovar is a deeply meaningful pilgrimage for travellers from different religious traditions. Careful planning, suitable preparation and an understanding of the route can help pilgrims approach the journey with greater confidence.	Prepare well, travel responsibly, and approach the sacred landscapes of Kailash Mansarovar with respect.	published	Kailash Mansarovar Yatra Preparation Guide | Kailash Yatra Guide	Prepare for the Kailash Mansarovar Yatra with practical guidance on permits, route selection, high-altitude fitness, packing essentials and responsible travel.	2026-10-13 11:08:03.784013+00	2026-10-13 11:08:03.784013+00	\N
24	top-monasteries-pokhara	Top 5 Monasteries to Visit Around Pokhara	Peaceful Tibetan settlements, chanting halls, golden statues, and panoramic mountain views in Pokhara.	2022-08-28 00:00:00+00	Sarah Mitchell	Travel Enthusiast & Writer	45	49	Tibetan monastery in Pokhara with prayer wheels	4	Beyond its tranquil lakes and paragliding thrills, Pokhara is home to historic Buddhist monasteries where serene chants echo against the backdrop of Machapuchare.	Silence is the sanctuary where peace of mind begins.	archived	\N	\N	2026-09-30 18:24:25.552858+00	2026-10-13 11:08:27.191653+00	2026-10-13 11:08:27.191653+00
23	annapurna-circuit-complete-guide	Annapurna Circuit: The Ultimate Himalayan Classic Trek	From subtropical rice terraces to Thorong La Pass at 5,416m, here is what makes the Annapurna Circuit an unforgettable adventure.	2022-09-02 00:00:00+00	Admin	Senior Destination Editor	48	38	Annapurna mountain range towering over green valley	1	Crossing through diverse ethnic settlements, climate zones, and dramatic landscapes, the Annapurna Circuit is widely considered one of the world's greatest long-distance treks.	In the Himalayas, every sunrise is a rebirth of wonder.	archived	\N	\N	2026-09-30 18:24:25.552858+00	2026-10-13 11:08:34.155463+00	2026-10-13 11:08:34.155463+00
22	high-altitude-guide	A Complete Guide to Preparing for High-Altitude Trekking	Essential acclimatization tips, physical conditioning, hydration rules, and gear guidelines for high Himalayan treks.	2022-09-10 00:00:00+00	Sarah Mitchell	Travel Enthusiast & Writer	45	40	Trekker standing at high mountain pass overlooking Himalayan valley	1	Ascending above 3,500 meters introduces low atmospheric pressure and thin air. Proper preparation transforms a grueling hike into a joyful mountain journey.	Respect the mountain and pace your breath — the summit will wait for you.	archived	\N	\N	2026-09-30 18:24:25.552858+00	2026-10-13 11:08:39.865303+00	2026-10-13 11:08:39.865303+00
21	best-time-kailash	Best Time to Visit Kailash Mansarovar for the Holy Yatra	A seasonal breakdown of weather, temperatures, visa windows, and full moon dates for the sacred Kailash Mansarovar Yatra.	2022-09-14 00:00:00+00	Tenzin Dorje	Tibetan Expedition Specialist	47	24	Mount Kailash peak illuminated by golden sunrise	3	Planning a pilgrimage to Mount Kailash requires careful timing. High elevation and unpredictable Tibetan plateau weather mean picking the right month is crucial.	Every step around Kailash is a prayer for peace and purification.	archived	\N	\N	2026-09-30 18:24:25.552858+00	2026-10-13 11:08:44.498699+00	2026-10-13 11:08:44.498699+00
20	top-10-places-to-visit-in-bhutan	Top 10 Places to Visit in Bhutan: The Land of Happiness	From the cliffside Tiger's Nest to Dochula Pass and valley fortresses, explore the top highlights of Bhutan.	2026-03-05 00:00:00+00	Sarah Mitchell	Travel Enthusiast & Writer	45	22	Tiger's Nest Monastery perched on cliff in Bhutan	4	Bhutan remains an enchanting mystery for most travelers. Here are the top ten breathtaking places that will make your journey unforgettable.	Happiness is not something ready-made. It comes from your own actions.	archived	\N	\N	2026-09-30 18:24:25.552858+00	2026-10-13 11:08:49.477517+00	2026-10-13 11:08:49.477517+00
19	kailash-mansarovar-spiritual-guide	Complete Spiritual Guide to Mount Kailash & Mansarovar Yatra	Everything you need to know about the holy 52 km Parikrama, high-altitude preparation, rituals, and sacred Tibetan heritage.	2022-09-18 00:00:00+00	Rajesh Sharma	Spiritual Tour Director	48	24	Mount Kailash sacred summit with prayer flags	3	Undertaking the sacred Kora around holy Mount Kailash and bathing in the divine waters of Lake Mansarovar is considered the ultimate spiritual quest.	In the presence of Mount Kailash, all earthly pride dissolves into profound reverence.	archived	\N	\N	2026-09-30 18:24:25.552858+00	2026-10-13 11:08:54.286645+00	2026-10-13 11:08:54.286645+00
18	countries-open-right-now	Where can I go? 5 amazing countries that are open right now	Explore the top mountain and cultural destinations welcoming international travelers with seamless visa policies and pristine landscapes.	2022-09-22 00:00:00+00	Admin	Senior Destination Editor	47	31	Turquoise alpine lake with traveler gazing at mountains	2	With international borders wide open and simplified visa-on-arrival entry, now is the golden era to explore the Himalayas, Southeast Asia, and ancient trade routes with tranquility.	To travel is to discover that everyone is wrong about other countries.	archived	\N	\N	2026-09-30 18:24:25.552858+00	2026-10-13 11:08:58.256945+00	2026-10-13 11:08:58.256945+00
\.


--
-- Data for Name: destinations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.destinations (id, slug, name, country, tagline, short_description, description, hero_media_id, featured_media_id, badge, status, published_at, created_at, updated_at, deleted_at) FROM stdin;
78	testing	testing	Nepal		testing	testing	\N	\N	\N	published	2026-10-11 08:33:23.252+00	2026-10-11 08:33:23.254551+00	2026-10-11 08:33:23.254551+00	\N
79	america	America	Nepal		Testing	Testing	153	\N	\N	published	2026-10-12 22:01:47.556+00	2026-10-12 22:01:47.559652+00	2026-10-12 22:01:47.559652+00	\N
34	nepal	Nepal	Nepal	The Land of Himalayas & Sacred Living Traditions	Home to eight of the world's fourteen highest peaks including Mount Everest, birthplace of Lord Buddha, and ancient UNESCO medieval cities.	From the towering heights of the Annapurna and Everest ranges to the spiritual sanctuaries of Lumbini and Kathmandu Valley, Nepal offers an unmatched combination of thrilling trekking, diverse wildlife, and living cultural heritage.	20	21	TOP DESTINATION	published	2026-09-30 18:24:52.894+00	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N
35	bhutan	Bhutan	Bhutan	The Kingdom of Thunder Dragon & Gross National Happiness	A serene Himalayan kingdom where Buddhist traditions, cliffside monasteries, and untouched alpine valleys merge seamlessly.	Bhutan remains one of the world's most exclusive destinations. Discover ancient Dzongs (fortresses), hike to the cliff-hanging Tiger's Nest Monastery, and experience a culture that measures progress through happiness and environmental harmony.	22	23	EXCLUSIVE	published	2026-09-30 18:24:52.894+00	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N
36	tibet	Tibet	Tibet	The Sacred Roof of the World & Holy Mount Kailash	Spiritual epicenter of Tibetan Buddhism, sacred high-altitude lakes, ancient monastic libraries, and the holy Mount Kailash circuit.	Traverse the windswept Tibetan plateau, explore the grand Potala Palace in Lhasa, marvel at holy Lake Mansarovar, and undertake the transformative Kailash Kora pilgrim circuit revered by Buddhists, Hindus, and Jains worldwide.	24	25	SPIRITUAL	published	2026-09-30 18:24:52.894+00	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N
37	india	India	India	Timeless Heritage, Royal Palaces & Himalayan Frontiers	From the royal heritage of Rajasthan and Taj Mahal to spiritual Rishikesh and the high-altitude deserts of Ladakh and Sikkim.	India is an endlessly vibrant tapestry of sacred rivers, golden fortresses, spiritual ghats, and Himalayan sanctuaries. Journey across the Golden Triangle, explore sacred Buddhist pilgrimage sites, or trek into Ladakh's moonscapes.	26	27	CULTURAL	published	2026-09-30 18:24:52.894+00	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N
\.


--
-- Data for Name: faqs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.faqs (id, trip_id, page_key, question, answer, sort_order, status, created_at, updated_at) FROM stdin;
12	10	\N	How do you handle altitude sickness (AMS)?	Our itinerary includes two full acclimatization rest days in Namche Bazaar and Dingboche. Guides monitor blood oxygen saturation twice daily with pulse oximeters and carry supplemental oxygen for emergencies.	1	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
16	11	\N	What permits are required for Tibet and Mount Kailash?	All Tibet permits, military permits, and China group visas are fully processed and provided by our team. We handle all paperwork seamlessly.	1	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
17	12	\N	When is the best time for the Annapurna Circuit?	March to May and October to November provide the best weather and clearest mountain views.	0	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
18	13	\N	Is Bhutan visa included?	Yes, our team arranges all visa approvals and covers the official Sustainable Development Fee.	0	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
42	33	\N	What packing gear is required?	Warm thermal layers, high altitude trekking boots, down jacket.	0	published	2026-10-11 19:14:28.938907+00	2026-10-11 19:14:28.938907+00
79	34	\N	How difficult is the Kailash Mansarovar Yatra?	The journey involves high-altitude travel, long road journeys and potentially strenuous walking. The Kailash Kora includes a high pass, so travellers should obtain medical advice and assess their fitness before booking.	0	published	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00
81	34	\N	Can every pilgrim complete the Kailash Parikrama?	No. Completion depends on health, fitness, weather, local rules and operating conditions. Customers should not assume that the Kora is guaranteed.	2	published	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00
\.


--
-- Data for Name: gallery_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gallery_items (id, media_id, title, location, alt_text, sort_order, trip_id, blog_id, status, created_at, updated_at, source_id) FROM stdin;
88	154	testing	Tibet	Testing	1	34	\N	published	2026-10-12 22:03:09.090817+00	2026-10-12 22:03:09.090817+00	\N
87	150	kailash mansarover yatra	\N	adv-1	0	34	\N	published	2026-10-12 20:52:16.272695+00	2026-10-12 20:52:16.272695+00	\N
89	155	testing	india	65d1c7b60412ad5e1b176f6058ca5fd5	2	\N	\N	published	2026-10-12 22:03:35.482676+00	2026-10-12 22:03:35.482676+00	\N
91	157	testing	testing	adv-3	4	34	\N	published	2026-10-12 22:04:42.070738+00	2026-10-12 22:04:42.070738+00	\N
\.


--
-- Data for Name: inquiries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inquiries (id, trip_id, type, name, email, phone, travel_date, travelers, message, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: media_assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media_assets (id, storage_key, public_url, media_type, alt_text, width, height, file_size, created_by, created_at, updated_at) FROM stdin;
154	uploads/2026/10/0ed5f181-376a-4e56-b312-8cb41626f3f0.jpg	/uploads/2026/10/0ed5f181-376a-4e56-b312-8cb41626f3f0.jpg	image/jpeg	adv-4	1024	1024	1079089	27	2026-10-12 22:03:06.39637+00	2026-10-12 22:03:06.39637+00
120	uploads/2026/10/a9cb90ab-f6b8-4d20-8f79-9f6e59cf8a2d.png	/uploads/2026/10/a9cb90ab-f6b8-4d20-8f79-9f6e59cf8a2d.png	image/png	Reference 2	2094	751	2022172	27	2026-10-11 18:47:42.540678+00	2026-10-11 18:47:42.540678+00
122	uploads/2026/10/83d6bf1b-c2fa-4256-ac18-6efd162fe060.png	/uploads/2026/10/83d6bf1b-c2fa-4256-ac18-6efd162fe060.png	image/png	Reference 2	2094	751	2022172	27	2026-10-11 18:51:00.857519+00	2026-10-11 18:51:00.857519+00
125	uploads/2026/10/fc01ea43-483b-4625-867d-443737605109.jpg	/uploads/2026/10/fc01ea43-483b-4625-867d-443737605109.jpg	image/jpeg	adv-1	1376	768	880602	27	2026-10-11 19:13:58.853227+00	2026-10-11 19:13:58.853227+00
126	uploads/2026/10/615b4d82-b55d-4f48-9818-5a663c83d56b.jpg	/uploads/2026/10/615b4d82-b55d-4f48-9818-5a663c83d56b.jpg	image/jpeg	adv-1	1376	768	880602	27	2026-10-11 19:14:11.315376+00	2026-10-11 19:14:11.315376+00
127	uploads/2026/10/75b14003-e2bc-4bb3-927e-cfb52415bfa1.png	/uploads/2026/10/75b14003-e2bc-4bb3-927e-cfb52415bfa1.png	image/png	Reference 2	2094	751	2022172	27	2026-10-11 19:14:21.39899+00	2026-10-11 19:14:21.39899+00
128	uploads/2026/10/f4dea444-5ce1-4477-ad71-42f9e30019ae.jpg	/uploads/2026/10/f4dea444-5ce1-4477-ad71-42f9e30019ae.jpg	image/jpeg	adv-1	1376	768	880602	27	2026-10-12 17:18:18.426486+00	2026-10-12 17:18:18.426486+00
131	uploads/2026/10/cb2c1409-f168-4782-a899-aba6ce2272ce.jpg	/uploads/2026/10/cb2c1409-f168-4782-a899-aba6ce2272ce.jpg	image/jpeg	adv-1	1376	768	880602	27	2026-10-12 17:55:21.779732+00	2026-10-12 17:55:21.779732+00
132	uploads/2026/10/a723ae6d-73dc-4c76-a892-cb86d152bda4.jpg	/uploads/2026/10/a723ae6d-73dc-4c76-a892-cb86d152bda4.jpg	image/jpeg	adv-2	1200	896	1121194	27	2026-10-12 17:55:27.072401+00	2026-10-12 17:55:27.072401+00
137	uploads/2026/10/08121227-85e6-405c-ae49-72061ec3daa0.jpg	/uploads/2026/10/08121227-85e6-405c-ae49-72061ec3daa0.jpg	image/jpeg	adv-1	1376	768	880602	27	2026-10-12 18:45:16.208837+00	2026-10-12 18:45:16.208837+00
138	uploads/2026/10/2e30c0af-84e0-49f3-8f24-32611422883d.jpg	/uploads/2026/10/2e30c0af-84e0-49f3-8f24-32611422883d.jpg	image/jpeg	adv-2	1200	896	1121194	27	2026-10-12 18:45:23.079368+00	2026-10-12 18:45:23.079368+00
139	uploads/2026/10/c2d614f2-c45e-4e31-a416-e56cdd49444d.jpg	/uploads/2026/10/c2d614f2-c45e-4e31-a416-e56cdd49444d.jpg	image/jpeg	adv-1	1376	768	880602	27	2026-10-12 18:45:37.312685+00	2026-10-12 18:45:37.312685+00
140	uploads/2026/10/17e2cf0b-871d-462f-94df-f81448327bd0.jpg	/uploads/2026/10/17e2cf0b-871d-462f-94df-f81448327bd0.jpg	image/jpeg	adv-2	1200	896	1121194	27	2026-10-12 18:45:42.75298+00	2026-10-12 18:45:42.75298+00
141	uploads/2026/10/b4d5b112-1bf0-4ad9-9537-fc0d4b4fa15e.jpg	/uploads/2026/10/b4d5b112-1bf0-4ad9-9537-fc0d4b4fa15e.jpg	image/jpeg	adv-1	1376	768	880602	27	2026-10-12 18:45:48.509465+00	2026-10-12 18:45:48.509465+00
142	uploads/2026/10/5f4345da-7a41-4c0e-9f6e-cfa7080cbabc.jpg	/uploads/2026/10/5f4345da-7a41-4c0e-9f6e-cfa7080cbabc.jpg	image/jpeg	adv-4	1024	1024	1079089	27	2026-10-12 18:45:53.31762+00	2026-10-12 18:45:53.31762+00
145	uploads/2026/10/5d7241fd-999e-4dc6-bd5a-e23446bb085f.png	/uploads/2026/10/5d7241fd-999e-4dc6-bd5a-e23446bb085f.png	image/png	Reference 2	2094	751	2022172	27	2026-10-12 19:10:01.122665+00	2026-10-12 19:10:01.122665+00
146	uploads/2026/10/770c5563-e8e2-47aa-8f1b-6841784bc0ed.png	/uploads/2026/10/770c5563-e8e2-47aa-8f1b-6841784bc0ed.png	image/png	ChatGPT Image Sep 22, 2026, 02_48_19 PM	2048	768	1842521	27	2026-10-12 19:10:07.393328+00	2026-10-12 19:10:07.393328+00
147	uploads/2026/10/1517e367-d3d2-4f81-abf6-4f39ce91b794.jpg	/uploads/2026/10/1517e367-d3d2-4f81-abf6-4f39ce91b794.jpg	image/jpeg	adv-2	1200	896	1121194	27	2026-10-12 19:42:45.526019+00	2026-10-12 19:42:45.526019+00
148	uploads/2026/10/5def39a4-d55a-4081-a219-00f22319864f.jpg	/uploads/2026/10/5def39a4-d55a-4081-a219-00f22319864f.jpg	image/jpeg	adv-3	896	1200	852080	27	2026-10-12 19:42:45.59869+00	2026-10-12 19:42:45.59869+00
149	uploads/2026/10/e5a90d25-9911-48cd-abf7-d8407d636569.jpg	/uploads/2026/10/e5a90d25-9911-48cd-abf7-d8407d636569.jpg	image/jpeg	adv-4	1024	1024	1079089	27	2026-10-12 19:42:45.657617+00	2026-10-12 19:42:45.657617+00
150	uploads/2026/10/8dab9902-eaa6-4d99-af8e-127fe68ab1df.jpg	/uploads/2026/10/8dab9902-eaa6-4d99-af8e-127fe68ab1df.jpg	image/jpeg	adv-1	1376	768	880602	27	2026-10-12 20:52:14.366074+00	2026-10-12 20:52:14.366074+00
151	2026/10/kailash-elevation-profile.png	/uploads/2026/10/kailash-elevation-profile.png	image/png	Kailash Elevation Profile	\N	\N	684312	\N	2026-10-12 21:18:58.435085+00	2026-10-12 21:18:58.435085+00
152	2026/10/kailash-route-map.png	/uploads/2026/10/kailash-route-map.png	image/png	Kailash Route Map	\N	\N	647791	\N	2026-10-12 21:18:58.49568+00	2026-10-12 21:18:58.49568+00
153	uploads/2026/10/f5d9d8c4-e1db-4eae-b4a0-4780d4a34766.jpg	/uploads/2026/10/f5d9d8c4-e1db-4eae-b4a0-4780d4a34766.jpg	image/jpeg	adv-2	1200	896	1121194	27	2026-10-12 22:01:42.564926+00	2026-10-12 22:01:42.564926+00
155	uploads/2026/10/caa2f1e4-6784-4100-ae01-9f43659d4d3d.jpg	/uploads/2026/10/caa2f1e4-6784-4100-ae01-9f43659d4d3d.jpg	image/jpeg	65d1c7b60412ad5e1b176f6058ca5fd5	1080	1920	196942	27	2026-10-12 22:03:22.99823+00	2026-10-12 22:03:22.99823+00
156	uploads/2026/10/694ec520-a624-4642-a65a-355867b9db44.png	/uploads/2026/10/694ec520-a624-4642-a65a-355867b9db44.png	image/png	Ankit_image	1254	1254	2068331	27	2026-10-12 22:04:03.78388+00	2026-10-12 22:04:03.78388+00
157	uploads/2026/10/e67bdb6a-7aac-4f65-bf42-c747c026f8b3.jpg	/uploads/2026/10/e67bdb6a-7aac-4f65-bf42-c747c026f8b3.jpg	image/jpeg	adv-3	896	1200	852080	27	2026-10-12 22:04:29.167649+00	2026-10-12 22:04:29.167649+00
20	/images/destinations/everest.jpg	/images/destinations/everest.jpg	image/jpeg	Nepal destination	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
21	/images/destinations/kathmandu.jpg	/images/destinations/kathmandu.jpg	image/jpeg	Nepal featured	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
22	/images/gallery/gallery-2.jpg	/images/gallery/gallery-2.jpg	image/jpeg	Bhutan destination	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
23	/images/blogs/blog-2.jpg	/images/blogs/blog-2.jpg	image/jpeg	Bhutan featured	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
24	/images/destinations/mount-kailash.jpg	/images/destinations/mount-kailash.jpg	image/jpeg	Tibet destination	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
25	/images/kailash-1.jpg	/images/kailash-1.jpg	image/jpeg	Tibet featured	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
26	/images/hero-mountains.jpg	/images/hero-mountains.jpg	image/jpeg	India destination	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
27	/images/adventures/adv-2.jpg	/images/adventures/adv-2.jpg	image/jpeg	India featured	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
28	/images/adventures/adv-3.jpg	/images/adventures/adv-3.jpg	image/jpeg	Himalayan Adventure & Rafting	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
29	/images/gallery/gallery-4.jpg	/images/gallery/gallery-4.jpg	image/jpeg	Wildlife Safaris & Nature	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
30	/images/gallery/gallery-3.jpg	/images/gallery/gallery-3.jpg	image/jpeg	Namche Bazaar	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
31	/images/blogs/blog-gotravel-1.jpg	/images/blogs/blog-gotravel-1.jpg	image/jpeg	Gokyo Lakes	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
32	/images/tours/tour-4.jpg	/images/tours/tour-4.jpg	image/jpeg	Kala Patthar (5,545m)	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
33	/images/tours/tour-5.jpg	/images/tours/tour-5.jpg	image/jpeg	Everest Base Camp	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
34	/images/gallery/gallery-1.jpg	/images/gallery/gallery-1.jpg	image/jpeg	Tengboche Monastery Morning Puja	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
35	/images/expeditions/expedition-4.jpg	/images/expeditions/expedition-4.jpg	image/jpeg	Kala Patthar Sunrise Vista	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
36	/images/adventures/adv-1.jpg	/images/adventures/adv-1.jpg	image/jpeg	Sherpa Teahouse Hospitality	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
37	/images/tours/tour-2.jpg	/images/tours/tour-2.jpg	image/jpeg	Hillary Suspension Bridges	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
38	/images/destinations/pokhara.jpg	/images/destinations/pokhara.jpg	image/jpeg	ANNAPURNA REGION	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
39	/images/blogs/blog-gotravel-2.jpg	/images/blogs/blog-gotravel-2.jpg	image/jpeg	Poon Hill (3,210m)	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
40	/images/blogs/blog-gotravel-4.jpg	/images/blogs/blog-gotravel-4.jpg	image/jpeg	Thorong La Pass	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
41	/images/gallery/gallery-5.jpg	/images/gallery/gallery-5.jpg	image/jpeg	Sunrise at Poon Hill	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
42	/images/expeditions/expedition-3.jpg	/images/expeditions/expedition-3.jpg	image/jpeg	Crossing Thorong La Pass	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
43	/images/kailash-2.jpg	/images/kailash-2.jpg	image/jpeg	Mount Kailash & Lake Mansarovar Yatra	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
44	/images/kailash-3.jpg	/images/kailash-3.jpg	image/jpeg	Mount Kailash & Lake Mansarovar Yatra	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
45	/images/testimonials/avatar-1.jpg	/images/testimonials/avatar-1.jpg	image/jpeg	Sarah Mitchell avatar	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
46	/images/blogs/blog-gotravel-3.jpg	/images/blogs/blog-gotravel-3.jpg	image/jpeg	Hiker standing on cliff edge overlooking turquoise mountain lake and snow covered peaks	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
47	/images/testimonials/avatar-2.jpg	/images/testimonials/avatar-2.jpg	image/jpeg	Admin avatar	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
48	/images/testimonials/avatar-3.jpg	/images/testimonials/avatar-3.jpg	image/jpeg	Rajesh Sharma avatar	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
49	/images/blogs/blog-3.jpg	/images/blogs/blog-3.jpg	image/jpeg	Tibetan monastery in Pokhara with prayer wheels	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
50	/images/expeditions/expedition-2.jpg	/images/expeditions/expedition-2.jpg	image/jpeg	Golden sunset light illuminating vertical rock face	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
51	/images/zermatt/overview-1.jpg	/images/zermatt/overview-1.jpg	image/jpeg	Sweeping winter mountain valley with snow-capped peaks	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
52	/images/zermatt/overview-2.jpg	/images/zermatt/overview-2.jpg	image/jpeg	Vibrant green highland pasture with traditional chalets	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
53	/images/blogs/blog-1.jpg	/images/blogs/blog-1.jpg	image/jpeg	Warm pink and orange hues coating mountain peaks	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
54	/images/adventures/adv-4.jpg	/images/adventures/adv-4.jpg	image/jpeg	Glassy lake mirroring sharp jagged peaks	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
55	/images/zermatt/overview-4.jpg	/images/zermatt/overview-4.jpg	image/jpeg	Expansive high altitude plateau under dramatic skies	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
56	/images/zermatt/overview-3.jpg	/images/zermatt/overview-3.jpg	image/jpeg	Endless rolling green hills leading to snow mountains	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
57	/images/adventures/adv-5.jpg	/images/adventures/adv-5.jpg	image/jpeg	Rapid mountain torrent coursing through boulder strewn riverbed	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
58	/images/destinations/lumbini.jpg	/images/destinations/lumbini.jpg	image/jpeg	Soft morning haze wrapping tranquil mountain slopes	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
59	/images/expeditions/expedition-1.jpg	/images/expeditions/expedition-1.jpg	image/jpeg	Imposing sheer limestone cliff over green valley floor	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
60	/images/tours/tour-1.jpg	/images/tours/tour-1.jpg	image/jpeg	Purple and magenta twilight reflecting across glassy water	\N	\N	\N	\N	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
124	uploads/2026/10/65d7d417-d5f6-4717-bbec-a4d2a215d478.jpg	/uploads/2026/10/65d7d417-d5f6-4717-bbec-a4d2a215d478.jpg	image/jpeg	adv-1	1376	768	880602	27	2026-10-11 18:53:12.26717+00	2026-10-11 18:53:12.26717+00
129	uploads/2026/10/edff510b-c773-4e43-83cd-f90cf4eaa7fe.jpg	/uploads/2026/10/edff510b-c773-4e43-83cd-f90cf4eaa7fe.jpg	image/jpeg	adv-1	1376	768	880602	27	2026-10-12 17:48:02.885396+00	2026-10-12 17:48:02.885396+00
121	uploads/2026/10/ec033f22-b8cc-45f9-a41a-eddc79e2668f.png	/uploads/2026/10/ec033f22-b8cc-45f9-a41a-eddc79e2668f.png	image/png	ChatGPT Image Sep 22, 2026, 02_48_19 PM	2048	768	1842521	27	2026-10-11 18:49:19.010548+00	2026-10-11 18:49:19.010548+00
123	uploads/2026/10/68d1b4bf-bd27-4c38-925c-c36ce554ce4b.png	/uploads/2026/10/68d1b4bf-bd27-4c38-925c-c36ce554ce4b.png	image/png	Reference 2	2094	751	2022172	27	2026-10-11 18:53:03.54954+00	2026-10-11 18:53:03.54954+00
130	uploads/2026/10/1db23fc2-99f7-4ac6-8079-9db302ecd96f.jpg	/uploads/2026/10/1db23fc2-99f7-4ac6-8079-9db302ecd96f.jpg	image/jpeg	adv-2	1200	896	1121194	27	2026-10-12 17:48:09.283345+00	2026-10-12 17:48:09.283345+00
133	uploads/2026/10/92aae72d-f614-485c-bd83-feb459fc4902.png	/uploads/2026/10/92aae72d-f614-485c-bd83-feb459fc4902.png	image/png	Reference 2	2094	751	2022172	27	2026-10-12 18:36:48.086573+00	2026-10-12 18:36:48.086573+00
134	uploads/2026/10/68b4448a-637c-4723-b3d1-271da985fb68.jpg	/uploads/2026/10/68b4448a-637c-4723-b3d1-271da985fb68.jpg	image/jpeg	adv-2	1200	896	1121194	27	2026-10-12 18:37:01.343243+00	2026-10-12 18:37:01.343243+00
135	uploads/2026/10/fa5b642f-f02f-433b-94e6-8624c068c428.jpg	/uploads/2026/10/fa5b642f-f02f-433b-94e6-8624c068c428.jpg	image/jpeg	adv-3	896	1200	852080	27	2026-10-12 18:37:01.512632+00	2026-10-12 18:37:01.512632+00
136	uploads/2026/10/230f291a-2cd5-42d7-9619-6af99122d589.jpg	/uploads/2026/10/230f291a-2cd5-42d7-9619-6af99122d589.jpg	image/jpeg	adv-4	1024	1024	1079089	27	2026-10-12 18:37:01.647086+00	2026-10-12 18:37:01.647086+00
143	uploads/2026/10/c7cc6223-a577-44c9-b83a-ec394b8ad692.jpg	/uploads/2026/10/c7cc6223-a577-44c9-b83a-ec394b8ad692.jpg	image/jpeg	adv-1	1376	768	880602	27	2026-10-12 18:48:35.107945+00	2026-10-12 18:48:35.107945+00
144	uploads/2026/10/fefee1ba-7953-4d5e-bf45-7de8122a0dd1.jpg	/uploads/2026/10/fefee1ba-7953-4d5e-bf45-7de8122a0dd1.jpg	image/jpeg	adv-3	896	1200	852080	27	2026-10-12 18:48:40.517334+00	2026-10-12 18:48:40.517334+00
\.


--
-- Data for Name: newsletter_subscribers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.newsletter_subscribers (id, email, status, subscribed_at, unsubscribed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, key, description, created_at) FROM stdin;
1	content.read	Read managed website content.	2026-09-30 05:23:19.687178+00
2	content.create	Create managed website content.	2026-09-30 05:23:19.687178+00
3	content.update	Update managed website content.	2026-09-30 05:23:19.687178+00
4	content.delete	Delete or archive managed website content.	2026-09-30 05:23:19.687178+00
5	trip.read	Read trips.	2026-09-30 05:23:19.687178+00
6	trip.create	Create trips.	2026-09-30 05:23:19.687178+00
7	trip.update	Update trips.	2026-09-30 05:23:19.687178+00
8	trip.delete	Delete or archive trips.	2026-09-30 05:23:19.687178+00
9	blog.read	Read blogs.	2026-09-30 05:23:19.687178+00
10	blog.create	Create blogs.	2026-09-30 05:23:19.687178+00
11	blog.update	Update blogs.	2026-09-30 05:23:19.687178+00
12	blog.delete	Delete or archive blogs.	2026-09-30 05:23:19.687178+00
13	review.read	Read reviews including moderation queue.	2026-09-30 05:23:19.687178+00
14	review.moderate	Moderate reviews.	2026-09-30 05:23:19.687178+00
15	inquiry.read	Read enquiries.	2026-09-30 05:23:19.687178+00
16	inquiry.update	Update enquiry status and assignment.	2026-09-30 05:23:19.687178+00
17	newsletter.read	Read newsletter subscribers.	2026-09-30 05:23:19.687178+00
18	newsletter.manage	Manage newsletter subscriptions.	2026-09-30 05:23:19.687178+00
19	media.read	Read media metadata.	2026-09-30 05:23:19.687178+00
20	media.create	Create media metadata.	2026-09-30 05:23:19.687178+00
21	media.update	Update media metadata.	2026-09-30 05:23:19.687178+00
22	media.delete	Delete media metadata.	2026-09-30 05:23:19.687178+00
23	user.read	Read user accounts.	2026-09-30 05:23:19.687178+00
24	user.manage	Manage user accounts.	2026-09-30 05:23:19.687178+00
25	role.read	Read roles and permissions.	2026-09-30 05:23:19.687178+00
26	role.manage	Manage roles and permissions.	2026-09-30 05:23:19.687178+00
\.


--
-- Data for Name: region_experiences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.region_experiences (id, source_id, region_id, title, description, media_id, badge, sort_order, status, created_at, updated_at) FROM stdin;
8	exp-1	11	Tengboche Monastery Morning Puja	Join resident Buddhist monks in dawn chants surrounded by prayer flags and panoramic views of Ama Dablam.	34	CULTURAL	0	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
9	exp-2	11	Kala Patthar Sunrise Vista	Ascend to 5,545 meters in the crisp early morning to watch the golden sun crest directly over Everest and Lhotse.	35	MOUNTAIN	1	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
10	exp-3	11	Sherpa Teahouse Hospitality	Experience genuine mountain warmth, savor hearty Dal Bhat and hot ginger lemon tea around warm bukhari stoves.	36	LOCAL LIFE	2	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
11	exp-4	11	Hillary Suspension Bridges	Cross exhilarating suspension bridges draped in colorful Buddhist katas over roaring glacial canyon torrents.	37	SCENIC	3	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
12	exp-ann-1	12	Sunrise at Poon Hill	Watch dawn transform the Annapurna and Dhaulagiri mountain wall from deep violet into fiery gold.	41	PANORAMA	0	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
13	exp-ann-2	12	Crossing Thorong La Pass	Achieve the unforgettable milestone of traversing the legendary 5,416-meter pass between Manang and Mustang.	42	EPIC TREK	1	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
\.


--
-- Data for Name: region_popular_places; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.region_popular_places (id, source_id, region_id, name, description, media_id, href, sort_order, status, created_at, updated_at) FROM stdin;
8	namche-bazaar	11	Namche Bazaar	Vibrant Sherpa Gateway	30	/trip/everest-base-camp-trek	0	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
9	tengboche	11	Tengboche Monastery	Spiritual Heart of Khumbu	29	/trip/everest-base-camp-trek	1	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
10	gokyo-lakes	11	Gokyo Lakes	Emerald Glacial Waters	31	/trip/everest-base-camp-trek	2	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
11	kala-patthar	11	Kala Patthar (5,545m)	Best Sunrise Over Everest	32	/trip/everest-base-camp-trek	3	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
12	everest-base-camp	11	Everest Base Camp	Foot of the World's Highest	33	/trip/everest-base-camp-trek	4	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
13	poon-hill	12	Poon Hill (3,210m)	Golden Himalayan Sunrise	39	/trip/annapurna-circuit-trek	0	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
14	thorong-la	12	Thorong La Pass	World's Widest Pass	40	/trip/annapurna-circuit-trek	1	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
15	muktinath	12	Muktinath Temple	Sacred Hindu & Buddhist Shrine	22	/trip/annapurna-circuit-trek	2	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
16	ghandruk	12	Ghandruk Village	Historic Gurung Heritage	27	/trip/annapurna-circuit-trek	3	published	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00
\.


--
-- Data for Name: regions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.regions (id, destination_id, slug, title, subtitle, tagline, hero_media_id, about_title, about_paragraphs, status, published_at, created_at, updated_at, deleted_at) FROM stdin;
11	34	everest	EVEREST REGION	HOME OF THE WORLD'S HIGHEST PEAK	Home to the world's highest peak, the Everest region offers breathtaking landscapes, Sherpa culture and once-in-a-lifetime experiences.	20	About the Everest Region	{"The Everest region, known locally as the Khumbu, is one of the most iconic trekking destinations in the world. Dominated by Mount Everest (8,848.86 m), this mountainous wonderland is also home to three other 8,000-meter giants: Lhotse, Makalu, and Cho Oyu.","Beyond the soaring granite peaks, the region is shaped by the warmth and hospitality of the Sherpa people, ancient Buddhist monasteries adorned with colorful prayer flags, and vibrant mountain settlements like Namche Bazaar.","Whether you are undertaking the legendary trek to Everest Base Camp, crossing high alpine passes like Cho La, or marveling at the emerald glacial waters of Gokyo Lakes, the Khumbu provides a life-changing Himalayan experience."}	published	2026-09-30 18:24:52.894+00	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N
12	34	annapurna	ANNAPURNA REGION	DIVERSE LANDSCAPES & HIGH ALPINE PASSES	From subtropical rhododendron forests to the high arid Tibetan plateau over Thorong La Pass, Annapurna is Nepal's most diverse trekking region.	38	About the Annapurna Region	{"The Annapurna region encompasses a stunning array of ecosystems and climates, ranging from lush green valleys, terraced rice paddies, and mossy pine forests to barren high-altitude deserts reminiscent of Tibet.","The region is renowned for the classic Annapurna Circuit, the dramatic natural amphitheater of Annapurna Sanctuary, and the iconic sunrise viewpoint from Poon Hill overlooking Dhaulagiri and Machhapuchhre (Fishtail Mountain).","Rich with the cultures of Gurung, Magar, and Thakali communities, Annapurna offers world-class trekking infrastructure with welcoming mountain lodges."}	published	2026-09-30 18:24:52.894+00	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N
13	36	ngari-kailash	Ngari (Kailash)			\N		{}	published	2026-09-30 18:24:52.894+00	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N
33	78	testing-region	testing region	testing	testing	\N		{testing}	published	2026-10-11 08:34:42.896+00	2026-10-11 08:34:42.891937+00	2026-10-11 08:34:42.891937+00	\N
34	78	ankit	ankit	ankit	ankit	\N		{ankit}	published	2026-10-11 17:55:17.821+00	2026-10-11 17:55:17.818588+00	2026-10-11 17:55:17.818588+00	\N
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, trip_id, name, email, location, title, message, rating, photo_media_id, status, created_at, updated_at, deleted_at, source_id) FROM stdin;
123	34	Priya Sharma	priya@example.com	India	Divine Experience	Visiting Mount Kailash was the most spiritual journey of my life.	5	\N	approved	2026-10-12 20:39:40.404906+00	2026-10-12 20:39:40.404906+00	\N	\N
55	10	Sarah Mitchell	\N	United Kingdom	\N	Our Everest Base Camp trek with Mission Nepal Holidays exceeded every expectation. The Sherpa team was professional, knowledgeable, and their care for our safety and acclimatization made our journey seamless. Standing at Base Camp was a life-changing milestone!	5	45	approved	2026-09-15 00:00:00+00	2026-09-30 18:24:52.892844+00	\N	public-site:r1
56	\N	Rajiv Malhotra	\N	Mumbai, India	\N	The Mount Kailash & Mansarovar Yatra was deeply spiritual and meticulously organized. Fresh vegetarian meals, heated lodges, emergency oxygen, and our humble Tibetan guide made this demanding pilgrimage comfortable and truly blessed.	5	47	approved	2026-09-02 00:00:00+00	2026-09-30 18:24:52.892844+00	\N	public-site:r2
57	\N	Elena Rostova	\N	Switzerland	\N	Bhutan Cultural Odyssey was pure magic. Hiking to Tiger's Nest and experiencing the festivals in Thimphu with such warm, authentic guides was a dream come true. Mission Nepal Holidays is without a doubt the premier Himalayan specialist.	5	48	approved	2026-08-28 00:00:00+00	2026-09-30 18:24:52.892844+00	\N	public-site:r3
58	12	Marcus Vance	\N	Australia	\N	Crossing Thorong La Pass (5,416m) on the Annapurna Circuit was challenging, but our guide Pemba paced us perfectly. Beautiful teahouse stays, breathtaking views of Dhaulagiri, and delicious food every single day.	5	45	approved	2026-08-14 00:00:00+00	2026-09-30 18:24:52.892844+00	\N	public-site:r4
59	\N	David & Claire Miller	\N	Canada	\N	From Kathmandu heritage temples to sunrise over the Himalayas in Nagarkot, every moment was effortless and beautifully curated. The vehicle was spotless and the driver was gentle. Highly recommended for families!	5	47	approved	2026-08-01 00:00:00+00	2026-09-30 18:24:52.892844+00	\N	public-site:r5
60	\N	Sunil Mittal	\N	Delhi, India	\N	Traveling through Lhasa and Central Tibet with Mission Nepal was deeply humbling. The permits, China group visa, and Tibetan monasteries were handled with zero stress. 10/10 service!	5	48	approved	2026-07-20 00:00:00+00	2026-09-30 18:24:52.892844+00	\N	public-site:r6
124	\N	Ankit singh	aksingh9318@gmail.com	India	testing	testing	5	\N	pending	2026-10-12 21:06:20.311217+00	2026-10-12 21:06:20.311217+00	\N	\N
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (role_id, permission_id, created_at) FROM stdin;
3	1	2026-09-30 05:23:19.687178+00
3	2	2026-09-30 05:23:19.687178+00
3	3	2026-09-30 05:23:19.687178+00
3	4	2026-09-30 05:23:19.687178+00
3	5	2026-09-30 05:23:19.687178+00
3	6	2026-09-30 05:23:19.687178+00
3	7	2026-09-30 05:23:19.687178+00
3	8	2026-09-30 05:23:19.687178+00
3	9	2026-09-30 05:23:19.687178+00
3	10	2026-09-30 05:23:19.687178+00
3	11	2026-09-30 05:23:19.687178+00
3	12	2026-09-30 05:23:19.687178+00
3	13	2026-09-30 05:23:19.687178+00
3	14	2026-09-30 05:23:19.687178+00
3	15	2026-09-30 05:23:19.687178+00
3	16	2026-09-30 05:23:19.687178+00
3	17	2026-09-30 05:23:19.687178+00
3	18	2026-09-30 05:23:19.687178+00
3	19	2026-09-30 05:23:19.687178+00
3	20	2026-09-30 05:23:19.687178+00
3	21	2026-09-30 05:23:19.687178+00
3	22	2026-09-30 05:23:19.687178+00
3	23	2026-09-30 05:23:19.687178+00
3	24	2026-09-30 05:23:19.687178+00
3	25	2026-09-30 05:23:19.687178+00
3	26	2026-09-30 05:23:19.687178+00
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, key, name, description, is_system, created_at, updated_at) FROM stdin;
1	user	User	Standard account with no CMS permissions.	t	2026-09-30 05:23:19.687178+00	2026-09-30 05:23:19.687178+00
3	admin	Administrator	Full content-management access.	t	2026-09-30 05:23:19.687178+00	2026-09-30 05:23:19.687178+00
2	vendor	Vendor	Vendor account; permissions remain disabled until vendor features are implemented.	t	2026-09-30 05:23:19.687178+00	2026-10-10 19:39:10.553998+00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.schema_migrations (name, checksum, applied_at) FROM stdin;
001_core_schema.sql	39d2cb42b7aca77820ce8358c5df4011797eb7a565db4ddf10d890a59bfb3a01	2026-09-30 05:23:19.687178+00
002_trip_region_destination_consistency.sql	d0cc0a899f30faa4f79a2a8e879f34e39e690e12a5fcb33c4efc69779ec8cada	2026-09-30 05:29:02.448378+00
003_region_children_and_review_email_optional.sql	04be53a97fa7d312f202bd876fcbf4ca2dcb8cc065ed9c4c0621db938c88a760	2026-09-30 18:02:55.987461+00
004_trip_display_area.sql	3c62fbe027d95c4e8304962e963fbeff50bffe55657e62106dac8bdd1ae141cd	2026-09-30 18:23:50.635068+00
005_content_source_ids.sql	c0364944792cc42dac0eb4ee8f2b1c34ea9beb843696a16bc2e046176603e859	2026-09-30 18:23:50.664934+00
006_itinerary_day_media.sql	41bf541af07d3f5037d2324bd82f4ca151a95aa1ff3c53c261d561a36f82be37	2026-10-12 18:18:54.321702+00
007_itinerary_day_second_media.sql	cba722a82e3155d814c7edbe16a4bcd072daceb32edaaf8439c026b968f29468	2026-10-12 18:40:11.702981+00
\.


--
-- Data for Name: trip_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trip_categories (id, slug, name, description, media_id, status, created_at, updated_at) FROM stdin;
26	testing	testing	testing	\N	active	2026-10-11 08:34:57.906765+00	2026-10-11 08:34:57.906765+00
27	religious	Religious	Religious	\N	active	2026-10-12 17:23:27.438497+00	2026-10-12 17:23:27.438497+00
\.


--
-- Data for Name: trip_exclusions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trip_exclusions (id, trip_id, text, sort_order) FROM stdin;
1	10	International flights to and from Kathmandu	0
2	10	Nepal entry visa fees ($30 for 15 days, $50 for 30 days)	1
3	10	Comprehensive travel and high-altitude emergency medical/evacuation insurance	2
4	10	Personal trekking equipment (down jacket, sleeping bag available for rent)	3
5	10	Personal expenses such as hot showers, battery charging, Wi-Fi, and bar bills	4
6	10	Tips for trekking guides, assistants, and porters	5
7	11	International flights to Kathmandu	0
8	11	Nepal entry visa fee	1
9	11	Horse / pony and personal helper charges for Kailash Parikrama (approx $450 - $550 if required)	2
10	11	Personal expenses, telephone, and laundry	3
11	11	Travel insurance with emergency evacuation coverage	4
12	12	International airfare	0
13	12	Travel insurance	1
14	12	Personal drinks and snacks	2
15	13	International airfare to Paro	0
16	13	Personal tips and purchases	1
45	33	International flight tickets	0
46	33	Personal insurance	1
197	34	International flights to and from Kathmandu.	0
198	34	Nepal visa fees, where applicable.	1
199	34	Personal expenses, snacks, drinks and laundry.	2
200	34	Personal travel, medical and high-altitude evacuation insurance.	3
201	34	Personal trekking equipment and clothing.	4
202	34	Porter, horse or other optional support during the Kora unless expressly included.	5
203	34	Additional hotel nights, meals or transport caused by delays outside the agreed package.	6
204	34	Costs arising from route changes, cancellations or extra permit requirements, as defined in the booking terms.	7
205	34	Tips and gratuities.	8
206	34	Any service not expressly listed under inclusions.	9
\.


--
-- Data for Name: trip_highlights; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trip_highlights (id, trip_id, text, sort_order) FROM stdin;
88	33	this is the place i want to now	0
25	10	Stand at the iconic Everest Base Camp (5,364 m) beneath the towering Khumbu Icefall	0
26	10	Panoramic 360-degree sunrise view of Everest, Lhotse, and Nuptse from Kala Patthar (5,545 m)	1
27	10	Scenic mountain flight into Lukla's Tenzing-Hillary Airport	2
28	10	Explore Namche Bazaar, the historic trading capital of the Sherpa homeland	3
29	10	Visit ancient Tengboche Monastery with magnificent backdrops of Ama Dablam	4
30	10	Fully guided by certified high-altitude Sherpa trekking leaders with oxygen & safety support	5
31	11	Complete the 52 km sacred Parikrama (Kora) around holy Mount Kailash	0
32	11	Holy dip and puja rituals at the crystal waters of sacred Lake Mansarovar (4,590 m)	1
33	11	Traverse the sacred Dolma La Pass (5,630 m) and view Gauri Kund (Lake of Compassion)	2
34	11	Explore historic Tibetan monasteries including Chiu Gompa and Dirapuk	3
35	11	Full group medical support with Tibetan guides, Sherpa cooks, and high-altitude emergency team	4
36	12	Conquer the thrilling Thorong La Pass (5,416 m)	0
37	12	Visit Muktinath Temple, holy to both Hindus and Buddhists	1
38	12	Experience Tibetan Buddhist culture in ancient Manang village	2
39	12	Relax on the tranquil shores of Phewa Lake in Pokhara after the trek	3
40	13	Hike to the legendary cliffside Taktsang (Tiger's Nest) Monastery in Paro	0
41	13	Visit Punakha Dzong, the most beautiful fortress in Bhutan at the confluence of two rivers	1
42	13	Explore Thimphu, the world's only national capital without a single traffic light	2
43	13	All-inclusive luxury Bhutanese hospitality with certified cultural guides	3
194	34	Visit sacred Lake Mansarovar.	0
195	34	Witness the majestic Mount Kailash.	1
196	34	Experience the spiritual atmosphere of the Kailash region.	2
197	34	Travel through the Himalayan landscapes of Nepal and Tibet.	3
198	34	Guided group pilgrimage with itinerary coordination.	4
199	34	Opportunity for Kailash Parikrama, subject to fitness, weather, and local permissions.	5
200	34	Permit and border arrangements coordinated according to the confirmed package.	6
\.


--
-- Data for Name: trip_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trip_images (id, trip_id, media_id, alt_text, sort_order, is_hero, created_at) FROM stdin;
10	10	20	Everest Base Camp Trek	0	t	2026-09-30 18:24:25.552858+00
11	10	32	Everest Base Camp Trek	1	f	2026-09-30 18:24:25.552858+00
12	10	33	Everest Base Camp Trek	2	f	2026-09-30 18:24:25.552858+00
13	10	30	Everest Base Camp Trek	3	f	2026-09-30 18:24:25.552858+00
14	10	29	Everest Base Camp Trek	4	f	2026-09-30 18:24:25.552858+00
15	11	24	Mount Kailash & Lake Mansarovar Yatra	0	t	2026-09-30 18:24:25.552858+00
16	11	25	Mount Kailash & Lake Mansarovar Yatra	1	f	2026-09-30 18:24:25.552858+00
17	11	43	Mount Kailash & Lake Mansarovar Yatra	2	f	2026-09-30 18:24:25.552858+00
18	11	44	Mount Kailash & Lake Mansarovar Yatra	3	f	2026-09-30 18:24:25.552858+00
19	11	41	Mount Kailash & Lake Mansarovar Yatra	4	f	2026-09-30 18:24:25.552858+00
20	12	38	Annapurna Circuit Trek	0	t	2026-09-30 18:24:25.552858+00
21	12	22	Annapurna Circuit Trek	1	f	2026-09-30 18:24:25.552858+00
22	12	39	Annapurna Circuit Trek	2	f	2026-09-30 18:24:25.552858+00
23	12	40	Annapurna Circuit Trek	3	f	2026-09-30 18:24:25.552858+00
24	12	27	Annapurna Circuit Trek	4	f	2026-09-30 18:24:25.552858+00
25	13	22	Bhutan Cultural Odyssey & Tiger's Nest	0	t	2026-09-30 18:24:25.552858+00
26	13	23	Bhutan Cultural Odyssey & Tiger's Nest	1	f	2026-09-30 18:24:25.552858+00
27	13	21	Bhutan Cultural Odyssey & Tiger's Nest	2	f	2026-09-30 18:24:25.552858+00
73	34	147	\N	0	f	2026-10-12 20:31:36.764205+00
74	34	148	\N	1	f	2026-10-12 20:31:36.764205+00
75	34	149	\N	2	f	2026-10-12 20:31:36.764205+00
\.


--
-- Data for Name: trip_inclusions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trip_inclusions (id, trip_id, text, sort_order) FROM stdin;
1	10	All airport transfers by private vehicle	0
2	10	Round-trip domestic flights between Kathmandu and Lukla including airport tax	1
3	10	3-Star hotel accommodation in Kathmandu on twin-sharing basis with breakfast	2
4	10	Teahouse accommodation during the trek on twin-sharing basis	3
5	10	All meals (Breakfast, Lunch, Dinner) during the 12-day trek	4
6	10	Experienced English-speaking certified Sherpa trekking guide	5
7	10	Porters to carry your luggage (1 porter for every 2 trekkers, max 15kg per person)	6
8	10	Sagarmatha National Park entry permit and Khumbu Pasang Lhamu rural municipality permit	7
9	10	First aid medical kit with oximeter and emergency oxygen cylinder support	8
10	10	All government taxes, VAT, and official service charges	9
11	11	All Tibet travel permits, Tibet Alien Travel Permit, and China Group Visa	0
12	11	Full accommodation in Kathmandu, Kyirong, Saga, Mansarovar and during Kora	1
13	11	Pure vegetarian meals prepared fresh by our dedicated Sherpa culinary crew	2
14	11	Experienced Tibetan tour guide and Sherpa pilgrimage managers	3
15	11	Oxygen cylinders, gamow bag, pulse oximeters, and medical first aid kits	4
16	11	Duffle bags, warm down jackets, and certificate of completion for all Yatris	5
17	12	ACAP and TIMS trekking permits	0
18	12	Certified trekking guide and porter support	1
19	12	Teahouse accommodation and full board on trek	2
20	12	Kathmandu and Pokhara hotel stays	3
21	13	Bhutan Government Sustainable Development Fee (SDF)	0
22	13	Bhutan tourist visa processing	1
23	13	Full board 3-Star/4-Star deluxe hotels	2
24	13	Dedicated licensed Bhutanese guide and private vehicle	3
61	33	All meals and accommodations	0
62	33	Professional Sherpa guide	1
183	34	Airport pickup and drop-off in Kathmandu, as specified in the package.	0
184	34	Accommodation during the itinerary on a twin-sharing or specified basis.	1
185	34	Ground transportation according to the confirmed route.	2
186	34	Meals as specified in the final itinerary.	3
187	34	Local guide and group coordination.	4
188	34	Tibet travel permit and visa processing assistance, subject to eligibility and approval.	5
189	34	Support during the planned pilgrimage and Kora.	6
190	34	Basic trip briefing and preparation assistance.	7
\.


--
-- Data for Name: trip_itinerary_days; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trip_itinerary_days (id, trip_id, day_number, title, description, altitude, trekking_time, accommodation, sort_order, created_at, updated_at, media_id, media_id_2) FROM stdin;
137	33	1	Arrival & Welcome Briefing	Arrive at destination, hotel transfer, evening team briefing.	1,400m	Briefing	Standard Hotel	0	2026-10-11 19:14:28.938907+00	2026-10-11 19:14:28.938907+00	\N	\N
138	33	2	Day 2 Title		3,000m	Trekking	TAj Hotel	1	2026-10-11 19:14:28.938907+00	2026-10-11 19:14:28.938907+00	\N	\N
139	33	3	Day 3 Title		3,000m	Trekking	Track 	2	2026-10-11 19:14:28.938907+00	2026-10-11 19:14:28.938907+00	\N	\N
140	33	4	Day 4 Title		3,000m	Trekking	Rest Day	3	2026-10-11 19:14:28.938907+00	2026-10-11 19:14:28.938907+00	\N	\N
10	10	1	Arrival in Kathmandu (1,400 m)	Arrive at Tribhuvan International Airport in Kathmandu. Our representative warmly welcomes you and transfers you to your hotel. Meet your guide for a comprehensive trek briefing.	1,400 m	N/A	3-Star Hotel in Kathmandu	0	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
11	10	2	Scenic Flight to Lukla (2,860 m) & Trek to Phakding (2,610 m)	Board an early flight to Lukla. Meet your Sherpa porters and begin an easy downhill hike along the Dudh Koshi River to the riverside settlement of Phakding.	2,610 m	3 – 4 hours	Teahouse Lodge	1	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
14	10	5	Trek to Tengboche (3,860 m)	Descend to the river at Phungi Thanga before ascending through rhododendron woods to Tengboche Monastery, the spiritual epicenter of the Khumbu.	3,860 m	5 hours	Teahouse Lodge	4	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
370	34	1	Arrival in Kathmandu	Airport pickup, hotel check-in, rest and trip briefing.	1,400m	Briefing	Standard Hotel	0	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00	143	144
371	34	2	Kathmandu sightseeing & preparation	Visit Pashupatinath Temple, complete trip preparation and attend the operator's briefing.	1,400m	Full Day	Standard Hotel	1	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00	145	146
372	34	3	Drive Kathmandu to Timure / Rasuwagadhi	Travel by road toward the designated border area. Overnight at the confirmed stop.	1,955m	6-7 hrs drive	Standard Hotel	2	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00	\N	\N
373	34	4	Cross border to Kerung (Kyirong)	Complete immigration and permit checks, then continue to the confirmed accommodation in Tibet.	2,700m	3-4 hrs	Standard Hotel	3	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00	\N	\N
374	34	5	Acclimatization day in Kerung	Rest, hydrate and follow the guide's instructions to prepare for high altitude.	2,700m	Rest & hike	Standard Hotel	4	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00	\N	\N
375	34	6	Scenic drive Kerung to Saga	Continue across the Tibetan Plateau with stops as required by the operating itinerary.	4,500m	6-7 hrs drive	Standard Hotel	5	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00	\N	\N
376	34	7	Drive Saga to Holy Lake Mansarovar	Travel toward the sacred lake, subject to road and local conditions.	4,590m	7-8 hrs drive	Standard Hotel	6	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00	\N	\N
377	34	8	Holy bath & Pooja at Mansarovar, drive to Darchen	Time for darshan, prayer and permitted rituals. Any lake circumambulation depends on local arrangements.	4,575m	2-3 hrs	Standard Hotel	7	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00	\N	\N
378	34	9	Parikrama Day 1: Trek Darchen to Dirapuk	Continue to Darchen, the usual base for the Mount Kailash outer Kora.	4,900m	5-6 hrs trek	Standard Hotel	8	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00	\N	\N
379	34	10	Parikrama Day 2: Trek Dirapuk cross Dolma La to Zuthulpuk	Begin the first walking day of the outer pilgrimage, if approved and medically appropriate.	5,630m	8-9 hrs trek	Standard Hotel	9	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00	\N	\N
380	34	11	Parikrama Day 3: Trek Zuthulpuk to Darchen, drive to Saga	The demanding section crosses the Dolma La area at approximately 5,630 m; participation depends on fitness and conditions.	4,500m	3 hrs trek + 5 hrs drive	Standard Hotel	10	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00	\N	\N
381	34	12	Drive Saga back to Kerung	Finish the walking circuit if conditions permit, then transfer to the confirmed overnight stop.	2,700m	6-7 hrs drive	Standard Hotel	11	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00	\N	\N
382	34	13	Drive Kerung to Kathmandu	Travel back toward Nepal through the approved border route. Delays may require changes.	1,400m	7-8 hrs drive	Standard Hotel	12	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00	\N	\N
383	34	14	Departure from Kathmandu	Airport transfer and onward journey home.	1,400m	Airport transfer	Standard Hotel	13	2026-10-12 20:31:36.764205+00	2026-10-12 20:31:36.764205+00	\N	\N
12	10	3	Trek to Namche Bazaar (3,440 m)	Cross the Hillary Suspension Bridge draped in Buddhist prayer flags, enter Sagarmatha National Park at Monjo, and ascend steadily to the vibrant amphitheater of Namche Bazaar.	3,440 m	5 – 6 hours	Teahouse Lodge	2	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
13	10	4	Acclimatization Day in Namche Bazaar (Hike to Hotel Everest View)	Hike up to the Everest View Hotel (3,880 m) for your first panoramic glimpse of Mount Everest, Ama Dablam, and Thamserku. Explore the Sherpa Culture Museum.	3,880 m	3 – 4 hours	Teahouse Lodge	3	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
15	10	6	Trek to Dingboche (4,410 m)	Pass traditional stone mani walls and Chortens through Pangboche village, crossing the tree line into the alpine tundra of Dingboche.	4,410 m	5 – 6 hours	Teahouse Lodge	5	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
16	10	7	Acclimatization Hike to Nagarjun Hill (5,100 m)	A crucial acclimatization day hiking to the viewpoint ridge of Nagarjun for breathtaking vistas of Makalu, Lhotse, and Island Peak.	5,100 m	4 – 5 hours	Teahouse Lodge	6	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
17	10	8	Trek to Lobuche (4,940 m)	Ascend past the emotional Thokla Pass memorials dedicated to lost climbers, entering the lateral moraine of the Khumbu Glacier.	4,940 m	5 hours	Teahouse Lodge	7	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
18	10	9	Trek to Gorak Shep (5,164 m) & Hike to Everest Base Camp (5,364 m)	The monumental day! Trek to Gorak Shep, drop heavy bags, and trek across glacial moraines to stand triumphant at Everest Base Camp.	5,364 m	7 – 8 hours	Teahouse Lodge	8	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
19	10	10	Sunrise at Kala Patthar (5,545 m) & Descend to Pheriche (4,288 m)	Pre-dawn climb to Kala Patthar summit for the ultimate sunrise over Mount Everest. Descend down to Pheriche for thicker air and comfortable rest.	5,545 m	6 – 7 hours	Teahouse Lodge	9	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
20	10	11	Trek Back to Namche Bazaar (3,440 m)	Re-enter the pine forests with brisk descents, celebrating your achievement with a warm bakery treat in Namche Bazaar.	3,440 m	6 hours	Teahouse Lodge	10	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
21	10	12	Trek to Lukla (2,860 m)	Final day on foot following the Dudh Koshi river back to Lukla. Enjoy a farewell celebration dinner with your dedicated Sherpa crew.	2,860 m	6 – 7 hours	Teahouse Lodge	11	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
22	10	13	Morning Flight to Kathmandu	Fly back to Kathmandu. Transfer to your hotel for leisure time, souvenir shopping in Thamel, or a soothing Ayurvedic massage.	1,400 m	N/A	3-Star Hotel in Kathmandu	12	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
23	10	14	Final Departure from Nepal	Transfer to Tribhuvan International Airport for your flight back home with memories of a lifetime in the Himalayas.	1,400 m	N/A	Departure	13	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
24	11	1	Arrival in Kathmandu & Temple Visit	Arrive in Kathmandu. Transfer to hotel and visit the sacred Pashupatinath Temple for an evening Aarti ceremony.	1,400 m	\N	5-Star Hotel in Kathmandu	0	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
25	11	2	Kathmandu Valley Sightseeing & Visa Formalities	Visit sacred Jal Narayan (Budhanilkantha) and Guhyeshwari Shaktipeeth. Final briefing and gear inspection.	1,400 m	\N	5-Star Hotel in Kathmandu	1	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
26	11	3	Drive from Kathmandu to Kyirong Border (2,700 m)	Drive along scenic mountain highways to the Nepal-Tibet border at Rasuwagadhi/Kyirong.	2,700 m	\N	Guesthouse in Kyirong	2	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
27	11	4	Acclimatization Day in Kyirong	Rest day for essential altitude acclimatization in the tranquil Kyirong valley.	2,700 m	\N	Guesthouse in Kyirong	3	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
28	11	5	Drive to Saga (4,450 m) Crossing Brahmaputra River	Ascend onto the Tibetan plateau crossing scenic high passes and the mighty Yarlung Tsangpo (Brahmaputra).	4,450 m	\N	Standard Hotel in Saga	4	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
29	11	6	Drive from Saga to Sacred Lake Mansarovar (4,590 m)	First breathtaking glimpse of Mount Kailash and Lake Mansarovar. Perform holy dip, Havana and evening prayers.	4,590 m	\N	Guesthouse near Lake Mansarovar	5	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
30	11	7	Mansarovar Puja & Drive to Darchen (4,670 m)	Morning spiritual ceremonies at Mansarovar. Short drive to Darchen, the starting base for the Kailash Parikrama.	4,670 m	\N	Hotel in Darchen	6	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
31	11	8	Kora Day 1: Trek from Yamadwar to Dirapuk (4,920 m)	Enter Yamadwar (Gate of the God of Death) and begin the sacred 12 km trek with close-up views of Kailash North Face.	4,920 m	5 – 6 hours	Dirapuk Guesthouse	7	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
32	11	9	Kora Day 2: Trek Over Dolma La Pass (5,630 m) to Zuthulpuk (4,790 m)	The toughest spiritual test! Climb to Dolma La Pass, receive blessings, pass holy Gauri Kund, and descend to Zuthulpuk.	5,630 m	8 – 9 hours	Zuthulpuk Guesthouse	8	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
33	11	10	Kora Day 3: Complete Parikrama & Drive to Saga	Gentle 3-hour walk to complete the 52 km sacred circuit. Reunite with vehicles and drive back to Saga.	4,450 m	\N	Hotel in Saga	9	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
34	11	11	Drive from Saga to Kyirong Border	Return drive through dramatic Himalayan canyons back to Kyirong town.	2,700 m	\N	Guesthouse in Kyirong	10	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
35	11	12	Border Formalities & Drive back to Kathmandu	Cross the border back into Nepal and drive through scenic river valleys to Kathmandu. Farewell dinner celebration.	1,400 m	\N	5-Star Hotel in Kathmandu	11	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
36	11	13	Final Departure	Transfer to Kathmandu International Airport with blessed memories of Mount Kailash.	1,400 m	\N	Departure	12	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
37	12	1	Arrival in Kathmandu	Meet and greet at the airport, transfer to hotel.	\N	\N	\N	0	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
38	12	2	Drive to Besisahar & Dharapani (1,860 m)	Scenic mountain drive along the Trishuli and Marsyangdi rivers.	\N	\N	\N	1	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
39	12	3	Trek to Chame (2,670 m)	Enter pine and fir forests with towering views of Lamjung Himal.	\N	\N	\N	2	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
40	12	4	Trek to Pisang (3,200 m)	Walk beneath the dramatic rock wall of Paungda Danda.	\N	\N	\N	3	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
41	12	5	Trek to Manang (3,540 m)	Traverse the scenic upper trail via Ghyaru and Ngawal.	\N	\N	\N	4	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
42	12	6	Acclimatization in Manang	Visit Gangapurna Lake and Milarepa's meditation cave.	\N	\N	\N	5	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
43	12	7	Trek to Yak Kharka (4,050 m)	Ascend past alpine pastures grazing yaks.	\N	\N	\N	6	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
44	12	8	Trek to Thorong Phedi (4,450 m)	Base of the high pass with dramatic barren slopes.	\N	\N	\N	7	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
45	12	9	Cross Thorong La Pass (5,416 m) to Muktinath (3,760 m)	The crown jewel pass crossing with exhilarating vistas.	\N	\N	\N	8	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
46	12	10	Trek to Marpha via Jomsom	Descend into the Kali Gandaki valley and traditional stone villages.	\N	\N	\N	9	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
47	12	11	Drive to Tatopani Hot Springs	Relax your muscles in natural thermal pools.	\N	\N	\N	10	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
48	12	12	Trek to Ghorepani (2,860 m)	Climb through rhododendron forests.	\N	\N	\N	11	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
49	12	13	Sunrise at Poon Hill & Trek to Tikhedhunga	Spectacular sunrise over Dhaulagiri and Annapurna ranges.	\N	\N	\N	12	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
50	12	14	Trek to Nayapul & Drive to Pokhara	Complete the trek and enjoy lakeside Pokhara.	\N	\N	\N	13	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
51	12	15	Drive or Fly to Kathmandu	Return to Kathmandu for farewell celebration.	\N	\N	\N	14	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
52	12	16	Departure	Transfer to airport for your onward journey.	\N	\N	\N	15	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
53	13	1	Arrival in Paro & Drive to Thimphu	Spectacular landing in Paro valley and scenic drive to Thimphu.	\N	\N	\N	0	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
54	13	2	Thimphu Valley Heritage & Culture	Visit Buddha Dordenma, National Memorial Chorten, and folk heritage museums.	\N	\N	\N	1	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
55	13	3	Dochula Pass & Punakha Valley	Cross Dochula Pass (3,100 m) with 108 memorial chortens and visit Punakha Dzong.	\N	\N	\N	2	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
56	13	4	Punakha to Paro Valley	Scenic drive back to Paro with visits to historic fortress watchtowers.	\N	\N	\N	3	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
57	13	5	Pilgrimage Hike to Tiger's Nest (Taktsang)	Ascend to the breathtaking monastery clinging to a 900-meter granite cliff.	\N	\N	\N	4	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
58	13	6	Paro Cultural Exploration	Visit Kyichu Lhakhang, one of Bhutan's oldest 7th-century shrines.	\N	\N	\N	5	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
59	13	7	Departure from Paro	Transfer to airport for your onward flight.	\N	\N	\N	6	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N
\.


--
-- Data for Name: trips; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trips (id, slug, code, title, short_description, full_description, destination_id, region_id, activity_id, category_id, duration_days, duration_nights, difficulty, max_altitude_m, max_altitude_label, min_group_size, max_group_size, start_location, end_location, best_season, base_price, sale_price, currency, single_supplement, child_price, featured, badge, status, published_at, seo_title, seo_description, hero_media_id, created_at, updated_at, deleted_at, display_area, group_pricing, elevation_profile_media_id, route_map_media_id, video_url, departures) FROM stdin;
10	everest-base-camp-trek	\N	Everest Base Camp Trek	The Everest Base Camp Trek is arguably the world's most renowned high-altitude mountain trek. Following in the footsteps of legendary mountaineers Sir Edmund Hillary and Tenzing Norgay Sherpa, this journey takes you deep into the heart of Sagarmatha National Park.	The Everest Base Camp Trek is arguably the world's most renowned high-altitude mountain trek. Following in the footsteps of legendary mountaineers Sir Edmund Hillary and Tenzing Norgay Sherpa, this journey takes you deep into the heart of Sagarmatha National Park.\n\nTraversing suspension bridges spanning raging glacial rivers, ascending through fragrant pine and rhododendron forests, and wandering through traditional Sherpa villages like Namche Bazaar and Dingboche, you will experience an authentic immersion into mountain life.\n\nThe grand culmination of the trek is standing at Everest Base Camp (5,364 m) amidst the Khumbu Icefall, followed by an early morning summit of Kala Patthar (5,545 m) for an awe-inspiring, unobstructed sunrise view over Mount Everest.	34	11	15	\N	14	\N	challenging	5545	5,545 m (Kala Patthar)	2	12				1550.00	1350.00	USD	\N	\N	t	MOST POPULAR	published	2026-09-30 18:24:52.894+00	\N	\N	20	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N	[]	\N	\N	\N	[]
11	kailash-mansarovar-yatra	\N	Mount Kailash & Lake Mansarovar Yatra	The Mount Kailash and Lake Mansarovar Yatra is one of the most sacred spiritual pilgrimages on Earth, revered by Hindus as the earthly abode of Lord Shiva, by Buddhists as Mount Meru, and by Jains and Bons.	The Mount Kailash and Lake Mansarovar Yatra is one of the most sacred spiritual pilgrimages on Earth, revered by Hindus as the earthly abode of Lord Shiva, by Buddhists as Mount Meru, and by Jains and Bons.\n\nJourneying across the high Tibetan plateau past sacred turquoise lakes and nomadic yaks, yatris complete the holy circumambulation (Kora) around Mount Kailash, culminating at the high Dolma La Pass (5,630 m) and the jewel-like Gauri Kund.\n\nComplete with holy dips and puja ceremonies on the shores of Lake Mansarovar, this journey offers an incomparable spiritual purification and inner awakening.	36	13	17	\N	13	\N	strenuous	5630	5,630 m (Dolma La Pass)	4	16				2800.00	2450.00	USD	\N	\N	t	SACRED PILGRIMAGE	published	2026-09-30 18:24:52.894+00	\N	\N	24	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N	[]	\N	\N	\N	[]
12	annapurna-circuit-trek	\N	Annapurna Circuit Trek	The Annapurna Circuit is widely celebrated as one of the world's most ecologically diverse treks. Circling the massive Annapurna massif, the trail transitions from lush terraced hillsides to Tibetan-style desert valleys of Lower Mustang.	The Annapurna Circuit is widely celebrated as one of the world's most ecologically diverse treks. Circling the massive Annapurna massif, the trail transitions from lush terraced hillsides to Tibetan-style desert valleys of Lower Mustang.\n\nThe pinnacle of the route is crossing Thorong La Pass at 5,416 meters, followed by the sacred pilgrim oasis of Muktinath and the charming cobbled village of Marpha known for apple orchards.	34	12	15	\N	16	\N	challenging	5416	5,416 m (Thorong La Pass)	2	12				1350.00	1150.00	USD	\N	\N	t	CLASSIC TREK	published	2026-09-30 18:24:52.894+00	\N	\N	38	2026-09-30 18:24:25.552858+00	2026-09-30 18:24:52.892844+00	\N	\N	[]	\N	\N	\N	[]
13	bhutan-cultural-odyssey	\N	Bhutan Cultural Odyssey & Tiger's Nest	Experience the enchanted Kingdom of Bhutan, where Gross National Happiness is prioritized over material wealth. Discover sacred cliff-hanging monasteries, majestic Dzongs, and serene pine valleys.	Experience the enchanted Kingdom of Bhutan, where Gross National Happiness is prioritized over material wealth. Discover sacred cliff-hanging monasteries, majestic Dzongs, and serene pine valleys.	35	\N	16	\N	7	\N	easy	3120	3,120 m (Tiger's Nest)	2	10				1890.00	\N	USD	\N	\N	t	EXCLUSIVE	archived	2026-09-30 18:24:52.894+00	\N	\N	22	2026-09-30 18:24:25.552858+00	2026-10-11 18:01:40.369152+00	2026-10-11 18:01:40.369152+00	Paro & Thimphu	[]	\N	\N	\N	[]
33	kadernath-dham-yatra	KYG-K-12	kadernath dham yatra	testing	testing	78	\N	\N	26	10	9	moderate	4500	4,500m	2	20	Kathmandu	Kathmandu	May to September	1500.00	1350.00	USD	300.00	1000.00	t	\N	published	2026-10-11 17:59:03.024+00	testing	testing	126	2026-10-11 17:59:03.020866+00	2026-10-11 19:14:28.938907+00	\N		[]	\N	\N	\N	[]
34	kailash-mansarovar-yatra-sacred-pilgrimage-via-kathmandu	KYG-KMY–-55	Kailash Mansarovar Yatra – Sacred Pilgrimage via Kathmandu	Experience the sacred journey to Mount Kailash and the holy Lake Mansarovar on a guided pilgrimage via Kathmandu, Nepal.	Experience the sacred journey to Mount Kailash and the holy Lake Mansarovar on a guided pilgrimage via Kathmandu, Nepal. This spiritual journey combines breathtaking Himalayan landscapes, visits to revered religious sites, and the opportunity to experience the peaceful surroundings of Lake Mansarovar and the magnificent Mount Kailash.\n\nThe package is planned for pilgrims seeking an organized journey with transportation, accommodation, meals, local guidance, and permit coordination according to the confirmed itinerary. The journey involves high-altitude travel, long road transfers, and potentially strenuous walking, so advance preparation and medical fitness are essential.\n\nTravel dates, route access, permits, inclusions, and final pricing are subject to confirmation before booking.	36	13	17	27	14	13	moderate	4500	4,500m	2	20	Kathmandu, Nepal	Kathmandu	Usually the summer pilgrimage season; confirm actual 2027 operating dates	2950.00	2750.00	USD	300.00	2200.00	f	\N	published	2026-10-12 17:42:15.49+00	Kailash Mansarovar Yatra via Kathmandu | Mission Nepal Holidays	Explore our Kailash Mansarovar Yatra package via Kathmandu, including the sacred Lake Mansarovar, Mount Kailash Darshan and optional outer Kora. Request confirmed dates and pricing.	129	2026-10-12 17:42:15.478708+00	2026-10-12 20:31:36.764205+00	\N		[{"maxPax": 1, "minPax": 1, "pricePerPax": 2950}, {"maxPax": 5, "minPax": 2, "pricePerPax": 2750}, {"maxPax": 9, "minPax": 6, "pricePerPax": 2735}, {"maxPax": 15, "minPax": 10, "pricePerPax": 2720}, {"maxPax": 20, "minPax": 16, "pricePerPax": 2700}, {"maxPax": 5, "minPax": 1, "pricePerPax": 2950}]	151	152	https://www.youtube.com/watch?v=7hB6_k12_jM	[{"id": "dep-1", "price": 2750, "status": "Guaranteed", "endDate": "2026-05-28", "startDate": "2026-05-15", "totalSeats": 25, "bookedSeats": 18}, {"id": "dep-2", "price": 2750, "status": "Guaranteed", "endDate": "2026-06-18", "startDate": "2026-06-05", "totalSeats": 25, "bookedSeats": 22}, {"id": "dep-3", "price": 2750, "status": "Open", "endDate": "2026-07-25", "startDate": "2026-07-12", "totalSeats": 25, "bookedSeats": 10}, {"id": "dep-4", "price": 2750, "status": "Open", "endDate": "2026-08-23", "startDate": "2026-08-10", "totalSeats": 25, "bookedSeats": 14}, {"id": "dep-5", "price": 2750, "status": "Open", "endDate": "2026-09-21", "startDate": "2026-09-08", "totalSeats": 25, "bookedSeats": 8}]
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (user_id, role_id, created_at) FROM stdin;
6	1	2026-09-30 05:23:19.687178+00
7	1	2026-09-30 05:23:19.687178+00
5	3	2026-09-30 05:23:19.687178+00
27	3	2026-10-02 10:25:59.692114+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, role, is_active, created_at, updated_at) FROM stdin;
5	Ankit	aksingh9318@gmail.com	$2b$10$YUie3ASoUynu9jrs.fsiFupvnVNAyok9Z10yv49n//NHyHDmKaPP.	user	t	2026-09-27 09:56:26.765845+00	2026-09-27 09:56:26.765845+00
6	Ankit	aksingh@gmail.com	$2b$10$USpjkE433SK7R0x6ou9j0O85DB6sXunIPaA.uNUImPdcrFXOArIae	user	t	2026-09-27 10:10:14.897079+00	2026-09-27 10:10:14.897079+00
7	Ankit	testing@gmail.com	$2b$10$GGk3QHwWRl013.5ul3tF/eUNteMucIZSVOuhlrIHLSpLnvwvVPjeW	user	t	2026-09-27 10:11:46.313845+00	2026-09-27 10:11:46.313845+00
27	admin	admin@gmail.com	$2b$10$kpN9tPJr8zMaxQJrZro2c.briFpG8cS9Da0hNE/cBjLCzmjD5rOea	user	t	2026-10-02 10:23:30.805302+00	2026-10-02 10:23:30.805302+00
\.


--
-- Name: activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.activities_id_seq', 41, true);


--
-- Name: blog_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.blog_categories_id_seq', 12, true);


--
-- Name: blog_section_paragraphs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.blog_section_paragraphs_id_seq', 66, true);


--
-- Name: blog_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.blog_sections_id_seq', 49, true);


--
-- Name: blogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.blogs_id_seq', 55, true);


--
-- Name: destinations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.destinations_id_seq', 79, true);


--
-- Name: faqs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.faqs_id_seq', 83, true);


--
-- Name: gallery_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.gallery_items_id_seq', 91, true);


--
-- Name: inquiries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inquiries_id_seq', 3, true);


--
-- Name: media_assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.media_assets_id_seq', 157, true);


--
-- Name: newsletter_subscribers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.newsletter_subscribers_id_seq', 40, true);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permissions_id_seq', 26, true);


--
-- Name: region_experiences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.region_experiences_id_seq', 50, true);


--
-- Name: region_popular_places_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.region_popular_places_id_seq', 56, true);


--
-- Name: regions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.regions_id_seq', 34, true);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reviews_id_seq', 124, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- Name: trip_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trip_categories_id_seq', 27, true);


--
-- Name: trip_exclusions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trip_exclusions_id_seq', 206, true);


--
-- Name: trip_highlights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trip_highlights_id_seq', 200, true);


--
-- Name: trip_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trip_images_id_seq', 75, true);


--
-- Name: trip_inclusions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trip_inclusions_id_seq', 190, true);


--
-- Name: trip_itinerary_days_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trip_itinerary_days_id_seq', 383, true);


--
-- Name: trips_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trips_id_seq', 35, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 78, true);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: activities activities_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_slug_key UNIQUE (slug);


--
-- Name: blog_categories blog_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_slug_key UNIQUE (slug);


--
-- Name: blog_section_paragraphs blog_section_paragraphs_blog_section_id_sort_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_section_paragraphs
    ADD CONSTRAINT blog_section_paragraphs_blog_section_id_sort_order_key UNIQUE (blog_section_id, sort_order);


--
-- Name: blog_section_paragraphs blog_section_paragraphs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_section_paragraphs
    ADD CONSTRAINT blog_section_paragraphs_pkey PRIMARY KEY (id);


--
-- Name: blog_sections blog_sections_blog_id_sort_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_sections
    ADD CONSTRAINT blog_sections_blog_id_sort_order_key UNIQUE (blog_id, sort_order);


--
-- Name: blog_sections blog_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_sections
    ADD CONSTRAINT blog_sections_pkey PRIMARY KEY (id);


--
-- Name: blogs blogs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_pkey PRIMARY KEY (id);


--
-- Name: blogs blogs_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_slug_key UNIQUE (slug);


--
-- Name: destinations destinations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.destinations
    ADD CONSTRAINT destinations_pkey PRIMARY KEY (id);


--
-- Name: destinations destinations_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.destinations
    ADD CONSTRAINT destinations_slug_key UNIQUE (slug);


--
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);


--
-- Name: gallery_items gallery_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_items
    ADD CONSTRAINT gallery_items_pkey PRIMARY KEY (id);


--
-- Name: inquiries inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_pkey PRIMARY KEY (id);


--
-- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);


--
-- Name: media_assets media_assets_storage_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_storage_key_key UNIQUE (storage_key);


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_key_key UNIQUE (key);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: region_experiences region_experiences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.region_experiences
    ADD CONSTRAINT region_experiences_pkey PRIMARY KEY (id);


--
-- Name: region_experiences region_experiences_region_id_sort_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.region_experiences
    ADD CONSTRAINT region_experiences_region_id_sort_order_key UNIQUE (region_id, sort_order);


--
-- Name: region_experiences region_experiences_region_id_source_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.region_experiences
    ADD CONSTRAINT region_experiences_region_id_source_id_key UNIQUE (region_id, source_id);


--
-- Name: region_popular_places region_popular_places_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.region_popular_places
    ADD CONSTRAINT region_popular_places_pkey PRIMARY KEY (id);


--
-- Name: region_popular_places region_popular_places_region_id_sort_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.region_popular_places
    ADD CONSTRAINT region_popular_places_region_id_sort_order_key UNIQUE (region_id, sort_order);


--
-- Name: region_popular_places region_popular_places_region_id_source_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.region_popular_places
    ADD CONSTRAINT region_popular_places_region_id_source_id_key UNIQUE (region_id, source_id);


--
-- Name: regions regions_destination_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_destination_id_id_key UNIQUE (destination_id, id);


--
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);


--
-- Name: regions regions_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_slug_key UNIQUE (slug);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_key_key UNIQUE (key);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (name);


--
-- Name: trip_categories trip_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_categories
    ADD CONSTRAINT trip_categories_pkey PRIMARY KEY (id);


--
-- Name: trip_categories trip_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_categories
    ADD CONSTRAINT trip_categories_slug_key UNIQUE (slug);


--
-- Name: trip_exclusions trip_exclusions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_exclusions
    ADD CONSTRAINT trip_exclusions_pkey PRIMARY KEY (id);


--
-- Name: trip_exclusions trip_exclusions_trip_id_sort_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_exclusions
    ADD CONSTRAINT trip_exclusions_trip_id_sort_order_key UNIQUE (trip_id, sort_order);


--
-- Name: trip_highlights trip_highlights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_highlights
    ADD CONSTRAINT trip_highlights_pkey PRIMARY KEY (id);


--
-- Name: trip_highlights trip_highlights_trip_id_sort_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_highlights
    ADD CONSTRAINT trip_highlights_trip_id_sort_order_key UNIQUE (trip_id, sort_order);


--
-- Name: trip_images trip_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_images
    ADD CONSTRAINT trip_images_pkey PRIMARY KEY (id);


--
-- Name: trip_images trip_images_trip_id_sort_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_images
    ADD CONSTRAINT trip_images_trip_id_sort_order_key UNIQUE (trip_id, sort_order);


--
-- Name: trip_inclusions trip_inclusions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_inclusions
    ADD CONSTRAINT trip_inclusions_pkey PRIMARY KEY (id);


--
-- Name: trip_inclusions trip_inclusions_trip_id_sort_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_inclusions
    ADD CONSTRAINT trip_inclusions_trip_id_sort_order_key UNIQUE (trip_id, sort_order);


--
-- Name: trip_itinerary_days trip_itinerary_days_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_itinerary_days
    ADD CONSTRAINT trip_itinerary_days_pkey PRIMARY KEY (id);


--
-- Name: trip_itinerary_days trip_itinerary_days_trip_id_day_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_itinerary_days
    ADD CONSTRAINT trip_itinerary_days_trip_id_day_number_key UNIQUE (trip_id, day_number);


--
-- Name: trip_itinerary_days trip_itinerary_days_trip_id_sort_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_itinerary_days
    ADD CONSTRAINT trip_itinerary_days_trip_id_sort_order_key UNIQUE (trip_id, sort_order);


--
-- Name: trips trips_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_code_key UNIQUE (code);


--
-- Name: trips trips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_pkey PRIMARY KEY (id);


--
-- Name: trips trips_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_slug_key UNIQUE (slug);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: activities_status_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_status_published_idx ON public.activities USING btree (status, published_at DESC);


--
-- Name: blog_section_paragraphs_section_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blog_section_paragraphs_section_id_idx ON public.blog_section_paragraphs USING btree (blog_section_id);


--
-- Name: blog_sections_media_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blog_sections_media_id_idx ON public.blog_sections USING btree (media_id);


--
-- Name: blogs_category_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blogs_category_id_idx ON public.blogs USING btree (category_id);


--
-- Name: blogs_status_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blogs_status_published_idx ON public.blogs USING btree (status, published_at DESC);


--
-- Name: destinations_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX destinations_country_idx ON public.destinations USING btree (country);


--
-- Name: destinations_status_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX destinations_status_published_idx ON public.destinations USING btree (status, published_at DESC);


--
-- Name: faqs_page_status_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX faqs_page_status_order_idx ON public.faqs USING btree (page_key, status, sort_order);


--
-- Name: faqs_trip_status_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX faqs_trip_status_order_idx ON public.faqs USING btree (trip_id, status, sort_order);


--
-- Name: gallery_items_blog_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX gallery_items_blog_id_idx ON public.gallery_items USING btree (blog_id);


--
-- Name: gallery_items_media_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX gallery_items_media_id_idx ON public.gallery_items USING btree (media_id);


--
-- Name: gallery_items_source_id_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX gallery_items_source_id_uidx ON public.gallery_items USING btree (source_id) WHERE (source_id IS NOT NULL);


--
-- Name: gallery_items_status_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX gallery_items_status_order_idx ON public.gallery_items USING btree (status, sort_order);


--
-- Name: gallery_items_trip_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX gallery_items_trip_id_idx ON public.gallery_items USING btree (trip_id);


--
-- Name: inquiries_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inquiries_email_idx ON public.inquiries USING btree (email);


--
-- Name: inquiries_status_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inquiries_status_created_idx ON public.inquiries USING btree (status, created_at DESC);


--
-- Name: inquiries_trip_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inquiries_trip_id_idx ON public.inquiries USING btree (trip_id);


--
-- Name: media_assets_created_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_assets_created_by_idx ON public.media_assets USING btree (created_by);


--
-- Name: newsletter_subscribers_email_lower_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX newsletter_subscribers_email_lower_uidx ON public.newsletter_subscribers USING btree (lower((email)::text));


--
-- Name: newsletter_subscribers_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX newsletter_subscribers_status_idx ON public.newsletter_subscribers USING btree (status);


--
-- Name: region_experiences_media_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX region_experiences_media_id_idx ON public.region_experiences USING btree (media_id);


--
-- Name: region_experiences_public_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX region_experiences_public_order_idx ON public.region_experiences USING btree (region_id, status, sort_order, id);


--
-- Name: region_popular_places_media_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX region_popular_places_media_id_idx ON public.region_popular_places USING btree (media_id);


--
-- Name: region_popular_places_public_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX region_popular_places_public_order_idx ON public.region_popular_places USING btree (region_id, status, sort_order, id);


--
-- Name: regions_destination_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX regions_destination_id_idx ON public.regions USING btree (destination_id);


--
-- Name: regions_status_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX regions_status_published_idx ON public.regions USING btree (status, published_at DESC);


--
-- Name: reviews_source_id_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reviews_source_id_uidx ON public.reviews USING btree (source_id) WHERE (source_id IS NOT NULL);


--
-- Name: reviews_status_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reviews_status_created_idx ON public.reviews USING btree (status, created_at DESC);


--
-- Name: reviews_trip_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reviews_trip_id_idx ON public.reviews USING btree (trip_id);


--
-- Name: role_permissions_permission_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_permissions_permission_id_idx ON public.role_permissions USING btree (permission_id);


--
-- Name: trip_categories_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trip_categories_status_idx ON public.trip_categories USING btree (status);


--
-- Name: trip_images_media_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trip_images_media_id_idx ON public.trip_images USING btree (media_id);


--
-- Name: trip_images_one_hero_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX trip_images_one_hero_idx ON public.trip_images USING btree (trip_id) WHERE is_hero;


--
-- Name: trip_itinerary_days_media_id_2_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trip_itinerary_days_media_id_2_idx ON public.trip_itinerary_days USING btree (media_id_2);


--
-- Name: trip_itinerary_days_media_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trip_itinerary_days_media_id_idx ON public.trip_itinerary_days USING btree (media_id);


--
-- Name: trip_itinerary_days_trip_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trip_itinerary_days_trip_id_idx ON public.trip_itinerary_days USING btree (trip_id);


--
-- Name: trips_activity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trips_activity_id_idx ON public.trips USING btree (activity_id);


--
-- Name: trips_category_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trips_category_id_idx ON public.trips USING btree (category_id);


--
-- Name: trips_destination_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trips_destination_id_idx ON public.trips USING btree (destination_id);


--
-- Name: trips_featured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trips_featured_idx ON public.trips USING btree (featured) WHERE (featured AND (deleted_at IS NULL));


--
-- Name: trips_region_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trips_region_id_idx ON public.trips USING btree (region_id);


--
-- Name: trips_status_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trips_status_published_idx ON public.trips USING btree (status, published_at DESC);


--
-- Name: user_roles_role_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_roles_role_id_idx ON public.user_roles USING btree (role_id);


--
-- Name: activities activities_hero_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_hero_media_id_fkey FOREIGN KEY (hero_media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: blog_section_paragraphs blog_section_paragraphs_blog_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_section_paragraphs
    ADD CONSTRAINT blog_section_paragraphs_blog_section_id_fkey FOREIGN KEY (blog_section_id) REFERENCES public.blog_sections(id) ON DELETE CASCADE;


--
-- Name: blog_sections blog_sections_blog_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_sections
    ADD CONSTRAINT blog_sections_blog_id_fkey FOREIGN KEY (blog_id) REFERENCES public.blogs(id) ON DELETE CASCADE;


--
-- Name: blog_sections blog_sections_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_sections
    ADD CONSTRAINT blog_sections_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: blogs blogs_author_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_author_media_id_fkey FOREIGN KEY (author_media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: blogs blogs_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.blog_categories(id) ON DELETE SET NULL;


--
-- Name: blogs blogs_hero_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_hero_media_id_fkey FOREIGN KEY (hero_media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: destinations destinations_featured_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.destinations
    ADD CONSTRAINT destinations_featured_media_id_fkey FOREIGN KEY (featured_media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: destinations destinations_hero_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.destinations
    ADD CONSTRAINT destinations_hero_media_id_fkey FOREIGN KEY (hero_media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: faqs faqs_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;


--
-- Name: gallery_items gallery_items_blog_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_items
    ADD CONSTRAINT gallery_items_blog_id_fkey FOREIGN KEY (blog_id) REFERENCES public.blogs(id) ON DELETE SET NULL;


--
-- Name: gallery_items gallery_items_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_items
    ADD CONSTRAINT gallery_items_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media_assets(id) ON DELETE RESTRICT;


--
-- Name: gallery_items gallery_items_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_items
    ADD CONSTRAINT gallery_items_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE SET NULL;


--
-- Name: inquiries inquiries_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE SET NULL;


--
-- Name: media_assets media_assets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: region_experiences region_experiences_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.region_experiences
    ADD CONSTRAINT region_experiences_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: region_experiences region_experiences_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.region_experiences
    ADD CONSTRAINT region_experiences_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE CASCADE;


--
-- Name: region_popular_places region_popular_places_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.region_popular_places
    ADD CONSTRAINT region_popular_places_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: region_popular_places region_popular_places_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.region_popular_places
    ADD CONSTRAINT region_popular_places_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE CASCADE;


--
-- Name: regions regions_destination_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id) ON DELETE RESTRICT;


--
-- Name: regions regions_hero_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_hero_media_id_fkey FOREIGN KEY (hero_media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_photo_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_photo_media_id_fkey FOREIGN KEY (photo_media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: trip_categories trip_categories_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_categories
    ADD CONSTRAINT trip_categories_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: trip_exclusions trip_exclusions_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_exclusions
    ADD CONSTRAINT trip_exclusions_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;


--
-- Name: trip_highlights trip_highlights_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_highlights
    ADD CONSTRAINT trip_highlights_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;


--
-- Name: trip_images trip_images_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_images
    ADD CONSTRAINT trip_images_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media_assets(id) ON DELETE RESTRICT;


--
-- Name: trip_images trip_images_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_images
    ADD CONSTRAINT trip_images_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;


--
-- Name: trip_inclusions trip_inclusions_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_inclusions
    ADD CONSTRAINT trip_inclusions_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;


--
-- Name: trip_itinerary_days trip_itinerary_days_media_id_2_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_itinerary_days
    ADD CONSTRAINT trip_itinerary_days_media_id_2_fkey FOREIGN KEY (media_id_2) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: trip_itinerary_days trip_itinerary_days_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_itinerary_days
    ADD CONSTRAINT trip_itinerary_days_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: trip_itinerary_days trip_itinerary_days_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_itinerary_days
    ADD CONSTRAINT trip_itinerary_days_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;


--
-- Name: trips trips_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE RESTRICT;


--
-- Name: trips trips_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.trip_categories(id) ON DELETE RESTRICT;


--
-- Name: trips trips_destination_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id) ON DELETE RESTRICT;


--
-- Name: trips trips_elevation_profile_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_elevation_profile_media_id_fkey FOREIGN KEY (elevation_profile_media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: trips trips_hero_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_hero_media_id_fkey FOREIGN KEY (hero_media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: trips trips_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE RESTRICT;


--
-- Name: trips trips_region_matches_destination_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_region_matches_destination_fk FOREIGN KEY (destination_id, region_id) REFERENCES public.regions(destination_id, id) ON DELETE RESTRICT;


--
-- Name: trips trips_route_map_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_route_map_media_id_fkey FOREIGN KEY (route_map_media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict QHRdMdDFBJrjQAzp0pc7yRlWMs1GRA2erCPwhnSa8v5ZCXC4Z3bqJmFNd2BZxQZ

