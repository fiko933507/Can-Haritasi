BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version varchar(32);

CREATE TABLE IF NOT EXISTS public.blocked_users (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id text,
  email text NOT NULL,
  reason text,
  requested_via varchar(16) NOT NULL CHECK (requested_via IN ('app','web')),
  status varchar(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processor_note text
);
CREATE INDEX IF NOT EXISTS account_deletion_requests_status_idx
  ON public.account_deletion_requests(status, requested_at);
CREATE UNIQUE INDEX IF NOT EXISTS account_deletion_requests_pending_email_uidx
  ON public.account_deletion_requests(lower(email)) WHERE status IN ('pending','processing');
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.accept_terms(p_version text)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_profile public.profiles;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id = '' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  IF p_version IS NULL OR length(trim(p_version)) < 4 OR length(trim(p_version)) > 32 THEN
    RAISE EXCEPTION 'invalid terms version' USING ERRCODE='22023';
  END IF;

  INSERT INTO public.profiles(auth_user_id, terms_accepted_at, terms_version)
  VALUES (v_auth_user_id, now(), left(trim(p_version),32))
  ON CONFLICT (auth_user_id) DO UPDATE
    SET terms_accepted_at = now(),
        terms_version = left(trim(EXCLUDED.terms_version),32),
        updated_at = now()
  RETURNING * INTO v_profile;

  RETURN v_profile;
END
$function$;

CREATE OR REPLACE FUNCTION public.report_content(
  p_report_id uuid,
  p_reason text,
  p_details text DEFAULT NULL
)
RETURNS public.abuse_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
  v_abuse public.abuse_reports;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id = '' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'reason required' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.animal_reports WHERE id=p_report_id AND is_public=true) THEN
    RAISE EXCEPTION 'report not found' USING ERRCODE='P0002';
  END IF;

  SELECT id INTO v_profile_id FROM public.profiles WHERE auth_user_id=v_auth_user_id;
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles(auth_user_id) VALUES(v_auth_user_id) RETURNING id INTO v_profile_id;
  END IF;

  INSERT INTO public.abuse_reports(reporter_id,target_type,target_id,reason,details,status)
  VALUES(v_profile_id,'animal_report',p_report_id,left(trim(p_reason),80),NULLIF(left(trim(p_details),1000),''),'pending')
  RETURNING * INTO v_abuse;

  RETURN v_abuse;
END
$function$;

