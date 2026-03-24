import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LigaRankingEntry {
  position: number;
  user_id: string;
  nome: string;
  foto_url: string | null;
  slug: string | null;
  pontos: number;
  nivel: number | null;
}

export function useCarreiraRanking(limit = 100) {
  return useQuery({
    queryKey: ['liga-ranking', limit],
    queryFn: async (): Promise<LigaRankingEntry[]> => {
      const { data: gamData } = await supabase
        .from('user_gamificacao')
        .select('user_id, pontos_total, nivel')
        .order('pontos_total', { ascending: false })
        .limit(limit);

      if (!gamData || gamData.length === 0) return [];

      const userIds = gamData.map((g) => g.user_id);

      const { data: atletaProfiles } = await supabase
        .from('perfil_atleta')
        .select('user_id, nome, foto_url, slug')
        .in('user_id', userIds);

      const atletaMap = new Map((atletaProfiles || []).map((perfil) => [perfil.user_id, perfil]));
      const atletasOnly = gamData.filter((g) => atletaMap.has(g.user_id));

      return atletasOnly.map((g, idx) => {
        const atleta = atletaMap.get(g.user_id)!;
        return {
          position: idx + 1,
          user_id: g.user_id,
          nome: atleta.nome || 'Atleta',
          foto_url: atleta.foto_url || null,
          slug: atleta.slug || null,
          pontos: g.pontos_total,
          nivel: g.nivel,
        };
      });
    },
  });
}
