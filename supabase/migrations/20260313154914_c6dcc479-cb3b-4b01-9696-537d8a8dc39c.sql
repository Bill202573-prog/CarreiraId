
-- Update the check_carreira_atividade_limit function to return plan-aware limits
CREATE OR REPLACE FUNCTION public.check_carreira_atividade_limit(p_user_id uuid, p_crianca_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_plano TEXT := 'base';
  v_limite INTEGER;
  v_count INTEGER;
  v_has_whitelist BOOLEAN;
BEGIN
  -- Check whitelist (legacy access = elite)
  SELECT EXISTS (
    SELECT 1 FROM atividades_externas_whitelist
    WHERE (user_id = p_user_id OR user_email = (SELECT email FROM auth.users WHERE id = p_user_id))
    AND ativo = true
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_has_whitelist;

  IF v_has_whitelist THEN
    RETURN jsonb_build_object('status', 'allowed', 'source', 'legacy_access', 'plano', 'elite', 'count', 0, 'limit', 0);
  END IF;

  -- Check active subscription and get plan
  SELECT COALESCE(plano, 'competidor') INTO v_plano
  FROM carreira_assinaturas
  WHERE user_id = p_user_id
  AND crianca_id = p_crianca_id
  AND status = 'ativa'
  AND (expira_em IS NULL OR expira_em > now())
  ORDER BY created_at DESC
  LIMIT 1;

  -- If subscription found
  IF v_plano IS NOT NULL AND v_plano != 'base' THEN
    -- Map legacy plan names
    IF v_plano IN ('mensal', 'pro_mensal') THEN
      v_plano := 'competidor';
    END IF;
    
    IF v_plano = 'elite' THEN
      RETURN jsonb_build_object('status', 'subscribed', 'source', 'carreira_subscription', 'plano', 'elite', 'count', 0, 'limit', 0);
    END IF;
    
    -- Competidor: 3 per month
    SELECT COUNT(*)::integer INTO v_count
    FROM atividades_externas
    WHERE crianca_id = p_crianca_id 
    AND criado_por = p_user_id
    AND created_at >= date_trunc('month', now());
    
    IF v_count >= 3 THEN
      RETURN jsonb_build_object('status', 'limit_reached', 'source', 'carreira_subscription', 'plano', 'competidor', 'count', v_count, 'limit', 3);
    END IF;
    
    RETURN jsonb_build_object('status', 'allowed', 'source', 'carreira_subscription', 'plano', 'competidor', 'count', v_count, 'limit', 3);
  END IF;

  -- Free/Base plan: check global limit
  v_plano := 'base';
  
  SELECT COALESCE(
    (SELECT valor::integer FROM saas_config WHERE chave = 'carreira_limite_free'), 1
  ) INTO v_limite;

  SELECT COUNT(*)::integer INTO v_count
  FROM atividades_externas
  WHERE crianca_id = p_crianca_id 
  AND criado_por = p_user_id
  AND created_at >= date_trunc('month', now());

  IF v_count >= v_limite THEN
    RETURN jsonb_build_object('status', 'limit_reached', 'source', 'freemium', 'plano', 'base', 'count', v_count, 'limit', v_limite);
  END IF;

  RETURN jsonb_build_object('status', 'allowed', 'source', 'freemium', 'plano', 'base', 'count', v_count, 'limit', v_limite);
END;
$function$;
