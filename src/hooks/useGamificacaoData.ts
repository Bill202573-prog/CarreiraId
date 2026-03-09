import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface GamificacaoData {
  pontos_total: number;
  nivel: number;
  xp_atual: number;
  convites_enviados: number;
  convites_confirmados: number;
  posts_criados: number;
  conexoes_feitas: number;
  atividades_registradas: number;
}

export interface Badge {
  badge_tipo: string;
  badge_nome: string;
  badge_descricao: string;
  badge_icone: string;
  badge_cor: string;
  conquistado_em: string;
}

export interface PontosHistorico {
  id: string;
  acao_tipo: string;
  pontos: number;
  descricao: string;
  created_at: string;
}

// Tabela de níveis com XP necessário
export function getXpForLevel(level: number): number {
  return ((level - 1) * (level - 1)) * 100;
}

export function getXpForNextLevel(level: number): number {
  return (level * level) * 100;
}

export function getLevelProgress(xp: number, level: number) {
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForNextLevel(level);
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  return Math.min(100, Math.max(0, progress));
}

export function getLevelTitle(level: number): string {
  if (level >= 20) return 'Lendário';
  if (level >= 15) return 'Mestre';
  if (level >= 10) return 'Veterano';
  if (level >= 7) return 'Experiente';
  if (level >= 5) return 'Intermediário';
  if (level >= 3) return 'Iniciante';
  return 'Novato';
}

// Pontuação por ação
export const PONTOS_POR_ACAO = {
  convite_confirmado: 50,
  post_criado: 10,
  conexao_feita: 15,
  atividade_registrada: 20,
  perfil_completo: 30,
  primeiro_login: 5,
};

export function useGamificacao() {
  const { user } = useAuth();

  const { data: gamificacao, isLoading } = useQuery({
    queryKey: ['user-gamificacao', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_gamificacao' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as any as GamificacaoData) || {
        pontos_total: 0,
        nivel: 1,
        xp_atual: 0,
        convites_enviados: 0,
        convites_confirmados: 0,
        posts_criados: 0,
        conexoes_feitas: 0,
        atividades_registradas: 0,
      };
    },
    enabled: !!user?.id,
  });

  const { data: badges } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_badges' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('conquistado_em', { ascending: false });
      if (error) throw error;
      return (data as any as Badge[]) || [];
    },
    enabled: !!user?.id,
  });

  const { data: historico } = useQuery({
    queryKey: ['pontos-historico', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('pontos_historico' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data as any as PontosHistorico[]) || [];
    },
    enabled: !!user?.id,
  });

  return {
    gamificacao: gamificacao || {
      pontos_total: 0,
      nivel: 1,
      xp_atual: 0,
      convites_enviados: 0,
      convites_confirmados: 0,
      posts_criados: 0,
      conexoes_feitas: 0,
      atividades_registradas: 0,
    },
    badges: badges || [],
    historico: historico || [],
    isLoading,
  };
}
