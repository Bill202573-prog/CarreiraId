
CREATE TABLE public.perfil_visualizacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_atleta_id uuid NOT NULL REFERENCES public.perfil_atleta(id) ON DELETE CASCADE,
  viewer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_tipo text,
  viewer_nome text,
  viewer_foto_url text,
  viewed_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(perfil_atleta_id, viewer_user_id, viewed_date)
);

ALTER TABLE public.perfil_visualizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their profile views"
ON public.perfil_visualizacoes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfil_atleta
    WHERE perfil_atleta.id = perfil_visualizacoes.perfil_atleta_id
    AND perfil_atleta.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can register views"
ON public.perfil_visualizacoes
FOR INSERT
TO authenticated
WITH CHECK (viewer_user_id = auth.uid());

CREATE INDEX idx_perfil_viz_perfil ON public.perfil_visualizacoes(perfil_atleta_id, created_at DESC);
