-- Comunicados para a rede Carreira ID
CREATE TABLE public.carreira_comunicados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  mensagem text NOT NULL,
  tipo text NOT NULL DEFAULT 'informativo',
  destinatario_tipo text NOT NULL DEFAULT 'todos',
  destinatario_filtro jsonb DEFAULT '{}'::jsonb,
  enviar_push boolean DEFAULT true,
  criado_por uuid NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.carreira_comunicados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage carreira_comunicados" ON public.carreira_comunicados
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Users can read active carreira_comunicados" ON public.carreira_comunicados
  FOR SELECT TO authenticated
  USING (ativo = true);

CREATE TABLE public.carreira_comunicados_leituras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comunicado_id uuid NOT NULL REFERENCES public.carreira_comunicados(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  lido_em timestamptz DEFAULT now(),
  UNIQUE(comunicado_id, user_id)
);

ALTER TABLE public.carreira_comunicados_leituras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own leituras" ON public.carreira_comunicados_leituras
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can mark as read" ON public.carreira_comunicados_leituras
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all leituras" ON public.carreira_comunicados_leituras
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::user_role));