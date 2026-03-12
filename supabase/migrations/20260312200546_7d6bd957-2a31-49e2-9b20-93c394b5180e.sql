
-- Amistosos sincronizados do Atleta ID
CREATE TABLE IF NOT EXISTS amistoso_convocacoes_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  crianca_id uuid NOT NULL,
  atleta_id_convocacao_id uuid NOT NULL,
  evento_nome text,
  evento_data date,
  evento_tipo text,
  evento_adversario text,
  evento_local text,
  evento_placar_time1 integer,
  evento_placar_time2 integer,
  evento_status text,
  status text DEFAULT 'confirmado',
  presente boolean,
  origem text NOT NULL DEFAULT 'atleta_id',
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(atleta_id_convocacao_id)
);

-- Campeonatos sincronizados do Atleta ID
CREATE TABLE IF NOT EXISTS campeonato_convocacoes_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  crianca_id uuid NOT NULL,
  atleta_id_convocacao_id uuid NOT NULL,
  campeonato_nome text,
  campeonato_ano integer,
  campeonato_categoria text,
  campeonato_status text,
  campeonato_nome_time text,
  escolinha_nome text,
  status text DEFAULT 'confirmado',
  origem text NOT NULL DEFAULT 'atleta_id',
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(atleta_id_convocacao_id)
);

-- RLS
ALTER TABLE amistoso_convocacoes_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE campeonato_convocacoes_sync ENABLE ROW LEVEL SECURITY;

-- Owner pode ver seus dados
CREATE POLICY "Owner can view amistosos sync" ON amistoso_convocacoes_sync
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owner can view campeonatos sync" ON campeonato_convocacoes_sync
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Perfis públicos acessíveis
CREATE POLICY "Public profiles amistosos" ON amistoso_convocacoes_sync
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM perfil_atleta pa
    WHERE pa.crianca_id = amistoso_convocacoes_sync.crianca_id
    AND pa.is_public = true
    AND (pa.dados_publicos->>'amistosos')::boolean = true
  ));

CREATE POLICY "Public profiles campeonatos" ON campeonato_convocacoes_sync
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM perfil_atleta pa
    WHERE pa.crianca_id = campeonato_convocacoes_sync.crianca_id
    AND pa.is_public = true
    AND (pa.dados_publicos->>'campeonatos')::boolean = true
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_amistoso_sync_crianca ON amistoso_convocacoes_sync(crianca_id);
CREATE INDEX IF NOT EXISTS idx_amistoso_sync_user ON amistoso_convocacoes_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_campeonato_sync_crianca ON campeonato_convocacoes_sync(crianca_id);
CREATE INDEX IF NOT EXISTS idx_campeonato_sync_user ON campeonato_convocacoes_sync(user_id);

-- Enriquecer evento_gols_sync com colunas de contexto
ALTER TABLE evento_gols_sync ADD COLUMN IF NOT EXISTS evento_data date;
ALTER TABLE evento_gols_sync ADD COLUMN IF NOT EXISTS evento_adversario text;
ALTER TABLE evento_gols_sync ADD COLUMN IF NOT EXISTS evento_placar_time1 integer;
ALTER TABLE evento_gols_sync ADD COLUMN IF NOT EXISTS evento_placar_time2 integer;

-- Enriquecer evento_premiacoes_sync com colunas de contexto
ALTER TABLE evento_premiacoes_sync ADD COLUMN IF NOT EXISTS evento_data date;
