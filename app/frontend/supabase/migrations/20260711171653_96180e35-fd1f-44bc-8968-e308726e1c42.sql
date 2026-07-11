-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  icon text,
  display_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Compass dimensions (configurable, weighted)
CREATE TABLE public.compass_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  weight numeric NOT NULL DEFAULT 1,
  display_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.compass_dimensions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.compass_dimensions TO authenticated;
GRANT ALL ON public.compass_dimensions TO service_role;
ALTER TABLE public.compass_dimensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dimensions public read" ON public.compass_dimensions FOR SELECT USING (true);
CREATE POLICY "Admins manage dimensions" ON public.compass_dimensions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Compass questions (configurable)
CREATE TABLE public.compass_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id uuid NOT NULL REFERENCES public.compass_dimensions(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  help_text text,
  max_points int NOT NULL DEFAULT 5,
  display_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.compass_questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.compass_questions TO authenticated;
GRANT ALL ON public.compass_questions TO service_role;
ALTER TABLE public.compass_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions public read" ON public.compass_questions FOR SELECT USING (true);
CREATE POLICY "Admins manage questions" ON public.compass_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Businesses
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  description text,
  category_id uuid REFERENCES public.categories(id),
  parish text,
  address text,
  latitude numeric,
  longitude numeric,
  website text,
  email text,
  phone text,
  opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_key text NOT NULL DEFAULT 'cafe',
  services text[] NOT NULL DEFAULT '{}',
  awards text[] NOT NULL DEFAULT '{}',
  certifications text[] NOT NULL DEFAULT '{}',
  verified boolean NOT NULL DEFAULT false,
  cia_completed boolean NOT NULL DEFAULT false,
  renewable_energy boolean NOT NULL DEFAULT false,
  circular_economy boolean NOT NULL DEFAULT false,
  community_contribution boolean NOT NULL DEFAULT false,
  accessible boolean NOT NULL DEFAULT false,
  sustainable_tourism boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  biosphere_score numeric,
  last_assessed_at date,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.businesses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published businesses public read" ON public.businesses FOR SELECT USING (published = true);
CREATE POLICY "Owners read own business" ON public.businesses FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert own business" ON public.businesses FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own business" ON public.businesses FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Admins manage businesses" ON public.businesses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Assessments
CREATE TYPE public.assessment_status AS ENUM ('draft','submitted','published','verified','rejected');
CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status assessment_status NOT NULL DEFAULT 'draft',
  overall_score numeric,
  review_notes text,
  submitted_at timestamptz,
  verified_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assessments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published assessments" ON public.assessments FOR SELECT USING (status IN ('published','verified'));
CREATE POLICY "Owners manage own assessments" ON public.assessments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));
CREATE POLICY "Admins manage assessments" ON public.assessments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Per-dimension scores
CREATE TABLE public.assessment_dimension_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  dimension_id uuid NOT NULL REFERENCES public.compass_dimensions(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  UNIQUE (assessment_id, dimension_id)
);
GRANT SELECT ON public.assessment_dimension_scores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_dimension_scores TO authenticated;
GRANT ALL ON public.assessment_dimension_scores TO service_role;
ALTER TABLE public.assessment_dimension_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read scores of published assessments" ON public.assessment_dimension_scores FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND a.status IN ('published','verified')));
CREATE POLICY "Owners manage own dimension scores" ON public.assessment_dimension_scores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessments a JOIN public.businesses b ON b.id = a.business_id WHERE a.id = assessment_id AND b.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a JOIN public.businesses b ON b.id = a.business_id WHERE a.id = assessment_id AND b.owner_id = auth.uid()));
CREATE POLICY "Admins manage dimension scores" ON public.assessment_dimension_scores FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Question responses
CREATE TABLE public.assessment_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.compass_questions(id) ON DELETE CASCADE,
  points int NOT NULL DEFAULT 0,
  notes text,
  UNIQUE (assessment_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_responses TO authenticated;
GRANT ALL ON public.assessment_responses TO service_role;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own responses" ON public.assessment_responses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessments a JOIN public.businesses b ON b.id = a.business_id WHERE a.id = assessment_id AND b.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a JOIN public.businesses b ON b.id = a.business_id WHERE a.id = assessment_id AND b.owner_id = auth.uid()));
CREATE POLICY "Admins manage responses" ON public.assessment_responses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Evidence files
CREATE TABLE public.evidence_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  label text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.evidence_files TO authenticated;
GRANT ALL ON public.evidence_files TO service_role;
ALTER TABLE public.evidence_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own evidence" ON public.evidence_files FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessments a JOIN public.businesses b ON b.id = a.business_id WHERE a.id = assessment_id AND b.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a JOIN public.businesses b ON b.id = a.business_id WHERE a.id = assessment_id AND b.owner_id = auth.uid()));
CREATE POLICY "Admins manage evidence" ON public.evidence_files FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Audit log
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated write audit log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_businesses_category ON public.businesses(category_id);
CREATE INDEX idx_businesses_score ON public.businesses(biosphere_score DESC NULLS LAST);
CREATE INDEX idx_assessments_business ON public.assessments(business_id);
CREATE INDEX idx_dim_scores_assessment ON public.assessment_dimension_scores(assessment_id);