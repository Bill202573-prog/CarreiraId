-- Allow admins to view all criancas records
CREATE POLICY "Admins can view all criancas"
ON public.criancas
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));
