
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('diretor', 'pedagogo', 'professor');
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.suggestion_status AS ENUM ('pending', 'applied', 'scheduled', 'discarded');
CREATE TYPE public.suggestion_type AS ENUM ('reforco', 'emocional', 'encaminhamento', 'engajamento', 'outro');
CREATE TYPE public.observation_type AS ENUM ('text', 'audio', 'image');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles select all authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SCHOOLS ============
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, school_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles select own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Security-definer helpers
CREATE OR REPLACE FUNCTION public.has_school_access(_school_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND school_id = _school_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_school_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT school_id FROM public.user_roles WHERE user_id = auth.uid();
$$;

-- schools policies
CREATE POLICY "schools select accessible" ON public.schools FOR SELECT TO authenticated
  USING (public.has_school_access(id));

-- ============ CLASSES ============
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  year INT NOT NULL DEFAULT EXTRACT(YEAR FROM now())::INT,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes select accessible" ON public.classes FOR SELECT TO authenticated
  USING (public.has_school_access(school_id));
CREATE POLICY "classes insert accessible" ON public.classes FOR INSERT TO authenticated
  WITH CHECK (public.has_school_access(school_id));

-- ============ STUDENTS ============
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  birthdate DATE,
  guardian_name TEXT,
  guardian_contact TEXT,
  has_pei BOOLEAN NOT NULL DEFAULT false,
  risk risk_level NOT NULL DEFAULT 'low',
  attendance_rate NUMERIC(5,2) DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students select accessible" ON public.students FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND public.has_school_access(c.school_id)));
CREATE POLICY "students insert accessible" ON public.students FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND public.has_school_access(c.school_id)));
CREATE POLICY "students update accessible" ON public.students FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND public.has_school_access(c.school_id)));

-- ============ OBSERVATIONS ============
CREATE TABLE public.observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type observation_type NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  media_url TEXT,
  sentiment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.observations TO authenticated;
GRANT ALL ON public.observations TO service_role;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "observations select accessible" ON public.observations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s JOIN public.classes c ON c.id = s.class_id WHERE s.id = student_id AND public.has_school_access(c.school_id)));
CREATE POLICY "observations insert own" ON public.observations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.students s JOIN public.classes c ON c.id = s.class_id WHERE s.id = student_id AND public.has_school_access(c.school_id)));
CREATE POLICY "observations delete own" ON public.observations FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- ============ AI SUGGESTIONS ============
CREATE TABLE public.ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  type suggestion_type NOT NULL DEFAULT 'reforco',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status suggestion_status NOT NULL DEFAULT 'pending',
  feedback TEXT,
  handled_by UUID REFERENCES auth.users(id),
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_suggestions TO authenticated;
GRANT ALL ON public.ai_suggestions TO service_role;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suggestions select accessible" ON public.ai_suggestions FOR SELECT TO authenticated
  USING (public.has_school_access(school_id));
CREATE POLICY "suggestions update accessible" ON public.ai_suggestions FOR UPDATE TO authenticated
  USING (public.has_school_access(school_id));
CREATE POLICY "suggestions insert accessible" ON public.ai_suggestions FOR INSERT TO authenticated
  WITH CHECK (public.has_school_access(school_id));

-- ============ MATERIALS ============
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials select accessible" ON public.materials FOR SELECT TO authenticated
  USING (public.has_school_access(school_id));
CREATE POLICY "materials insert own" ON public.materials FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploader_id AND public.has_school_access(school_id));
CREATE POLICY "materials delete own" ON public.materials FOR DELETE TO authenticated
  USING (auth.uid() = uploader_id);

-- ============ EVENTS ============
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events select accessible" ON public.events FOR SELECT TO authenticated
  USING (public.has_school_access(school_id));
CREATE POLICY "events insert accessible" ON public.events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id AND public.has_school_access(school_id));
CREATE POLICY "events update own" ON public.events FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id);
CREATE POLICY "events delete own" ON public.events FOR DELETE TO authenticated
  USING (auth.uid() = creator_id);

-- ============ ANNOUNCEMENTS ============
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements select accessible" ON public.announcements FOR SELECT TO authenticated
  USING (school_id IS NULL OR public.has_school_access(school_id));
CREATE POLICY "announcements insert accessible" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND (school_id IS NULL OR public.has_school_access(school_id)));

-- ============ INDEXES ============
CREATE INDEX idx_classes_school ON public.classes(school_id);
CREATE INDEX idx_students_class ON public.students(class_id);
CREATE INDEX idx_observations_student ON public.observations(student_id, created_at DESC);
CREATE INDEX idx_suggestions_school_status ON public.ai_suggestions(school_id, status);
CREATE INDEX idx_events_school_start ON public.events(school_id, starts_at);
CREATE INDEX idx_materials_school ON public.materials(school_id);
