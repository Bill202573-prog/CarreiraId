
-- Create criancas table (simplified for Carreira ID)
CREATE TABLE IF NOT EXISTS public.criancas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  data_nascimento date,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.criancas ENABLE ROW LEVEL SECURITY;

-- RLS: Users can insert criancas
CREATE POLICY "Authenticated users can create criancas"
  ON public.criancas FOR INSERT TO authenticated
  WITH CHECK (true);

-- RLS: Users can view criancas linked to their perfil_atleta
CREATE POLICY "Users can view criancas linked to their profile"
  ON public.criancas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfil_atleta
      WHERE perfil_atleta.crianca_id = criancas.id
        AND perfil_atleta.user_id = auth.uid()
    )
  );

-- RLS: Users can update criancas linked to their perfil_atleta
CREATE POLICY "Users can update own criancas"
  ON public.criancas FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfil_atleta
      WHERE perfil_atleta.crianca_id = criancas.id
        AND perfil_atleta.user_id = auth.uid()
    )
  );

-- Create rede_convites table
CREATE TABLE IF NOT EXISTS public.rede_convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convidante_perfil_id uuid NOT NULL,
  convidado_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.rede_convites ENABLE ROW LEVEL SECURITY;

-- RLS: Authenticated users can insert convites
CREATE POLICY "Authenticated users can create convites"
  ON public.rede_convites FOR INSERT TO authenticated
  WITH CHECK (true);

-- RLS: Users can view their own convites
CREATE POLICY "Users can view own convites"
  ON public.rede_convites FOR SELECT TO authenticated
  USING (
    convidado_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.perfis_rede
      WHERE perfis_rede.id = rede_convites.convidante_perfil_id
        AND perfis_rede.user_id = auth.uid()
    )
  );
