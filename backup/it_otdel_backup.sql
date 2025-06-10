--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Debian 17.5-1.pgdg120+1)
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: maks17990
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO maks17990;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: maks17990
--

COMMENT ON SCHEMA public IS '';


--
-- Name: Department; Type: TYPE; Schema: public; Owner: maks17990
--

CREATE TYPE public."Department" AS ENUM (
    'AHO',
    'ADMIN',
    'STATIONAR',
    'GYN',
    'INFECT',
    'GP',
    'OPHTHALMO',
    'ENT',
    'NURSE',
    'EMERGENCY',
    'UZI',
    'STATISTICS',
    'DIABET_SCHOOL',
    'ENDOSCOPY',
    'LAB',
    'VOENKOM',
    'ELDERLY',
    'PREVENTION',
    'PAID',
    'FUNCTIONAL',
    'VACCINATION',
    'PROCEDURE',
    'REGISTRY',
    'XRAY',
    'THERAPY_1',
    'THERAPY_2',
    'THERAPY_3',
    'THERAPY_4',
    'THERAPY_5',
    'PHYSIOTHERAPY',
    'SURGERY',
    'STERILIZATION',
    'HEALTH_CENTER'
);


ALTER TYPE public."Department" OWNER TO maks17990;

--
-- Name: Priority; Type: TYPE; Schema: public; Owner: maks17990
--

CREATE TYPE public."Priority" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."Priority" OWNER TO maks17990;

--
-- Name: RequestSource; Type: TYPE; Schema: public; Owner: maks17990
--

CREATE TYPE public."RequestSource" AS ENUM (
    'WEB',
    'TELEGRAM',
    'PHONE'
);


ALTER TYPE public."RequestSource" OWNER TO maks17990;

--
-- Name: RequestStatus; Type: TYPE; Schema: public; Owner: maks17990
--

CREATE TYPE public."RequestStatus" AS ENUM (
    'NEW',
    'IN_PROGRESS',
    'DONE',
    'REJECTED',
    'COMPLETED'
);


ALTER TYPE public."RequestStatus" OWNER TO maks17990;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: maks17990
--

CREATE TYPE public."Role" AS ENUM (
    'user',
    'admin',
    'superuser'
);


ALTER TYPE public."Role" OWNER TO maks17990;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Comment; Type: TABLE; Schema: public; Owner: maks17990
--

CREATE TABLE public."Comment" (
    id integer NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" integer NOT NULL,
    "requestId" integer NOT NULL
);


ALTER TABLE public."Comment" OWNER TO maks17990;

--
-- Name: Comment_id_seq; Type: SEQUENCE; Schema: public; Owner: maks17990
--

CREATE SEQUENCE public."Comment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Comment_id_seq" OWNER TO maks17990;

--
-- Name: Comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: maks17990
--

ALTER SEQUENCE public."Comment_id_seq" OWNED BY public."Comment".id;


--
-- Name: Equipment; Type: TABLE; Schema: public; Owner: maks17990
--

CREATE TABLE public."Equipment" (
    id integer NOT NULL,
    "inventoryNumber" character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    "macAddress" character varying(50),
    "ipAddress" character varying(50),
    login character varying(50),
    password character varying(50),
    location character varying(50) NOT NULL,
    floor character varying(10),
    cabinet character varying(10),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "fileUrls" text[] DEFAULT ARRAY[]::text[],
    "assignedToUserId" integer
);


ALTER TABLE public."Equipment" OWNER TO maks17990;

--
-- Name: Equipment_id_seq; Type: SEQUENCE; Schema: public; Owner: maks17990
--

CREATE SEQUENCE public."Equipment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Equipment_id_seq" OWNER TO maks17990;

--
-- Name: Equipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: maks17990
--

ALTER SEQUENCE public."Equipment_id_seq" OWNED BY public."Equipment".id;


--
-- Name: News; Type: TABLE; Schema: public; Owner: maks17990
--

