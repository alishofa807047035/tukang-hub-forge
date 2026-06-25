-- 1. Restrict order_status_history INSERT to admins/system only
DROP POLICY IF EXISTS status_history_insert ON public.order_status_history;
CREATE POLICY status_history_admin_insert ON public.order_status_history
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Restrict reviews read to authenticated users (no longer exposes user_id to anon)
DROP POLICY IF EXISTS reviews_public_read ON public.reviews;
CREATE POLICY reviews_authenticated_read ON public.reviews
  FOR SELECT TO authenticated
  USING (true);

-- 3. Explicit admin-only INSERT policy on user_roles to prevent privilege escalation
CREATE POLICY user_roles_admin_insert ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Revoke EXECUTE on internal SECURITY DEFINER functions from API roles
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;