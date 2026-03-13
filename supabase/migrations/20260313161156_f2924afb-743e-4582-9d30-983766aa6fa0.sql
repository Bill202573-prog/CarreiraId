
-- Table to store dynamic plan configuration (admin-editable)
CREATE TABLE public.carreira_planos_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano text NOT NULL UNIQUE,
  nome text NOT NULL,
  preco numeric NOT NULL DEFAULT 0,
  cor text NOT NULL DEFAULT '#6b7280',
  icone text NOT NULL DEFAULT '⚽',
  descricao text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  -- Numeric limits
  jornada_mes integer NOT NULL DEFAULT 1,
  carreira_mes integer NOT NULL DEFAULT 1,
  posts_dia integer NOT NULL DEFAULT 1,
  video_seg integer NOT NULL DEFAULT 0,
  -- Boolean features
  youtube boolean NOT NULL DEFAULT false,
  selo_elite boolean NOT NULL DEFAULT false,
  ver_views boolean NOT NULL DEFAULT false,
  prioridade_busca boolean NOT NULL DEFAULT false,
  destaque_listagem boolean NOT NULL DEFAULT false,
  stats_avancadas boolean NOT NULL DEFAULT false,
  liga_conexoes boolean NOT NULL DEFAULT false,
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed with initial plan data
INSERT INTO public.carreira_planos_config (plano, nome, preco, cor, icone, descricao, jornada_mes, carreira_mes, posts_dia, video_seg, youtube, selo_elite, ver_views, prioridade_busca, destaque_listagem, stats_avancadas, liga_conexoes) VALUES
  ('base', 'Base', 0, '#6b7280', '⚽', 'Comece sua jornada esportiva', 1, 1, 1, 0, false, false, false, false, false, false, false),
  ('competidor', 'Competidor', 15.90, '#f59e0b', '🏆', 'Acelere sua carreira esportiva', 3, 3, 3, 20, false, false, false, false, false, false, true),
  ('elite', 'Elite', 29.90, '#8b5cf6', '👑', 'Máxima visibilidade e recursos', 9999, 9999, 99, 60, true, true, true, true, true, true, true);

-- RLS
ALTER TABLE public.carreira_planos_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plans config" ON public.carreira_planos_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage plans config" ON public.carreira_planos_config FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