CREATE TABLE public."News" (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."News" OWNER TO maks17990;

--
-- Name: News_id_seq; Type: SEQUENCE; Schema: public; Owner: maks17990
--

CREATE SEQUENCE public."News_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."News_id_seq" OWNER TO maks17990;

--
-- Name: News_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: maks17990
--

ALTER SEQUENCE public."News_id_seq" OWNED BY public."News".id;


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: maks17990
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" integer,
    role public."Role",
    department public."Department",
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    url text,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO maks17990;

--
-- Name: Request; Type: TABLE; Schema: public; Owner: maks17990
--

CREATE TABLE public."Request" (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    content text NOT NULL,
    status public."RequestStatus" DEFAULT 'NEW'::public."RequestStatus" NOT NULL,
    priority public."Priority" DEFAULT 'NORMAL'::public."Priority" NOT NULL,
    category character varying(50),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expectedResolutionDate" timestamp(3) without time zone,
    "resolvedAt" timestamp(3) without time zone,
    "assignedAt" timestamp(3) without time zone,
    "workDuration" integer,
    source public."RequestSource" DEFAULT 'WEB'::public."RequestSource",
    "userId" integer NOT NULL,
    "executorId" integer,
    rating integer,
    feedback text,
    "fileUrls" text[] DEFAULT ARRAY[]::text[]
);


ALTER TABLE public."Request" OWNER TO maks17990;

--
-- Name: Request_id_seq; Type: SEQUENCE; Schema: public; Owner: maks17990
--

CREATE SEQUENCE public."Request_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Request_id_seq" OWNER TO maks17990;

--
-- Name: Request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: maks17990
--

ALTER SEQUENCE public."Request_id_seq" OWNED BY public."Request".id;


--
-- Name: Software; Type: TABLE; Schema: public; Owner: maks17990
--

CREATE TABLE public."Software" (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    version character varying(50),
    "licenseKey" character varying(255),
    "licensedTo" character varying(100),
    "adminLogin" character varying(50),
    "adminPassword" character varying(50),
    "networkAddress" character varying(100),
    floor character varying(10),
    cabinet character varying(10),
    "purchaseDate" timestamp(3) without time zone,
    "supportStart" timestamp(3) without time zone,
    "supportEnd" timestamp(3) without time zone,
    "expiryDate" timestamp(3) without time zone,
    "fileUrls" text[] DEFAULT ARRAY[]::text[],
    "installDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Software" OWNER TO maks17990;

--
-- Name: Software_id_seq; Type: SEQUENCE; Schema: public; Owner: maks17990
--

CREATE SEQUENCE public."Software_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Software_id_seq" OWNER TO maks17990;

--
-- Name: Software_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: maks17990
--

ALTER SEQUENCE public."Software_id_seq" OWNED BY public."Software".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: maks17990
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    "lastName" character varying(100) NOT NULL,
    "firstName" character varying(100) NOT NULL,
    "middleName" character varying(100),
    "passwordHash" text NOT NULL,
    role public."Role" DEFAULT 'user'::public."Role" NOT NULL,
    "birthDate" date NOT NULL,
    snils character varying(20) NOT NULL,
    "mobilePhone" character varying(20) NOT NULL,
    "internalPhone" character varying(10) NOT NULL,
    "position" character varying(100) NOT NULL,
    department public."Department" NOT NULL,
    floor character varying(10),
    cabinet character varying(10),
    "telegramChatId" character varying(20)
);


ALTER TABLE public."User" OWNER TO maks17990;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: maks17990
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO maks17990;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: maks17990
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _EquipmentToSoftware; Type: TABLE; Schema: public; Owner: maks17990
--

CREATE TABLE public."_EquipmentToSoftware" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);


ALTER TABLE public."_EquipmentToSoftware" OWNER TO maks17990;

--
-- Name: _UserToSoftware; Type: TABLE; Schema: public; Owner: maks17990
--

CREATE TABLE public."_UserToSoftware" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);


ALTER TABLE public."_UserToSoftware" OWNER TO maks17990;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: maks17990
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO maks17990;

--
-- Name: Comment id; Type: DEFAULT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."Comment" ALTER COLUMN id SET DEFAULT nextval('public."Comment_id_seq"'::regclass);


--
-- Name: Equipment id; Type: DEFAULT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."Equipment" ALTER COLUMN id SET DEFAULT nextval('public."Equipment_id_seq"'::regclass);


--
-- Name: News id; Type: DEFAULT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."News" ALTER COLUMN id SET DEFAULT nextval('public."News_id_seq"'::regclass);


--
-- Name: Request id; Type: DEFAULT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."Request" ALTER COLUMN id SET DEFAULT nextval('public."Request_id_seq"'::regclass);


