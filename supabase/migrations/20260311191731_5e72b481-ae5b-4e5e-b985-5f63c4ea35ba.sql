
-- Allow anyone (authenticated) to view profile views, not just the owner
DROP POLICY IF EXISTS "Owners can view their profile views" ON public.perfil_visualizacoes;

CREATE POLICY "Anyone can view profile views"
ON public.perfil_visualizacoes
FOR SELECT
TO authenticated
USING (true);
