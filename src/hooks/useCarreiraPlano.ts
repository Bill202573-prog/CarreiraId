import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CarreiraPlano, PLANOS, PlanoLimites, temAcessoAoPlano } from '@/config/carreiraPlanos';

export interface CarreiraPlanoResult {
  plano: CarreiraPlano;
  limites: PlanoLimites;
  isLoading: boolean;
  /** Check if current plan includes a feature */
  temAcesso: (feature: keyof PlanoLimites) => boolean;
  /** Check if current plan meets the required plan level */
  temPlano: (requerido: CarreiraPlano) => boolean;
}

export function useCarreiraPlano(criancaId: string | null): CarreiraPlanoResult {
  const { user } = useAuth();

  const { data: plano, isLoading } = useQuery({
    queryKey: ['carreira-plano', user?.id, criancaId],
    queryFn: async (): Promise<CarreiraPlano> => {
      let userId = user?.id;
      if (!userId) {
        const { data: sessionData } = await supabase.auth.getSession();
        userId = sessionData.session?.user?.id;
      }

      if (!userId || !criancaId) return 'base';

      // Check for whitelist (legacy access = elite equivalent)
      const { data: whitelist } = await supabase
        .from('atividades_externas_whitelist')
        .select('id')
        .or(`user_id.eq.${userId}`)
        .eq('ativo', true)
        .limit(1);

      if (whitelist && whitelist.length > 0) return 'elite';

      // Check active subscription
      const { data: assinatura } = await supabase
        .from('carreira_assinaturas')
        .select('plano, status, expira_em')
        .eq('user_id', userId)
        .eq('crianca_id', criancaId)
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })
        .limit(1);

      if (assinatura && assinatura.length > 0) {
        const sub = assinatura[0];
        // Check if not expired
        if (!sub.expira_em || new Date(sub.expira_em) > new Date()) {
          const planoValue = (sub.plano || 'base') as string;
          if (planoValue === 'competidor' || planoValue === 'pro_mensal') return 'competidor';
          if (planoValue === 'elite') return 'elite';
          // Legacy "mensal" plan maps to competidor
          if (planoValue === 'mensal') return 'competidor';
          return 'competidor'; // any active sub = at least competidor
        }
      }

      return 'base';
    },
    enabled: !!criancaId,
    staleTime: 60_000, // 1 minute cache
    gcTime: 5 * 60_000,
  });

  const planoAtual = plano || 'base';
  const limites = PLANOS[planoAtual].limites;

  return {
    plano: planoAtual,
    limites,
    isLoading,
    temAcesso: (feature: keyof PlanoLimites) => {
      const val = limites[feature];
      return typeof val === 'boolean' ? val : (val as number) > 0;
    },
    temPlano: (requerido: CarreiraPlano) => temAcessoAoPlano(planoAtual, requerido),
  };
}