--
-- Name: Software id; Type: DEFAULT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."Software" ALTER COLUMN id SET DEFAULT nextval('public."Software_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: maks17990
--

COPY public."Comment" (id, content, "createdAt", "userId", "requestId") FROM stdin;
\.


--
-- Data for Name: Equipment; Type: TABLE DATA; Schema: public; Owner: maks17990
--

COPY public."Equipment" (id, "inventoryNumber", name, type, "macAddress", "ipAddress", login, password, location, floor, cabinet, "createdAt", "updatedAt", "fileUrls", "assignedToUserId") FROM stdin;
1	╨╣23	╨╣23	╨╣23					╨╣23			2025-05-18 11:44:25.564	2025-05-18 11:44:25.564	{}	2
\.


--
-- Data for Name: News; Type: TABLE DATA; Schema: public; Owner: maks17990
--

COPY public."News" (id, title, content, "createdAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: maks17990
--

COPY public."Notification" (id, "userId", role, department, title, message, type, url, "isRead", "createdAt") FROM stdin;
59df9b97-533e-47c2-88e1-ae361d478e8e	\N	superuser	\N	ЁЯЦе ╨Ф╨╛╨▒╨░╨▓╨╗╨╡╨╜╨╛ ╨╜╨╛╨▓╨╛╨╡ ╨╛╨▒╨╛╤А╤Г╨┤╨╛╨▓╨░╨╜╨╕╨╡	╨Ю╨▒╨╛╤А╤Г╨┤╨╛╨▓╨░╨╜╨╕╨╡ "╨╣23" ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜╨╛ ╨▓ ╤Б╨╕╤Б╤В╨╡╨╝╤Г.	equipment	/admin/equipment	f	2025-05-18 11:44:25.585
f578e66b-3e22-474b-b949-a7b8fdd0c4ba	\N	admin	\N	ЁЯЦе ╨Ф╨╛╨▒╨░╨▓╨╗╨╡╨╜╨╛ ╨╜╨╛╨▓╨╛╨╡ ╨╛╨▒╨╛╤А╤Г╨┤╨╛╨▓╨░╨╜╨╕╨╡	╨Ф╨╛╨▒╨░╨▓╨╗╨╡╨╜╨╛ ╨╜╨╛╨▓╨╛╨╡ ╨╛╨▒╨╛╤А╤Г╨┤╨╛╨▓╨░╨╜╨╕╨╡: "╨╣23".	equipment	/admin/equipment	f	2025-05-18 11:44:25.592
ffbb9309-06e4-4db6-bf52-3fd29afd1b92	2	\N	\N	ЁЯУж ╨Т╨░╨╝ ╨╜╨░╨╖╨╜╨░╤З╨╡╨╜╨╛ ╨╛╨▒╨╛╤А╤Г╨┤╨╛╨▓╨░╨╜╨╕╨╡	╨Т╨░╨╝ ╨╜╨░╨╖╨╜╨░╤З╨╡╨╜╨╛ ╨╛╨▒╨╛╤А╤Г╨┤╨╛╨▓╨░╨╜╨╕╨╡ "╨╣23".	equipment	/dashboard/profile	f	2025-05-18 11:44:25.618
\.


--
-- Data for Name: Request; Type: TABLE DATA; Schema: public; Owner: maks17990
--

COPY public."Request" (id, title, content, status, priority, category, "createdAt", "updatedAt", "expectedResolutionDate", "resolvedAt", "assignedAt", "workDuration", source, "userId", "executorId", rating, feedback, "fileUrls") FROM stdin;
\.


--
-- Data for Name: Software; Type: TABLE DATA; Schema: public; Owner: maks17990
--

COPY public."Software" (id, name, version, "licenseKey", "licensedTo", "adminLogin", "adminPassword", "networkAddress", floor, cabinet, "purchaseDate", "supportStart", "supportEnd", "expiryDate", "fileUrls", "installDate", "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: maks17990
--

COPY public."User" (id, "lastName", "firstName", "middleName", "passwordHash", role, "birthDate", snils, "mobilePhone", "internalPhone", "position", department, floor, cabinet, "telegramChatId") FROM stdin;
2	╨Я╨╛╨╗╤М╨╖╨╛╨▓╨░╤В╨╡╨╗╤М	╨б╤Г╨┐╨╡╤А	╨Ш╨в	$2b$10$K9iZ7LXOdN6lJxLJ6groMOOy3vuNerP0SnMjPq/x.ySjDggvEUhrO	admin	1990-01-01	123-456-789 00	9000000000	100	╨У╨╗╨░╨▓╨╜╤Л╨╣ ╨░╨┤╨╝╨╕╨╜	ADMIN	\N	\N	\N
\.


--
-- Data for Name: _EquipmentToSoftware; Type: TABLE DATA; Schema: public; Owner: maks17990
--

COPY public."_EquipmentToSoftware" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _UserToSoftware; Type: TABLE DATA; Schema: public; Owner: maks17990
--

COPY public."_UserToSoftware" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: maks17990
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
b26e999f-06cc-45eb-8c7b-11cf58fc9c94	5825aaba1c69b9af14e094f7d6776cb4385e310287f0034f16ec798cc2b96ee7	2025-05-18 11:20:01.099104+00	20250518112000_init	\N	\N	2025-05-18 11:20:01.078126+00	1
\.


--
-- Name: Comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: maks17990
--

SELECT pg_catalog.setval('public."Comment_id_seq"', 1, false);


--
-- Name: Equipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: maks17990
--

SELECT pg_catalog.setval('public."Equipment_id_seq"', 1, true);


--
-- Name: News_id_seq; Type: SEQUENCE SET; Schema: public; Owner: maks17990
--

SELECT pg_catalog.setval('public."News_id_seq"', 1, false);


--
-- Name: Request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: maks17990
--

SELECT pg_catalog.setval('public."Request_id_seq"', 1, false);


--
-- Name: Software_id_seq; Type: SEQUENCE SET; Schema: public; Owner: maks17990
--

SELECT pg_catalog.setval('public."Software_id_seq"', 1, false);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: maks17990
--

SELECT pg_catalog.setval('public."User_id_seq"', 2, true);


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: Equipment Equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."Equipment"
    ADD CONSTRAINT "Equipment_pkey" PRIMARY KEY (id);


--
-- Name: News News_pkey; Type: CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."News"
    ADD CONSTRAINT "News_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Request Request_pkey; Type: CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."Request"
    ADD CONSTRAINT "Request_pkey" PRIMARY KEY (id);


--
-- Name: Software Software_pkey; Type: CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."Software"
    ADD CONSTRAINT "Software_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _EquipmentToSoftware _EquipmentToSoftware_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."_EquipmentToSoftware"
    ADD CONSTRAINT "_EquipmentToSoftware_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _UserToSoftware _UserToSoftware_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."_UserToSoftware"
    ADD CONSTRAINT "_UserToSoftware_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Comment_createdAt_idx; Type: INDEX; Schema: public; Owner: maks17990
--

CREATE INDEX "Comment_createdAt_idx" ON public."Comment" USING btree ("createdAt");


--
-- Name: Equipment_inventoryNumber_key; Type: INDEX; Schema: public; Owner: maks17990
--

CREATE UNIQUE INDEX "Equipment_inventoryNumber_key" ON public."Equipment" USING btree ("inventoryNumber");


--
-- Name: User_snils_key; Type: INDEX; Schema: public; Owner: maks17990
--

CREATE UNIQUE INDEX "User_snils_key" ON public."User" USING btree (snils);


--
-- Name: _EquipmentToSoftware_B_index; Type: INDEX; Schema: public; Owner: maks17990
--

CREATE INDEX "_EquipmentToSoftware_B_index" ON public."_EquipmentToSoftware" USING btree ("B");


--
-- Name: _UserToSoftware_B_index; Type: INDEX; Schema: public; Owner: maks17990
--

CREATE INDEX "_UserToSoftware_B_index" ON public."_UserToSoftware" USING btree ("B");


--
-- Name: Comment Comment_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Comment Comment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Equipment Equipment_assignedToUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."Equipment"
    ADD CONSTRAINT "Equipment_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Request Request_executorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."Request"
    ADD CONSTRAINT "Request_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Request Request_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."Request"
    ADD CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _EquipmentToSoftware _EquipmentToSoftware_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."_EquipmentToSoftware"
    ADD CONSTRAINT "_EquipmentToSoftware_A_fkey" FOREIGN KEY ("A") REFERENCES public."Equipment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _EquipmentToSoftware _EquipmentToSoftware_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."_EquipmentToSoftware"
    ADD CONSTRAINT "_EquipmentToSoftware_B_fkey" FOREIGN KEY ("B") REFERENCES public."Software"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _UserToSoftware _UserToSoftware_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."_UserToSoftware"
    ADD CONSTRAINT "_UserToSoftware_A_fkey" FOREIGN KEY ("A") REFERENCES public."Software"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _UserToSoftware _UserToSoftware_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: maks17990
--

ALTER TABLE ONLY public."_UserToSoftware"
    ADD CONSTRAINT "_UserToSoftware_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: maks17990
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