CREATE OR REPLACE FUNCTION public.block_report_author(p_report_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_blocker uuid;
  v_blocked uuid;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id = '' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;

  SELECT id INTO v_blocker FROM public.profiles WHERE auth_user_id=v_auth_user_id;
  IF v_blocker IS NULL THEN
    INSERT INTO public.profiles(auth_user_id) VALUES(v_auth_user_id) RETURNING id INTO v_blocker;
  END IF;

  SELECT reporter_id INTO v_blocked FROM public.animal_reports WHERE id=p_report_id AND is_public=true;
  IF v_blocked IS NULL THEN
    RAISE EXCEPTION 'report not found' USING ERRCODE='P0002';
  END IF;
  IF v_blocker = v_blocked THEN
    RAISE EXCEPTION 'cannot block yourself' USING ERRCODE='22023';
  END IF;

  INSERT INTO public.blocked_users(blocker_id,blocked_id)
  VALUES(v_blocker,v_blocked)
  ON CONFLICT DO NOTHING;

  RETURN true;
END
$function$;

CREATE OR REPLACE FUNCTION public.request_my_account_deletion(p_reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_email text;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id = '' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;

  SELECT email INTO v_email FROM neon_auth."user" WHERE id::text=v_auth_user_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'account not found' USING ERRCODE='P0002';
  END IF;

  UPDATE public.account_deletion_requests
    SET reason = COALESCE(NULLIF(left(trim(p_reason),1000),''), reason),
        requested_at = now(),
        auth_user_id = v_auth_user_id,
        requested_via = 'app'
  WHERE lower(email)=lower(v_email) AND status IN ('pending','processing');

  IF NOT FOUND THEN
    INSERT INTO public.account_deletion_requests(auth_user_id,email,reason,requested_via)
    VALUES(v_auth_user_id,lower(v_email),NULLIF(left(trim(p_reason),1000),''),'app');
  END IF;

  RETURN true;
END
$function$;

CREATE OR REPLACE FUNCTION public.request_account_deletion_by_email(
  p_email text,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_email text := lower(trim(p_email));
  v_auth_user_id text;
BEGIN
  IF v_email IS NULL OR length(v_email) < 5 OR length(v_email) > 254 OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+ THEN
    RAISE EXCEPTION 'invalid email' USING ERRCODE='22023';
  END IF;

  SELECT id::text INTO v_auth_user_id FROM neon_auth."user" WHERE lower(email)=v_email LIMIT 1;

  -- Return success without creating a row when no account exists, preventing account enumeration and request-table spam.
  IF v_auth_user_id IS NULL THEN
    RETURN true;
  END IF;

  UPDATE public.account_deletion_requests
    SET reason = COALESCE(NULLIF(left(trim(p_reason),1000),''), reason),
        requested_at = now(),
        auth_user_id = COALESCE(v_auth_user_id, auth_user_id),
        requested_via = 'web'
  WHERE lower(email)=v_email AND status IN ('pending','processing');

  IF NOT FOUND THEN
    INSERT INTO public.account_deletion_requests(auth_user_id,email,reason,requested_via)
    VALUES(v_auth_user_id,v_email,NULLIF(left(trim(p_reason),1000),''),'web');
  END IF;

  -- Deliberately do not reveal whether the email maps to an account.
  RETURN true;
END
$function$;

CREATE OR REPLACE FUNCTION public.create_animal_report(
  p_animal_type text,
  p_category text,
  p_condition text,
  p_urgency smallint,
  p_title text,
  p_description text,
  p_lat double precision,
  p_lon double precision,
  p_accuracy_m integer DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_district text DEFAULT NULL
)
RETURNS public.animal_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
  v_terms_version text;
  v_terms_accepted_at timestamptz;
  v_report public.animal_reports;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id = '' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  IF p_lat NOT BETWEEN -90 AND 90 OR p_lon NOT BETWEEN -180 AND 180 THEN
    RAISE EXCEPTION 'invalid coordinates' USING ERRCODE='22023';
  END IF;
  IF p_urgency NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'urgency must be between 1 and 5' USING ERRCODE='22023';
  END IF;

  SELECT id, terms_version, terms_accepted_at
  INTO v_profile_id, v_terms_version, v_terms_accepted_at
  FROM public.profiles WHERE auth_user_id=v_auth_user_id;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'profile required' USING ERRCODE='42501';
  END IF;
  IF v_terms_accepted_at IS NULL OR v_terms_version IS DISTINCT FROM '2026-09-13' THEN
    RAISE EXCEPTION 'current terms must be accepted before publishing' USING ERRCODE='42501';
  END IF;

  INSERT INTO public.animal_reports(
    reporter_id, animal_type, category, condition, urgency, title, description,
    location, location_accuracy_m, city, district
  ) VALUES (
    v_profile_id,
    left(trim(p_animal_type),40),
    NULLIF(left(trim(p_category),80),''),
    left(trim(p_condition),80),
    p_urgency,
    NULLIF(left(trim(p_title),140),''),
    NULLIF(left(trim(p_description),2000),''),
    ST_SetSRID(ST_MakePoint(p_lon,p_lat),4326)::geography,
    CASE WHEN p_accuracy_m IS NULL THEN NULL ELSE greatest(0,least(p_accuracy_m,10000)) END,
    NULLIF(left(trim(p_city),80),''),
    NULLIF(left(trim(p_district),80),'')
  ) RETURNING * INTO v_report;

  RETURN v_report;
END
$function$;

CREATE OR REPLACE FUNCTION public.nearby_reports_v3(
  p_lat double precision,
  p_lon double precision,
  p_radius_m integer DEFAULT 5000,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  animal_type character varying,
  category character varying,
  condition character varying,
  urgency smallint,
  title character varying,
  description text,
  latitude double precision,
  longitude double precision,
  distance_m double precision,
  city character varying,
  district character varying,
  status character varying,
  created_at timestamptz,
  image_key text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id='' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  IF p_lat NOT BETWEEN -90 AND 90 OR p_lon NOT BETWEEN -180 AND 180 THEN
    RAISE EXCEPTION 'invalid coordinates' USING ERRCODE='22023';
  END IF;

  SELECT p.id INTO v_profile_id FROM public.profiles p WHERE p.auth_user_id=v_auth_user_id;

  RETURN QUERY
  SELECT r.id,r.animal_type,r.category,r.condition,r.urgency,r.title,r.description,
         ST_Y(r.location::geometry),ST_X(r.location::geometry),
         ST_Distance(r.location,ST_SetSRID(ST_MakePoint(p_lon,p_lat),4326)::geography),
         r.city,r.district,r.status,r.created_at,
         (SELECT ri.storage_key FROM public.report_images ri WHERE ri.report_id=r.id ORDER BY ri.created_at ASC LIMIT 1)
  FROM public.animal_reports r
  WHERE r.is_public=true
    AND r.status IN ('open','in_progress')
    AND ST_DWithin(r.location,ST_SetSRID(ST_MakePoint(p_lon,p_lat),4326)::geography,greatest(100,least(p_radius_m,50000)))
    AND (v_profile_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.blocked_users bu
      WHERE (bu.blocker_id=v_profile_id AND bu.blocked_id=r.reporter_id)
         OR (bu.blocker_id=r.reporter_id AND bu.blocked_id=v_profile_id)
    ))
  ORDER BY r.urgency DESC,
           r.location <-> ST_SetSRID(ST_MakePoint(p_lon,p_lat),4326)::geography,
           r.created_at DESC
  LIMIT greatest(1,least(p_limit,100));
END
$function$;

REVOKE ALL ON TABLE public.blocked_users FROM anonymous, authenticated;
REVOKE ALL ON TABLE public.account_deletion_requests FROM anonymous, authenticated;

REVOKE ALL ON FUNCTION public.accept_terms(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_content(uuid,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.block_report_author(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_my_account_deletion(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_account_deletion_by_email(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nearby_reports_v3(double precision,double precision,integer,integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.accept_terms(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_content(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_report_author(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_my_account_deletion(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_reports_v3(double precision,double precision,integer,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_deletion_by_email(text,text) TO anonymous, authenticated;

COMMIT;
 THEN
    RAISE EXCEPTION 'invalid email' USING ERRCODE='22023';
  END IF;

  SELECT id::text INTO v_auth_user_id FROM neon_auth."user" WHERE lower(email)=v_email LIMIT 1;

  -- Return success without creating a row when no account exists, preventing account enumeration and request-table spam.
  IF v_auth_user_id IS NULL THEN
    RETURN true;
  END IF;

  UPDATE public.account_deletion_requests
    SET reason = COALESCE(NULLIF(left(trim(p_reason),1000),''), reason),
        requested_at = now(),
        auth_user_id = COALESCE(v_auth_user_id, auth_user_id),
        requested_via = 'web'
  WHERE lower(email)=v_email AND status IN ('pending','processing');

  IF NOT FOUND THEN
    INSERT INTO public.account_deletion_requests(auth_user_id,email,reason,requested_via)
    VALUES(v_auth_user_id,v_email,NULLIF(left(trim(p_reason),1000),''),'web');
  END IF;

  -- Deliberately do not reveal whether the email maps to an account.
  RETURN true;
END
$function$;

CREATE OR REPLACE FUNCTION public.create_animal_report(
  p_animal_type text,
  p_category text,
  p_condition text,
  p_urgency smallint,
  p_title text,
  p_description text,
  p_lat double precision,
  p_lon double precision,
  p_accuracy_m integer DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_district text DEFAULT NULL
)
RETURNS public.animal_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
  v_terms_version text;
  v_terms_accepted_at timestamptz;
  v_report public.animal_reports;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id = '' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  IF p_lat NOT BETWEEN -90 AND 90 OR p_lon NOT BETWEEN -180 AND 180 THEN
    RAISE EXCEPTION 'invalid coordinates' USING ERRCODE='22023';
  END IF;
  IF p_urgency NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'urgency must be between 1 and 5' USING ERRCODE='22023';
  END IF;

  SELECT id, terms_version, terms_accepted_at
  INTO v_profile_id, v_terms_version, v_terms_accepted_at
  FROM public.profiles WHERE auth_user_id=v_auth_user_id;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'profile required' USING ERRCODE='42501';
  END IF;
  IF v_terms_accepted_at IS NULL OR v_terms_version IS DISTINCT FROM '2026-09-13' THEN
    RAISE EXCEPTION 'current terms must be accepted before publishing' USING ERRCODE='42501';
  END IF;

  INSERT INTO public.animal_reports(
    reporter_id, animal_type, category, condition, urgency, title, description,
    location, location_accuracy_m, city, district
  ) VALUES (
    v_profile_id,
    left(trim(p_animal_type),40),
    NULLIF(left(trim(p_category),80),''),
    left(trim(p_condition),80),
    p_urgency,
    NULLIF(left(trim(p_title),140),''),
    NULLIF(left(trim(p_description),2000),''),
    ST_SetSRID(ST_MakePoint(p_lon,p_lat),4326)::geography,
    CASE WHEN p_accuracy_m IS NULL THEN NULL ELSE greatest(0,least(p_accuracy_m,10000)) END,
    NULLIF(left(trim(p_city),80),''),
    NULLIF(left(trim(p_district),80),'')
  ) RETURNING * INTO v_report;

  RETURN v_report;
END
$function$;

CREATE OR REPLACE FUNCTION public.nearby_reports_v3(
  p_lat double precision,
  p_lon double precision,
  p_radius_m integer DEFAULT 5000,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  animal_type character varying,
  category character varying,
  condition character varying,
  urgency smallint,
  title character varying,
  description text,
  latitude double precision,
  longitude double precision,
  distance_m double precision,
  city character varying,
  district character varying,
  status character varying,
  created_at timestamptz,
  image_key text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id='' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  IF p_lat NOT BETWEEN -90 AND 90 OR p_lon NOT BETWEEN -180 AND 180 THEN
    RAISE EXCEPTION 'invalid coordinates' USING ERRCODE='22023';
  END IF;

  SELECT p.id INTO v_profile_id FROM public.profiles p WHERE p.auth_user_id=v_auth_user_id;

  RETURN QUERY
  SELECT r.id,r.animal_type,r.category,r.condition,r.urgency,r.title,r.description,
         ST_Y(r.location::geometry),ST_X(r.location::geometry),
         ST_Distance(r.location,ST_SetSRID(ST_MakePoint(p_lon,p_lat),4326)::geography),
         r.city,r.district,r.status,r.created_at,
         (SELECT ri.storage_key FROM public.report_images ri WHERE ri.report_id=r.id ORDER BY ri.created_at ASC LIMIT 1)
  FROM public.animal_reports r
  WHERE r.is_public=true
    AND r.status IN ('open','in_progress')
    AND ST_DWithin(r.location,ST_SetSRID(ST_MakePoint(p_lon,p_lat),4326)::geography,greatest(100,least(p_radius_m,50000)))
    AND (v_profile_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.blocked_users bu
      WHERE (bu.blocker_id=v_profile_id AND bu.blocked_id=r.reporter_id)
         OR (bu.blocker_id=r.reporter_id AND bu.blocked_id=v_profile_id)
    ))
  ORDER BY r.urgency DESC,
           r.location <-> ST_SetSRID(ST_MakePoint(p_lon,p_lat),4326)::geography,
           r.created_at DESC
  LIMIT greatest(1,least(p_limit,100));
END
$function$;

REVOKE ALL ON TABLE public.blocked_users FROM anonymous, authenticated;
REVOKE ALL ON TABLE public.account_deletion_requests FROM anonymous, authenticated;

REVOKE ALL ON FUNCTION public.accept_terms(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_content(uuid,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.block_report_author(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_my_account_deletion(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_account_deletion_by_email(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nearby_reports_v3(double precision,double precision,integer,integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.accept_terms(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_content(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_report_author(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_my_account_deletion(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_reports_v3(double precision,double precision,integer,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_deletion_by_email(text,text) TO anonymous, authenticated;

COMMIT;
