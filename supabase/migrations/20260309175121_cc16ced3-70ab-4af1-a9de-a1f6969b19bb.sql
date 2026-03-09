-- Remove trigger duplicado (mantendo apenas um)
DROP TRIGGER IF EXISTS trigger_convite_confirmado ON public.rede_convites;

-- Garantir que o trigger de atualização de nível existe
CREATE OR REPLACE TRIGGER on_gamificacao_xp_change
  BEFORE UPDATE OF xp_atual ON public.user_gamificacao
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_nivel_usuario();