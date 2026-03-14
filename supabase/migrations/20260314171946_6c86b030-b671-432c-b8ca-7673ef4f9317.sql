
-- Tabela de tutoriais gerenciáveis pelo admin
CREATE TABLE public.carreira_tutoriais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  tipo_perfil text NOT NULL DEFAULT 'atleta_filho',
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  slides jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de leituras (quais tutoriais o usuário já viu)
CREATE TABLE public.carreira_tutorial_leituras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tutorial_id uuid NOT NULL REFERENCES public.carreira_tutoriais(id) ON DELETE CASCADE,
  visto_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tutorial_id)
);

-- RLS tutoriais
ALTER TABLE public.carreira_tutoriais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tutorials"
  ON public.carreira_tutoriais FOR SELECT
  TO public
  USING (ativo = true);

CREATE POLICY "Admins can manage tutorials"
  ON public.carreira_tutoriais FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- RLS leituras
ALTER TABLE public.carreira_tutorial_leituras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leituras"
  ON public.carreira_tutorial_leituras FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own leituras"
  ON public.carreira_tutorial_leituras FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all leituras"
  ON public.carreira_tutorial_leituras FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role));
