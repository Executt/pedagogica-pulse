
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) IN ('executt@gmail.com','executt@gmaill.com') LIMIT 1;
  IF uid IS NULL THEN
    RAISE NOTICE 'User executt@gmail.com not found in auth.users';
    RETURN;
  END IF;

  INSERT INTO public.profiles (id, full_name)
    VALUES (uid, 'Executt (Superadmin)')
    ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, school_id, role)
    SELECT uid, s.id, 'superadmin'::public.app_role FROM public.schools s
    ON CONFLICT (user_id, school_id, role) DO NOTHING;

  INSERT INTO public.user_roles (user_id, school_id, role)
    SELECT uid, s.id, 'diretor'::public.app_role FROM public.schools s
    ON CONFLICT (user_id, school_id, role) DO NOTHING;
END $$;
