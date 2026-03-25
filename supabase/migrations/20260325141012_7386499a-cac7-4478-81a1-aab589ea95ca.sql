
-- Peneiras (tryouts) table
CREATE TABLE public.peneiras (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  criador_id uuid NOT NULL,
  criador_perfil_rede_id uuid REFERENCES public.perfis_rede(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  data_evento timestamp with time zone NOT NULL,
  data_fim timestamp with time zone,
  local_nome text NOT NULL,
  local_endereco text,
  cidade text,
  estado text,
  modalidade text NOT NULL DEFAULT 'Futebol',
  categorias text[] DEFAULT '{}',
  posicoes text[] DEFAULT '{}',
  vagas integer,
  requisitos text,
  contato_whatsapp text,
  contato_email text,
  banner_url text,
  status text NOT NULL DEFAULT 'aberta',
  alcance text NOT NULL DEFAULT 'todos',
  filtro_status_federado text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.peneiras ENABLE ROW LEVEL SECURITY;

-- RLS: creator can manage own peneiras
CREATE POLICY "Creator can manage own peneiras"
  ON public.peneiras FOR ALL TO authenticated
  USING (criador_id = auth.uid())
  WITH CHECK (criador_id = auth.uid());

-- RLS: anyone can view open peneiras
CREATE POLICY "Anyone can view open peneiras"
  ON public.peneiras FOR SELECT TO public
  USING (status = 'aberta');

-- Admins can manage all
CREATE POLICY "Admins can manage all peneiras"
  ON public.peneiras FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Peneira convites (invitations to athletes)
CREATE TABLE public.peneira_convites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  peneira_id uuid NOT NULL REFERENCES public.peneiras(id) ON DELETE CASCADE,
  atleta_perfil_id uuid NOT NULL,
  atleta_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  respondido_em timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (peneira_id, atleta_perfil_id)
);

ALTER TABLE public.peneira_convites ENABLE ROW LEVEL SECURITY;

-- Athletes can view and respond to their own invites
CREATE POLICY "Athletes can view own convites"
  ON public.peneira_convites FOR SELECT TO authenticated
  USING (atleta_user_id = auth.uid());

CREATE POLICY "Athletes can update own convites"
  ON public.peneira_convites FOR UPDATE TO authenticated
  USING (atleta_user_id = auth.uid());

-- Creator of peneira can manage convites
CREATE POLICY "Creator can manage convites"
  ON public.peneira_convites FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.peneiras WHERE id = peneira_convites.peneira_id AND criador_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.peneiras WHERE id = peneira_convites.peneira_id AND criador_id = auth.uid()));

-- Admins can manage all convites
CREATE POLICY "Admins can manage all convites"
  ON public.peneira_convites FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
