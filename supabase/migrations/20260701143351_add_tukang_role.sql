-- Alter app_role enum to add 'tukang'
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tukang';

-- Update handle_new_user trigger function to respect the metadata role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.app_role;
BEGIN
  -- Parse role from metadata, default to 'customer'
  BEGIN
    v_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'customer'::public.app_role);
  EXCEPTION WHEN OTHERS THEN
    v_role := 'customer'::public.app_role;
  END;

  INSERT INTO public.profiles (id, fullname, email, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'fullname',''), NEW.email, NEW.raw_user_meta_data->>'phone');
  
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (NEW.id, v_role) 
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END; $$;
