
-- Add unique constraint on perfil_visualizacoes for proper upsert behavior
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'perfil_visualizacoes_unique_view'
  ) THEN
    ALTER TABLE public.perfil_visualizacoes 
    ADD CONSTRAINT perfil_visualizacoes_unique_view 
    UNIQUE (perfil_atleta_id, viewer_user_id, viewed_date);
  END IF;
END $$;

-- Allow viewers to update their own view records (for upsert to update photo/name)
CREATE POLICY "Viewers can update own view records"
ON public.perfil_visualizacoes
FOR UPDATE
TO authenticated
USING (viewer_user_id = auth.uid())
WITH CHECK (viewer_user_id = auth.uid());
