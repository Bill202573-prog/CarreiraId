
-- saas_config admin-only
ALTER TABLE public.saas_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read saas_config" ON public.saas_config;
DROP POLICY IF EXISTS "Admins can manage saas_config" ON public.saas_config;
CREATE POLICY "Admins can manage saas_config" ON public.saas_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Rebuild perfil_visualizacoes select policy
DROP POLICY IF EXISTS "Anyone can view profile views" ON public.perfil_visualizacoes;
DROP POLICY IF EXISTS "Owner or viewer can read profile views" ON public.perfil_visualizacoes;
CREATE POLICY "Owner or viewer can read profile views" ON public.perfil_visualizacoes
  FOR SELECT TO authenticated
  USING (
    viewer_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.perfil_atleta pa
      WHERE pa.id = perfil_visualizacoes.perfil_atleta_id
        AND pa.user_id = auth.uid()
    )
  );

-- Function search_path
ALTER FUNCTION public.calcular_nivel(integer) SET search_path = public;
ALTER FUNCTION public.xp_para_proximo_nivel(integer) SET search_path = public;

-- Move unaccent extension
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION unaccent SET SCHEMA extensions;
