--
-- PostgreSQL database dump
--

\restrict Nh6TiAH5wTb8qwd74F4BXFkeGbybzmg0ZjbE8fSEFwRHHBQmfZLg2e9dEy81ZVb

-- Dumped from database version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: location_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.location_type AS ENUM (
    'office',
    'site'
);


ALTER TYPE public.location_type OWNER TO postgres;

--
-- Name: shift_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.shift_type AS ENUM (
    'morning',
    'afternoon',
    'overtime'
);


ALTER TYPE public.shift_type OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer (
    id character varying(50) NOT NULL,
    user_id character varying(50) NOT NULL,
    "taxCode" character varying(50),
    "workInfo" character varying(255),
    "workStart" timestamp without time zone,
    "workEnd" timestamp without time zone,
    "workAddress" character varying(255),
    "workPrice" integer,
    "deletedAt" timestamp without time zone,
    version integer
);


ALTER TABLE public.customer OWNER TO postgres;

--
-- Name: group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."group" (
    id integer NOT NULL,
    name character varying(120),
    description character varying(255),
    documents json,
    images json,
    chats json,
    rating_sum integer,
    status character varying(10),
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    "deletedAt" timestamp without time zone,
    version integer,
    address character varying(255),
    rating_count integer,
    owner_id character varying(50)
);


ALTER TABLE public."group" OWNER TO postgres;

--
-- Name: group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_id_seq OWNER TO postgres;

--
-- Name: group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.group_id_seq OWNED BY public."group".id;


--
-- Name: lead; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead (
    id integer NOT NULL,
    name character varying(120) NOT NULL,
    company character varying(120) NOT NULL,
    email character varying(120) NOT NULL,
    phone character varying(50) NOT NULL,
    description text,
    industry character varying(100) NOT NULL,
    "companySize" character varying(50) NOT NULL,
    balance_amount double precision,
    "createdAt" timestamp without time zone,
    "deletedAt" timestamp without time zone,
    "updatedAt" timestamp without time zone,
    version integer,
    "expiredAt" timestamp without time zone
);


ALTER TABLE public.lead OWNER TO postgres;

--
-- Name: lead_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lead_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lead_id_seq OWNER TO postgres;

--
-- Name: lead_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lead_id_seq OWNED BY public.lead.id;


--
-- Name: leave; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave (
    id integer NOT NULL,
    reason character varying(255) NOT NULL,
    end_time date,
    start_time date,
    morning boolean,
    noon boolean,
    user_id character varying(50),
    "deletedAt" timestamp without time zone,
    "createdAt" timestamp without time zone,
    "updatedAt" timestamp without time zone,
    version integer
);


ALTER TABLE public.leave OWNER TO postgres;

--
-- Name: leave_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_id_seq OWNER TO postgres;

--
-- Name: leave_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_id_seq OWNED BY public.leave.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    gps_lat double precision NOT NULL,
    gps_lng double precision NOT NULL,
    type public.location_type NOT NULL
);


ALTER TABLE public.locations OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.locations_id_seq OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: material; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material (
    id character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    quantity integer NOT NULL,
    unit character varying(50),
    price double precision,
    image character varying(255),
    description text,
    supplier character varying(255),
    "deletedAt" timestamp without time zone,
    "createdAt" timestamp without time zone,
    "updatedAt" timestamp without time zone,
    version integer
);


ALTER TABLE public.material OWNER TO postgres;

--
-- Name: material_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.material_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.material_id_seq OWNER TO postgres;

--
-- Name: material_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.material_id_seq OWNED BY public.material.id;


--
-- Name: message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message (
    user_id character varying(80),
    text character varying(500),
    file_url character varying(255),
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    role integer,
    is_link boolean,
    is_doc boolean,
    is_reply boolean,
    is_img boolean,
    is_favourite boolean,
    incoming boolean,
    react json,
    type character varying(80),
    message_id character varying(80) NOT NULL,
    "deletedAt" timestamp without time zone,
    version integer,
    username character varying(255),
    workspace_id integer
);


ALTER TABLE public.message OWNER TO postgres;

--
-- Name: role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role (
    id integer NOT NULL,
    permissions json,
    name character varying(255),
    "deletedAt" timestamp without time zone,
    "createdAt" timestamp without time zone,
    "updatedAt" timestamp without time zone,
    version integer
);


ALTER TABLE public.role OWNER TO postgres;

--
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_id_seq OWNER TO postgres;

--
-- Name: role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_id_seq OWNED BY public.role.id;


--
-- Name: task; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task (
    id character varying(50) NOT NULL,
    title character varying(255),
    description text,
    status character varying(50),
    type character varying(50),
    reward integer,
    assign_ids json,
    workspace_id character varying(50),
    customer_id character varying(50),
    assets json,
    create_by_id character varying(50),
    end_time date,
    start_time date,
    "deletedAt" timestamp without time zone,
    "createdAt" timestamp without time zone,
    "updatedAt" timestamp without time zone,
    version integer,
    salary_type character varying(10),
    amount integer,
    check_reward boolean
);


