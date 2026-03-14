CREATE POLICY "Admins can view all subscriptions"
ON public.carreira_assinaturas FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));