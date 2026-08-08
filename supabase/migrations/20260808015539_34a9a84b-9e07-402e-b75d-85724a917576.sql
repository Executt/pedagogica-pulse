CREATE POLICY "audit insert own actions"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());

GRANT INSERT ON public.audit_log TO authenticated;