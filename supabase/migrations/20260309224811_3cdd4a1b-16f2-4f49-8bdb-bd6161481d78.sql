
-- Update calcular_nivel to use gamificacao_niveis table instead of hardcoded formula
-- This ensures admin-configured XP thresholds are respected
CREATE OR REPLACE FUNCTION public.calcular_nivel(xp_atual integer)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
AS $$
DECLARE
  v_nivel INTEGER := 1;
BEGIN
  SELECT nivel INTO v_nivel
  FROM public.gamificacao_niveis
  WHERE xp_minimo <= xp_atual
  ORDER BY nivel DESC
  LIMIT 1;

  -- Fallback to formula if no niveis configured
  IF v_nivel IS NULL THEN
    v_nivel := GREATEST(1, floor(sqrt(xp_atual::numeric / 100)) + 1)::INTEGER;
  END IF;

  RETURN v_nivel;
END;
$$;
