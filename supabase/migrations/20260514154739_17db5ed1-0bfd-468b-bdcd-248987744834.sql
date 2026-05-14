-- Make sure column exists
ALTER TABLE public.carreira_campeonatos
ADD COLUMN IF NOT EXISTS posicao_final TEXT NULL;

-- Drop and recreate policies idempotently
DROP POLICY IF EXISTS "Owner can view camp premiacoes" ON public.carreira_campeonato_premiacoes;
DROP POLICY IF EXISTS "Owner can insert camp premiacoes" ON public.carreira_campeonato_premiacoes;
DROP POLICY IF EXISTS "Owner can update camp premiacoes" ON public.carreira_campeonato_premiacoes;
DROP POLICY IF EXISTS "Owner can delete camp premiacoes" ON public.carreira_campeonato_premiacoes;
DROP POLICY IF EXISTS "Public profiles camp premiacoes" ON public.carreira_campeonato_premiacoes;
DROP POLICY IF EXISTS "Admins manage camp premiacoes" ON public.carreira_campeonato_premiacoes;

CREATE POLICY "Owner can view camp premiacoes"
ON public.carreira_campeonato_premiacoes FOR SELECT
USING (is_perfil_atleta_owner(auth.uid(), crianca_id) OR criado_por = auth.uid());

CREATE POLICY "Owner can insert camp premiacoes"
ON public.carreira_campeonato_premiacoes FOR INSERT
WITH CHECK (criado_por = auth.uid());

CREATE POLICY "Owner can update camp premiacoes"
ON public.carreira_campeonato_premiacoes FOR UPDATE
USING (criado_por = auth.uid());

CREATE POLICY "Owner can delete camp premiacoes"
ON public.carreira_campeonato_premiacoes FOR DELETE
USING (criado_por = auth.uid());

CREATE POLICY "Public profiles camp premiacoes"
ON public.carreira_campeonato_premiacoes FOR SELECT
USING (crianca_has_public_profile(crianca_id, 'campeonatos'::text) OR crianca_has_public_profile(crianca_id, 'premiacoes'::text));

CREATE POLICY "Admins manage camp premiacoes"
ON public.carreira_campeonato_premiacoes FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

DROP TRIGGER IF EXISTS update_camp_premiacoes_updated_at ON public.carreira_campeonato_premiacoes;
CREATE TRIGGER update_camp_premiacoes_updated_at
BEFORE UPDATE ON public.carreira_campeonato_premiacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add to realtime if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'carreira_campeonato_premiacoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.carreira_campeonato_premiacoes;
  END IF;
END $$;