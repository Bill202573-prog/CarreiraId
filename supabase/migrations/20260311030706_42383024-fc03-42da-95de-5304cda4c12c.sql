
-- Add technical fields to perfil_atleta
ALTER TABLE public.perfil_atleta
  ADD COLUMN IF NOT EXISTS pe_dominante text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS posicao_principal text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS posicao_secundaria text DEFAULT NULL;

-- Add new fields to carreira_experiencias
ALTER TABLE public.carreira_experiencias
  ADD COLUMN IF NOT EXISTS tipo_instituicao text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS categoria_instituicao text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS posicao_jogada text DEFAULT NULL;
