-- Can Haritası v1.3 community features
-- Additive migration. Apply to a preview branch first.

ALTER TABLE public.animal_reports
  ADD COLUMN IF NOT EXISTS location_visibility varchar(16) NOT NULL DEFAULT 'approximate';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'animal_reports_location_visibility_check'
  ) THEN
    ALTER TABLE public.animal_reports
      ADD CONSTRAINT animal_reports_location_visibility_check
      CHECK (location_visibility IN ('approximate','exact'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.volunteer_preferences (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  can_transport boolean NOT NULL DEFAULT false,
  has_carrier boolean NOT NULL DEFAULT false,
  can_foster boolean NOT NULL DEFAULT false,
  can_vet_run boolean NOT NULL DEFAULT false,
  can_feed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  radius_m integer NOT NULL DEFAULT 3000 CHECK (radius_m BETWEEN 500 AND 50000),
  urgent_only boolean NOT NULL DEFAULT true,
  cats boolean NOT NULL DEFAULT true,
  dogs boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  point_type varchar(20) NOT NULL CHECK (point_type IN ('food','water','food_water')),
  note varchar(160),
  location geography(Point,4326) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  last_refreshed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_points_location_gix
  ON public.community_points USING gist(location);
CREATE INDEX IF NOT EXISTS community_points_active_refreshed_idx
  ON public.community_points(active, last_refreshed_at DESC);

CREATE TABLE IF NOT EXISTS public.report_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.animal_reports(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type varchar(40) NOT NULL,
  note varchar(500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_events_report_created_idx
  ON public.report_events(report_id, created_at ASC);

ALTER TABLE public.volunteer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.volunteer_preferences FROM anonymous, authenticated;
REVOKE ALL ON public.notification_preferences FROM anonymous, authenticated;
REVOKE ALL ON public.community_points FROM anonymous, authenticated;
REVOKE ALL ON public.report_events FROM anonymous, authenticated;

CREATE OR REPLACE FUNCTION public.my_volunteer_preferences()
RETURNS public.volunteer_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
  v_result public.volunteer_preferences;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id='' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  SELECT id INTO v_profile_id FROM public.profiles WHERE auth_user_id=v_auth_user_id;
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles(auth_user_id) VALUES (v_auth_user_id) RETURNING id INTO v_profile_id;
  END IF;
  INSERT INTO public.volunteer_preferences(profile_id)
  VALUES (v_profile_id)
  ON CONFLICT (profile_id) DO NOTHING;
  SELECT * INTO v_result FROM public.volunteer_preferences WHERE profile_id=v_profile_id;
  RETURN v_result;
END
$$;

CREATE OR REPLACE FUNCTION public.update_volunteer_preferences(
  p_can_transport boolean,
  p_has_carrier boolean,
  p_can_foster boolean,
  p_can_vet_run boolean,
  p_can_feed boolean
)
RETURNS public.volunteer_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
  v_result public.volunteer_preferences;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id='' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  SELECT id INTO v_profile_id FROM public.profiles WHERE auth_user_id=v_auth_user_id;
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles(auth_user_id) VALUES (v_auth_user_id) RETURNING id INTO v_profile_id;
  END IF;
  INSERT INTO public.volunteer_preferences(profile_id,can_transport,has_carrier,can_foster,can_vet_run,can_feed,updated_at)
  VALUES(v_profile_id,p_can_transport,p_has_carrier,p_can_foster,p_can_vet_run,p_can_feed,now())
  ON CONFLICT (profile_id) DO UPDATE SET
    can_transport=EXCLUDED.can_transport,
    has_carrier=EXCLUDED.has_carrier,
    can_foster=EXCLUDED.can_foster,
    can_vet_run=EXCLUDED.can_vet_run,
    can_feed=EXCLUDED.can_feed,
    updated_at=now()
  RETURNING * INTO v_result;
  RETURN v_result;
END
$$;

CREATE OR REPLACE FUNCTION public.my_notification_preferences()
RETURNS public.notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
  v_result public.notification_preferences;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id='' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  SELECT id INTO v_profile_id FROM public.profiles WHERE auth_user_id=v_auth_user_id;
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles(auth_user_id) VALUES (v_auth_user_id) RETURNING id INTO v_profile_id;
  END IF;
  INSERT INTO public.notification_preferences(profile_id)
  VALUES (v_profile_id)
  ON CONFLICT (profile_id) DO NOTHING;
  SELECT * INTO v_result FROM public.notification_preferences WHERE profile_id=v_profile_id;
  RETURN v_result;
END
$$;

CREATE OR REPLACE FUNCTION public.update_notification_preferences(
  p_radius_m integer,
  p_urgent_only boolean,
  p_cats boolean,
  p_dogs boolean
)
RETURNS public.notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
  v_result public.notification_preferences;
  v_radius integer := greatest(500, least(coalesce(p_radius_m,3000),50000));
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id='' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  SELECT id INTO v_profile_id FROM public.profiles WHERE auth_user_id=v_auth_user_id;
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles(auth_user_id) VALUES (v_auth_user_id) RETURNING id INTO v_profile_id;
  END IF;
  INSERT INTO public.notification_preferences(profile_id,radius_m,urgent_only,cats,dogs,updated_at)
  VALUES(v_profile_id,v_radius,p_urgent_only,p_cats,p_dogs,now())
  ON CONFLICT (profile_id) DO UPDATE SET
    radius_m=EXCLUDED.radius_m,
    urgent_only=EXCLUDED.urgent_only,
    cats=EXCLUDED.cats,
    dogs=EXCLUDED.dogs,
    updated_at=now()
  RETURNING * INTO v_result;
  RETURN v_result;
END
$$;

CREATE OR REPLACE FUNCTION public.nearby_community_points(
  p_lat double precision,
  p_lon double precision,
  p_radius_m integer DEFAULT 5000,
  p_limit integer DEFAULT 30
)
RETURNS TABLE(
  id uuid,
  point_type varchar,
  note varchar,
  latitude double precision,
  longitude double precision,
  distance_m double precision,
  last_refreshed_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_origin geography := ST_SetSRID(ST_MakePoint(p_lon,p_lat),4326)::geography;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id='' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  IF p_lat NOT BETWEEN -90 AND 90 OR p_lon NOT BETWEEN -180 AND 180 THEN
    RAISE EXCEPTION 'invalid coordinates' USING ERRCODE='22023';
  END IF;
  RETURN QUERY
  SELECT cp.id,cp.point_type,cp.note,
         ST_Y(cp.location::geometry),ST_X(cp.location::geometry),
         ST_Distance(cp.location,v_origin),
         cp.last_refreshed_at,cp.created_at
  FROM public.community_points cp
  WHERE cp.active=true
    AND ST_DWithin(cp.location,v_origin,greatest(100,least(p_radius_m,50000)))
  ORDER BY cp.location <-> v_origin, cp.last_refreshed_at DESC
  LIMIT greatest(1,least(p_limit,100));
END
$$;

CREATE OR REPLACE FUNCTION public.add_community_point(
  p_point_type text,
  p_lat double precision,
  p_lon double precision,
  p_note text DEFAULT NULL
)
RETURNS public.community_points
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
  v_result public.community_points;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id='' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  IF p_point_type NOT IN ('food','water','food_water') THEN
    RAISE EXCEPTION 'invalid point type' USING ERRCODE='22023';
  END IF;
  IF p_lat NOT BETWEEN -90 AND 90 OR p_lon NOT BETWEEN -180 AND 180 THEN
    RAISE EXCEPTION 'invalid coordinates' USING ERRCODE='22023';
  END IF;
  SELECT id INTO v_profile_id FROM public.profiles WHERE auth_user_id=v_auth_user_id;
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles(auth_user_id) VALUES (v_auth_user_id) RETURNING id INTO v_profile_id;
  END IF;
  INSERT INTO public.community_points(creator_id,point_type,note,location)
  VALUES(v_profile_id,p_point_type,NULLIF(left(trim(p_note),160),''),ST_SetSRID(ST_MakePoint(p_lon,p_lat),4326)::geography)
  RETURNING * INTO v_result;
  RETURN v_result;
END
$$;

CREATE OR REPLACE FUNCTION public.refresh_community_point(p_point_id uuid)
RETURNS public.community_points
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_result public.community_points;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id='' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  UPDATE public.community_points
  SET last_refreshed_at=now(), updated_at=now()
  WHERE id=p_point_id AND active=true
  RETURNING * INTO v_result;
  IF v_result.id IS NULL THEN
    RAISE EXCEPTION 'point not found' USING ERRCODE='P0002';
  END IF;
  RETURN v_result;
END
$$;

CREATE OR REPLACE FUNCTION public.report_timeline(p_report_id uuid)
RETURNS TABLE(
  event_type varchar,
  note varchar,
  created_at timestamptz,
  actor_display_name varchar
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
DECLARE
  v_auth_user_id text := auth.user_id();
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id='' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.animal_reports WHERE id=p_report_id AND is_public=true) THEN
    RAISE EXCEPTION 'report not found' USING ERRCODE='P0002';
  END IF;
  RETURN QUERY
  SELECT e.event_type,e.note,e.created_at,p.display_name
  FROM public.report_events e
  LEFT JOIN public.profiles p ON p.id=e.actor_id
  WHERE e.report_id=p_report_id
  ORDER BY e.created_at ASC;
END
$$;

CREATE OR REPLACE FUNCTION public.create_animal_report_v2(
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
  p_district text DEFAULT NULL,
  p_location_visibility text DEFAULT 'approximate'
)
RETURNS public.animal_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
  v_terms_version text;
  v_terms_accepted_at timestamptz;
  v_report public.animal_reports;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id='' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  IF p_lat NOT BETWEEN -90 AND 90 OR p_lon NOT BETWEEN -180 AND 180 THEN
    RAISE EXCEPTION 'invalid coordinates' USING ERRCODE='22023';
  END IF;
  IF p_urgency NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'urgency must be between 1 and 5' USING ERRCODE='22023';
  END IF;
  IF p_location_visibility NOT IN ('approximate','exact') THEN
    RAISE EXCEPTION 'invalid location visibility' USING ERRCODE='22023';
  END IF;
  SELECT id,terms_version,terms_accepted_at
  INTO v_profile_id,v_terms_version,v_terms_accepted_at
  FROM public.profiles WHERE auth_user_id=v_auth_user_id;
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'profile required' USING ERRCODE='42501';
  END IF;
  IF v_terms_accepted_at IS NULL OR v_terms_version IS DISTINCT FROM '2026-09-13' THEN
    RAISE EXCEPTION 'current terms must be accepted before publishing' USING ERRCODE='42501';
  END IF;
  INSERT INTO public.animal_reports(
    reporter_id,animal_type,category,condition,urgency,title,description,
    location,location_accuracy_m,city,district,location_visibility
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
    NULLIF(left(trim(p_district),80),''),
    p_location_visibility
  ) RETURNING * INTO v_report;
  RETURN v_report;
END
$$;

CREATE OR REPLACE FUNCTION public.nearby_reports_v4(
  p_lat double precision,
  p_lon double precision,
  p_radius_m integer DEFAULT 5000,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  animal_type varchar,
  category varchar,
  condition varchar,
  urgency smallint,
  title varchar,
  description text,
  latitude double precision,
  longitude double precision,
  distance_m double precision,
  city varchar,
  district varchar,
  status varchar,
  created_at timestamptz,
  image_key text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
  v_origin geography := ST_SetSRID(ST_MakePoint(p_lon,p_lat),4326)::geography;
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
         CASE WHEN r.location_visibility='exact' OR r.reporter_id=v_profile_id
              THEN ST_Y(r.location::geometry)
              ELSE round(ST_Y(r.location::geometry)::numeric,3)::double precision END,
         CASE WHEN r.location_visibility='exact' OR r.reporter_id=v_profile_id
              THEN ST_X(r.location::geometry)
              ELSE round(ST_X(r.location::geometry)::numeric,3)::double precision END,
         CASE WHEN r.location_visibility='exact' OR r.reporter_id=v_profile_id
              THEN ST_Distance(r.location,v_origin)
              ELSE round((ST_Distance(r.location,v_origin)/50.0)::numeric)*50.0 END::double precision,
         r.city,r.district,r.status,r.created_at,
         (SELECT ri.storage_key FROM public.report_images ri WHERE ri.report_id=r.id ORDER BY ri.created_at ASC LIMIT 1)
  FROM public.animal_reports r
  WHERE r.is_public=true
    AND r.status IN ('open','in_progress')
    AND ST_DWithin(r.location,v_origin,greatest(100,least(p_radius_m,50000)))
    AND (v_profile_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.blocked_users bu
      WHERE (bu.blocker_id=v_profile_id AND bu.blocked_id=r.reporter_id)
         OR (bu.blocker_id=r.reporter_id AND bu.blocked_id=v_profile_id)
    ))
  ORDER BY r.urgency DESC, r.location <-> v_origin, r.created_at DESC
  LIMIT greatest(1,least(p_limit,100));
END
$$;

CREATE OR REPLACE FUNCTION public.find_potential_duplicates(
  p_animal_type text,
  p_lat double precision,
  p_lon double precision,
  p_minutes integer DEFAULT 120,
  p_distance_m integer DEFAULT 250
)
RETURNS TABLE(
  id uuid,
  title varchar,
  condition varchar,
  created_at timestamptz,
  distance_m double precision
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_origin geography := ST_SetSRID(ST_MakePoint(p_lon,p_lat),4326)::geography;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id='' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
  SELECT r.id,r.title,r.condition,r.created_at,ST_Distance(r.location,v_origin)
  FROM public.animal_reports r
  WHERE r.is_public=true
    AND r.status IN ('open','in_progress')
    AND lower(r.animal_type)=lower(left(trim(p_animal_type),40))
    AND r.created_at >= now() - make_interval(mins => greatest(15,least(p_minutes,1440)))
    AND ST_DWithin(r.location,v_origin,greatest(50,least(p_distance_m,2000)))
  ORDER BY r.location <-> v_origin, r.created_at DESC
  LIMIT 5;
END
$$;

CREATE OR REPLACE FUNCTION public.canharitasi_report_insert_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $$
BEGIN
  INSERT INTO public.report_events(report_id,actor_id,event_type,note,created_at)
  VALUES(NEW.id,NEW.reporter_id,'reported','Yardım çağrısı oluşturuldu.',NEW.created_at);
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_canharitasi_report_insert_event ON public.animal_reports;
CREATE TRIGGER trg_canharitasi_report_insert_event
AFTER INSERT ON public.animal_reports
FOR EACH ROW EXECUTE FUNCTION public.canharitasi_report_insert_event();

CREATE OR REPLACE FUNCTION public.canharitasi_help_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $$
BEGIN
  INSERT INTO public.report_events(report_id,actor_id,event_type,note,created_at)
  VALUES(
    NEW.report_id,
    NEW.user_id,
    CASE WHEN NEW.action='on_the_way' THEN 'help_on_the_way' ELSE left(NEW.action,40) END,
    COALESCE(NULLIF(NEW.note,''),'Bir gönüllü destek vermek için harekete geçti.'),
    NEW.created_at
  );
  IF NEW.action='on_the_way' THEN
    UPDATE public.animal_reports SET status='in_progress', updated_at=now()
    WHERE id=NEW.report_id AND status='open';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_canharitasi_help_event ON public.help_actions;
CREATE TRIGGER trg_canharitasi_help_event
AFTER INSERT ON public.help_actions
FOR EACH ROW EXECUTE FUNCTION public.canharitasi_help_event();

INSERT INTO public.report_events(report_id,actor_id,event_type,note,created_at)
SELECT r.id,r.reporter_id,'reported','Yardım çağrısı oluşturuldu.',r.created_at
FROM public.animal_reports r
WHERE NOT EXISTS (
  SELECT 1 FROM public.report_events e WHERE e.report_id=r.id AND e.event_type='reported'
);

GRANT EXECUTE ON FUNCTION public.my_volunteer_preferences() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_volunteer_preferences(boolean,boolean,boolean,boolean,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_notification_preferences() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_notification_preferences(integer,boolean,boolean,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_community_points(double precision,double precision,integer,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_community_point(text,double precision,double precision,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_community_point(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_timeline(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_animal_report_v2(text,text,text,smallint,text,text,double precision,double precision,integer,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_reports_v4(double precision,double precision,integer,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_potential_duplicates(text,double precision,double precision,integer,integer) TO authenticated;


-- Smart push notification delivery
CREATE TABLE IF NOT EXISTS public.push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL UNIQUE,
  platform varchar(12) NOT NULL CHECK (platform IN ('android','ios')),
  last_location geography(Point,4326),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_devices_profile_enabled_idx
  ON public.push_devices(profile_id, enabled);
CREATE INDEX IF NOT EXISTS push_devices_location_gix
  ON public.push_devices USING gist(last_location);

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_devices FROM anonymous, authenticated;

CREATE OR REPLACE FUNCTION public.register_push_device(
  p_token text,
  p_platform text,
  p_lat double precision DEFAULT NULL,
  p_lon double precision DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
  v_location geography;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id='' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  IF p_platform NOT IN ('android','ios') THEN
    RAISE EXCEPTION 'invalid platform' USING ERRCODE='22023';
  END IF;
  IF length(trim(p_token)) < 12 OR length(trim(p_token)) > 512 THEN
    RAISE EXCEPTION 'invalid push token' USING ERRCODE='22023';
  END IF;
  IF (p_lat IS NULL) <> (p_lon IS NULL) THEN
    RAISE EXCEPTION 'both coordinates are required together' USING ERRCODE='22023';
  END IF;
  IF p_lat IS NOT NULL THEN
    IF p_lat NOT BETWEEN -90 AND 90 OR p_lon NOT BETWEEN -180 AND 180 THEN
      RAISE EXCEPTION 'invalid coordinates' USING ERRCODE='22023';
    END IF;
    -- Store only approximate (~100m) position for notification matching.
    v_location := ST_SetSRID(
      ST_MakePoint(round(p_lon::numeric,3)::double precision, round(p_lat::numeric,3)::double precision),
      4326
    )::geography;
  END IF;
  SELECT id INTO v_profile_id FROM public.profiles WHERE auth_user_id=v_auth_user_id;
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles(auth_user_id) VALUES(v_auth_user_id) RETURNING id INTO v_profile_id;
  END IF;
  INSERT INTO public.notification_preferences(profile_id)
  VALUES(v_profile_id)
  ON CONFLICT (profile_id) DO NOTHING;
  INSERT INTO public.push_devices(profile_id,expo_push_token,platform,last_location,enabled,updated_at)
  VALUES(v_profile_id,trim(p_token),p_platform,v_location,true,now())
  ON CONFLICT (expo_push_token) DO UPDATE SET
    profile_id=EXCLUDED.profile_id,
    platform=EXCLUDED.platform,
    last_location=COALESCE(EXCLUDED.last_location,public.push_devices.last_location),
    enabled=true,
    updated_at=now();
  RETURN true;
END
$$;

CREATE OR REPLACE FUNCTION public.disable_push_device(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id='' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;
  SELECT id INTO v_profile_id FROM public.profiles WHERE auth_user_id=v_auth_user_id;
  UPDATE public.push_devices
  SET enabled=false,updated_at=now()
  WHERE profile_id=v_profile_id AND expo_push_token=trim(p_token);
  RETURN true;
END
$$;

CREATE OR REPLACE FUNCTION public.notification_targets_for_report(p_report_id uuid)
RETURNS TABLE(
  expo_push_token text,
  animal_type varchar,
  condition varchar,
  title varchar,
  report_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
DECLARE
  v_auth_user_id text := auth.user_id();
  v_reporter_id uuid;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id='' THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';
  END IF;

  SELECT r.reporter_id INTO v_reporter_id
  FROM public.animal_reports r
  JOIN public.profiles p ON p.id=r.reporter_id
  WHERE r.id=p_report_id AND p.auth_user_id=v_auth_user_id;

  IF v_reporter_id IS NULL THEN
    RAISE EXCEPTION 'report not found or not owned by caller' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  SELECT pd.expo_push_token,r.animal_type,r.condition,r.title,r.id
  FROM public.animal_reports r
  JOIN public.push_devices pd ON pd.enabled=true AND pd.profile_id<>r.reporter_id
  JOIN public.notification_preferences np ON np.profile_id=pd.profile_id
  WHERE r.id=p_report_id
    AND pd.last_location IS NOT NULL
    AND ST_DWithin(r.location,pd.last_location,np.radius_m)
    AND (NOT np.urgent_only OR r.urgency>=4)
    AND (
      (lower(r.animal_type)='kedi' AND np.cats)
      OR (lower(r.animal_type)='köpek' AND np.dogs)
      OR (lower(r.animal_type) NOT IN ('kedi','köpek') AND (np.cats OR np.dogs))
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users bu
      WHERE (bu.blocker_id=pd.profile_id AND bu.blocked_id=r.reporter_id)
         OR (bu.blocker_id=r.reporter_id AND bu.blocked_id=pd.profile_id)
    )
  ORDER BY pd.updated_at DESC
  LIMIT 500;
END
$$;

GRANT EXECUTE ON FUNCTION public.register_push_device(text,text,double precision,double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_push_device(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notification_targets_for_report(uuid) TO authenticated;
