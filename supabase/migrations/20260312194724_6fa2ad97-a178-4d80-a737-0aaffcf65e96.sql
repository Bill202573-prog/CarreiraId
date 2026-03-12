
-- Mirror table for atividades_externas synced from Atleta ID
CREATE TABLE public.atividades_externas_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id_atividade_id uuid NOT NULL UNIQUE,
  crianca_id uuid NOT NULL,
  tipo text NOT NULL,
  tipo_outro_descricao text,
  data date NOT NULL,
  data_fim date,
  duracao_minutos integer NOT NULL DEFAULT 60,
  frequencia_semanal integer,
  carga_horaria_horas numeric,
  local_atividade text NOT NULL,
  profissional_instituicao text NOT NULL,
  profissionais_envolvidos text[],
  organizador text,
  torneio_abrangencia text,
  torneio_nome text,
  objetivos text[] DEFAULT '{}'::text[],
  metodologia text,
  observacoes text,
  evidencia_url text,
  evidencia_tipo text,
  credibilidade_status text NOT NULL DEFAULT 'registrado',
  fotos_urls text[] DEFAULT '{}'::text[],
  tornar_publico boolean DEFAULT false,
  origem text NOT NULL DEFAULT 'atleta_id',
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Mirror table for evento_gols synced from Atleta ID
CREATE TABLE public.evento_gols_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id_gol_id uuid NOT NULL UNIQUE,
  crianca_id uuid NOT NULL,
  evento_id uuid,
  time_id uuid,
  quantidade integer NOT NULL DEFAULT 1,
  evento_nome text,
  time_nome text,
  origem text NOT NULL DEFAULT 'atleta_id',
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Mirror table for evento_premiacoes synced from Atleta ID
CREATE TABLE public.evento_premiacoes_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id_premiacao_id uuid NOT NULL UNIQUE,
  crianca_id uuid NOT NULL,
  evento_id uuid,
  tipo_premiacao text NOT NULL,
  evento_nome text,
  origem text NOT NULL DEFAULT 'atleta_id',
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Mirror table for conquistas coletivas synced from Atleta ID
CREATE TABLE public.conquistas_coletivas_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id_conquista_id uuid NOT NULL UNIQUE,
  crianca_id uuid NOT NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  data date,
  evento_nome text,
  origem text NOT NULL DEFAULT 'atleta_id',
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all sync tables
ALTER TABLE public.atividades_externas_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_gols_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_premiacoes_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conquistas_coletivas_sync ENABLE ROW LEVEL SECURITY;

-- RLS: Owner can view their athlete's synced data
CREATE POLICY "Owner can view synced atividades"
  ON public.atividades_externas_sync FOR SELECT
  USING (is_perfil_atleta_owner(auth.uid(), crianca_id));

CREATE POLICY "Public synced atividades"
  ON public.atividades_externas_sync FOR SELECT
  USING (tornar_publico = true);

CREATE POLICY "Owner can view synced gols"
  ON public.evento_gols_sync FOR SELECT
  USING (is_perfil_atleta_owner(auth.uid(), crianca_id));

CREATE POLICY "Owner can view synced premiacoes"
  ON public.evento_premiacoes_sync FOR SELECT
  USING (is_perfil_atleta_owner(auth.uid(), crianca_id));

CREATE POLICY "Owner can view synced conquistas"
  ON public.conquistas_coletivas_sync FOR SELECT
  USING (is_perfil_atleta_owner(auth.uid(), crianca_id));

-- Public access for public profiles
CREATE POLICY "Public synced gols"
  ON public.evento_gols_sync FOR SELECT
  USING (crianca_has_public_profile(crianca_id, 'gols'));

CREATE POLICY "Public synced premiacoes"
  ON public.evento_premiacoes_sync FOR SELECT
  USING (crianca_has_public_profile(crianca_id, 'premiacoes'));

CREATE POLICY "Public synced conquistas"
  ON public.conquistas_coletivas_sync FOR SELECT
  USING (crianca_has_public_profile(crianca_id, 'conquistas'));

-- Indexes for performance
CREATE INDEX idx_atividades_sync_crianca ON public.atividades_externas_sync(crianca_id);
CREATE INDEX idx_gols_sync_crianca ON public.evento_gols_sync(crianca_id);
CREATE INDEX idx_premiacoes_sync_crianca ON public.evento_premiacoes_sync(crianca_id);
CREATE INDEX idx_conquistas_sync_crianca ON public.conquistas_coletivas_sync(crianca_id);
