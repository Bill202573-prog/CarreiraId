
-- Tabela de backup para contas deletadas (período de recuperação de 30 dias)
CREATE TABLE public.conta_deletada_backup (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT,
  nome TEXT,
  tipo_perfil TEXT,
  dados_perfil_atleta JSONB,
  dados_perfis_rede JSONB,
  dados_posts JSONB,
  dados_experiencias JSONB,
  dados_conexoes JSONB,
  motivo TEXT DEFAULT 'usuario_solicitou',
  deletado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  recuperado BOOLEAN NOT NULL DEFAULT false,
  recuperado_em TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.conta_deletada_backup ENABLE ROW LEVEL SECURITY;

-- Only admins can access backups
CREATE POLICY "Admins can manage backups"
ON public.conta_deletada_backup
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role can insert (from edge function)
CREATE POLICY "Service role can insert backups"
ON public.conta_deletada_backup
FOR INSERT
TO service_role
WITH CHECK (true);
