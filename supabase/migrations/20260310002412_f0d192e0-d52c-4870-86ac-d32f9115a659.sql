CREATE POLICY "Admins podem ver todos os convites"
ON public.rede_convites
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role));