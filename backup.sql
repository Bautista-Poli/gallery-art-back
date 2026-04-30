--
-- PostgreSQL database dump
--

\restrict H4Dy76HwdVp52FUQWzVmP0gBE0ZYfDiTLehKIL6xGUMthXpAhMTknBrNV1xfk2R

-- Dumped from database version 17.8 (130b160)
-- Dumped by pg_dump version 18.3 (Homebrew)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: artista_imagenes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.artista_imagenes (
    id integer NOT NULL,
    slot text NOT NULL,
    imagen_url text NOT NULL,
    imagen_public_id text NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.artista_imagenes OWNER TO neondb_owner;

--
-- Name: artista_imagenes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.artista_imagenes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.artista_imagenes_id_seq OWNER TO neondb_owner;

--
-- Name: artista_imagenes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.artista_imagenes_id_seq OWNED BY public.artista_imagenes.id;


--
-- Name: exposiciones; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.exposiciones (
    id integer NOT NULL,
    titulo text NOT NULL,
    tipo text NOT NULL,
    venue text NOT NULL,
    anio integer NOT NULL,
    descripcion text DEFAULT ''::text NOT NULL,
    imagen_url text,
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    imagen_public_id text,
    fecha date,
    link_entradas text,
    CONSTRAINT exposiciones_tipo_check CHECK ((tipo = ANY (ARRAY['individual'::text, 'colectiva'::text])))
);


ALTER TABLE public.exposiciones OWNER TO neondb_owner;

--
-- Name: exposiciones_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.exposiciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exposiciones_id_seq OWNER TO neondb_owner;

--
-- Name: exposiciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.exposiciones_id_seq OWNED BY public.exposiciones.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id text NOT NULL,
    name text NOT NULL,
    cat text NOT NULL,
    price integer NOT NULL,
    original_price integer NOT NULL,
    is_new boolean DEFAULT false,
    is_sale boolean DEFAULT false,
    description text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    images text[] DEFAULT '{}'::text[],
    year text,
    dimensions text,
    technique text,
    sold boolean DEFAULT false,
    featured boolean DEFAULT false
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: artista_imagenes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.artista_imagenes ALTER COLUMN id SET DEFAULT nextval('public.artista_imagenes_id_seq'::regclass);


--
-- Name: exposiciones id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.exposiciones ALTER COLUMN id SET DEFAULT nextval('public.exposiciones_id_seq'::regclass);


--
-- Data for Name: artista_imagenes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.artista_imagenes (id, slot, imagen_url, imagen_public_id, orden, created_at, updated_at) FROM stdin;
2	fullbleed	assets/artista/taller.jpg	placeholder_fullbleed	1	2026-04-28 02:49:08.620869+00	2026-04-28 02:49:08.620869+00
3	gallery_1	assets/artista/artista-1.jpg	placeholder_g1	2	2026-04-28 02:49:08.620869+00	2026-04-28 02:49:08.620869+00
4	gallery_2	assets/artista/artista-2.jpg	placeholder_g2	3	2026-04-28 02:49:08.620869+00	2026-04-28 02:49:08.620869+00
5	gallery_3	assets/artista/artista-3.jpg	placeholder_g3	4	2026-04-28 02:49:08.620869+00	2026-04-28 02:49:08.620869+00
6	gallery_4	assets/artista/artista-4.jpg	placeholder_g4	5	2026-04-28 02:49:08.620869+00	2026-04-28 02:49:08.620869+00
7	gallery_5	assets/artista/artista-5.jpg	placeholder_g5	6	2026-04-28 02:49:08.620869+00	2026-04-28 02:49:08.620869+00
8	gallery_6	assets/artista/artista-6.jpg	placeholder_g6	7	2026-04-28 02:49:08.620869+00	2026-04-28 02:49:08.620869+00
9	gallery_7	assets/artista/artista-7.jpg	placeholder_g7	8	2026-04-28 02:49:08.620869+00	2026-04-28 02:49:08.620869+00
10	gallery_8	assets/artista/artista-8.jpg	placeholder_g8	9	2026-04-28 02:49:08.620869+00	2026-04-28 02:49:08.620869+00
1	hero	https://res.cloudinary.com/dy9dgbzq4/image/upload/v1777345348/art-gallery/artista/artista_hero_1777345346740.jpg	art-gallery/artista/artista_hero_1777345346740	0	2026-04-28 02:49:08.620869+00	2026-04-28 03:02:29.527174+00
\.


--
-- Data for Name: exposiciones; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.exposiciones (id, titulo, tipo, venue, anio, descripcion, imagen_url, orden, created_at, updated_at, imagen_public_id, fecha, link_entradas) FROM stdin;
2	Título de la exposición colectiva	colectiva	Centro Cultural / Museo · Buenos Aires	2025	Descripción breve de la muestra.	https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Breezeicons-actions-22-view-preview.svg/250px-Breezeicons-actions-22-view-preview.svg.png	2	2026-04-28 01:10:42.916011+00	2026-04-28 01:10:42.916011+00	\N	\N	\N
3	Título de la exposición	individual	Galería · Buenos Aires, Argentina	2024	Descripción breve de la muestra.	https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Breezeicons-actions-22-view-preview.svg/250px-Breezeicons-actions-22-view-preview.svg.png	1	2026-04-28 01:10:42.916011+00	2026-04-28 01:10:42.916011+00	\N	\N	\N
4	Título de la exposición colectiva	colectiva	Espacio de Arte · Rosario, Santa Fe	2023	Descripción breve de la muestra.	https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Breezeicons-actions-22-view-preview.svg/250px-Breezeicons-actions-22-view-preview.svg.png	1	2026-04-28 01:10:42.916011+00	2026-04-28 01:10:42.916011+00	\N	\N	\N
1	Exposicion en bordo	individual	Gallo 1477	2025	No se	https://res.cloudinary.com/dy9dgbzq4/image/upload/v1777342312/art-gallery/exposiciones/jka0mvzutetmp6q0caqu.jpg	0	2026-04-28 01:10:42.916011+00	2026-04-28 02:42:15.593976+00	art-gallery/exposiciones/jka0mvzutetmp6q0caqu	\N	\N
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.products (id, name, cat, price, original_price, is_new, is_sale, description, active, created_at, images, year, dimensions, technique, sold, featured) FROM stdin;
p05	Camino al Frey en otoño	pintura	27000	46000	t	t	\N	t	2026-02-22 23:09:20.110165+00	{assets/Products/Obra2/product1-1.jpg}	\N	90 x 60 cm	\N	t	f
obra_1777153392334	Age of empire	Paisaje	1000000	1000000	f	f	\N	t	2026-04-25 21:43:13.481064+00	{https://res.cloudinary.com/dy9dgbzq4/image/upload/v1777153366/art-gallery/products/difxitukuwb32uinrcbv.jpg}	2026	80 x 60 cm	Óleo sobre tela	f	f
p02	Lago Azul	pintura	30000	46000	t	t	\N	t	2026-02-22 23:09:20.110165+00	{assets/Products/Obra1/product1-2.jpg}	\N	40 x 60 cm	\N	f	f
obra_1777312321094	Vinilo floreado	Otro	100000	100000	f	f	...	t	2026-04-27 17:52:02.497791+00	{https://res.cloudinary.com/dy9dgbzq4/image/upload/v1777312054/art-gallery/products/ar3jt6til0ljrkfkgwlw.jpg}	2026	20 x 20 cm	Óleo sobre tela	f	f
p01	Fitz Roy!	pintura	51000	85000	t	t	\N	t	2026-02-22 23:09:20.110165+00	{assets/Products/Obra1/product1-1.jpg}	\N	40 x 40 cm	\N	t	f
\.


--
-- Name: artista_imagenes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.artista_imagenes_id_seq', 10, true);


--
-- Name: exposiciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.exposiciones_id_seq', 6, true);


--
-- Name: artista_imagenes artista_imagenes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.artista_imagenes
    ADD CONSTRAINT artista_imagenes_pkey PRIMARY KEY (id);


--
-- Name: artista_imagenes artista_imagenes_slot_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.artista_imagenes
    ADD CONSTRAINT artista_imagenes_slot_key UNIQUE (slot);


--
-- Name: exposiciones exposiciones_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.exposiciones
    ADD CONSTRAINT exposiciones_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: idx_artista_imagenes_orden; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_artista_imagenes_orden ON public.artista_imagenes USING btree (orden);


--
-- Name: idx_exposiciones_anio; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_exposiciones_anio ON public.exposiciones USING btree (anio DESC, orden);


--
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_products_active ON public.products USING btree (active);


--
-- Name: idx_products_cat; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_products_cat ON public.products USING btree (cat);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict H4Dy76HwdVp52FUQWzVmP0gBE0ZYfDiTLehKIL6xGUMthXpAhMTknBrNV1xfk2R