ALTER TABLE public.task OWNER TO postgres;

--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    is_authenticated boolean,
    is_active boolean,
    is_anonymous boolean,
    id character varying(50) NOT NULL,
    "balanceAmount" character varying(80),
    username character varying(80),
    password character varying(80),
    "firstName" character varying(80),
    "lastName" character varying(80),
    "companyName" character varying(80),
    "localeCode" character varying(80),
    "languageCode" character varying(80),
    "socialInfor" json,
    "orderWebhook" character varying(255),
    "cryptoAddressList" json,
    "selectedProvider" json,
    "selectedServices" json,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    role character varying(20),
    icon character varying(255),
    status character varying(50),
    role_id integer,
    type character varying(50),
    phone character varying(50),
    "hashKey" character varying(255),
    "fullName" character varying(255),
    avatar character varying(255),
    salary integer,
    version integer,
    "deletedAt" timestamp without time zone,
    "citizenId" character varying(80),
    email character varying(80),
    "facebookAccount" character varying(80),
    "zaloAccount" character varying(80),
    referrer character varying(80),
    address character varying(255),
    gender integer,
    "taxCode" character varying(50)
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_id_seq OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: using; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."using" (
    id integer NOT NULL,
    lead_id integer NOT NULL,
    start_time date,
    end_time date,
    balance_amount double precision
);


ALTER TABLE public."using" OWNER TO postgres;

--
-- Name: using_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.using_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.using_id_seq OWNER TO postgres;

--
-- Name: using_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.using_id_seq OWNED BY public."using".id;


--
-- Name: workpoint; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workpoint (
    id character varying(80) NOT NULL,
    note character varying(255),
    checklist json,
    "createdAt" timestamp without time zone,
    "updatedAt" timestamp without time zone,
    "deletedAt" timestamp without time zone,
    version integer,
    user_id character varying(80)
);


ALTER TABLE public.workpoint OWNER TO postgres;

--
-- Name: workspace; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workspace (
    id character varying(50) NOT NULL,
    name character varying(255),
    owner_id character varying(50),
    description character varying(255),
    documents json,
    images json,
    chats json,
    rating_sum integer,
    rating_count integer,
    status character varying(50),
    "deletedAt" timestamp without time zone,
    "createdAt" timestamp without time zone,
    "updatedAt" timestamp without time zone,
    version integer,
    address character varying(255)
);


ALTER TABLE public.workspace OWNER TO postgres;

--
-- Name: workspace_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workspace_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workspace_id_seq OWNER TO postgres;

--
-- Name: workspace_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workspace_id_seq OWNED BY public.workspace.id;


--
-- Name: group id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."group" ALTER COLUMN id SET DEFAULT nextval('public.group_id_seq'::regclass);


--
-- Name: lead id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead ALTER COLUMN id SET DEFAULT nextval('public.lead_id_seq'::regclass);


--
-- Name: leave id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave ALTER COLUMN id SET DEFAULT nextval('public.leave_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: material id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material ALTER COLUMN id SET DEFAULT nextval('public.material_id_seq'::regclass);


--
-- Name: role id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role ALTER COLUMN id SET DEFAULT nextval('public.role_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Name: using id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."using" ALTER COLUMN id SET DEFAULT nextval('public.using_id_seq'::regclass);


--
-- Name: workspace id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace ALTER COLUMN id SET DEFAULT nextval('public.workspace_id_seq'::regclass);


--
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (id);


--
-- Name: customer customer_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_user_id_key UNIQUE (user_id);


--
-- Name: group group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."group"
    ADD CONSTRAINT group_pkey PRIMARY KEY (id);


--
-- Name: lead lead_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead
    ADD CONSTRAINT lead_pkey PRIMARY KEY (id);


--
-- Name: leave leave_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave
    ADD CONSTRAINT leave_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: material material_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material
    ADD CONSTRAINT material_pkey PRIMARY KEY (id);


--
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (message_id);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: task task_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: using using_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."using"
    ADD CONSTRAINT using_pkey PRIMARY KEY (id);


--
-- Name: workpoint workpoint_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workpoint
    ADD CONSTRAINT workpoint_pkey PRIMARY KEY (id);


--
-- Name: workspace workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace
    ADD CONSTRAINT workspace_pkey PRIMARY KEY (id);


--
-- Name: customer customer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: customer fk_customer_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT fk_customer_user FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: message fk_message_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT fk_message_user_id FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: using using_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."using"
    ADD CONSTRAINT using_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.lead(id);


--
-- Name: workpoint workpoint_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workpoint
    ADD CONSTRAINT workpoint_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- PostgreSQL database dump complete
--

\unrestrict Nh6TiAH5wTb8qwd74F4BXFkeGbybzmg0ZjbE8fSEFwRHHBQmfZLg2e9dEy81ZVb

