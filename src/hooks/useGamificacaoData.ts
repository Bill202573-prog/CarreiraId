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

export interface NivelConfig {
  id: string;
  nivel: number;
  nome: string;
  icone: string;
  cor: string;
  xp_minimo: number;
}

export interface DesafioConvite {
  id: string;
  titulo: string;
  descricao: string | null;
  icone: string;
  cor: string;
  tipo_perfil_alvo: string[];
  pontos_bonus: number;
  quantidade_meta: number;
  badge_premio_tipo: string | null;
  badge_premio_nome: string | null;
  badge_premio_icone: string | null;
  badge_premio_cor: string | null;
  ativo: boolean;
  data_inicio: string;
  data_fim: string | null;
}

export interface DesafioProgresso {
  id: string;
  desafio_id: string;
  progresso_atual: number;
  completado: boolean;
  completado_em: string | null;
}

export interface PontosTipoConfig {
  id: string;
  tipo_perfil: string;
  pontos: number;
  label: string;
  icone: string;
}

// Fallback level functions (used when DB config not loaded)
export function getXpForLevel(level: number): number {
  return ((level - 1) * (level - 1)) * 100;
}

export function getXpForNextLevel(level: number): number {
  return (level * level) * 100;
}

export function getLevelProgress(xp: number, level: number, niveis?: NivelConfig[]) {
  if (niveis && niveis.length > 0) {
    const currentNivel = niveis.find(n => n.nivel === level);
    const nextNivel = niveis.find(n => n.nivel === level + 1);
    if (currentNivel && nextNivel) {
      const range = nextNivel.xp_minimo - currentNivel.xp_minimo;
      if (range <= 0) return 100;
      return Math.min(100, Math.max(0, ((xp - currentNivel.xp_minimo) / range) * 100));
    }
    // At max level
    if (currentNivel && !nextNivel) return 100;
  }
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForNextLevel(level);
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  return Math.min(100, Math.max(0, progress));
}

export function getLevelTitle(level: number, niveis?: NivelConfig[]): string {
  if (niveis && niveis.length > 0) {
    const found = niveis.find(n => n.nivel === level);
    if (found) return found.nome;
    // Return highest level name if above max
    const max = niveis.reduce((a, b) => a.nivel > b.nivel ? a : b);
    if (level >= max.nivel) return max.nome;
  }
  // Fallback
  if (level >= 10) return 'Modo Lenda';
  if (level >= 9) return 'Fenômeno';
  if (level >= 8) return 'Lenda';
  if (level >= 7) return 'Gigante';
  if (level >= 6) return 'Monstro';
  if (level >= 5) return 'Craque';
  if (level >= 4) return 'Brabo';
  if (level >= 3) return 'Fera';
  if (level >= 2) return 'Promessa';
  return 'Cria';
}

export function getLevelIcon(level: number, niveis?: NivelConfig[]): string {
  if (niveis && niveis.length > 0) {
    const found = niveis.find(n => n.nivel === level);
    if (found) return found.icone;
    const max = niveis.reduce((a, b) => a.nivel > b.nivel ? a : b);
    if (level >= max.nivel) return max.icone;
  }
  return '⚽';
}

export function getLevelColor(level: number, niveis?: NivelConfig[]): string {
  if (niveis && niveis.length > 0) {
    const found = niveis.find(n => n.nivel === level);
    if (found) return found.cor;
    const max = niveis.reduce((a, b) => a.nivel > b.nivel ? a : b);
    if (level >= max.nivel) return max.cor;
  }
  return '#3b82f6';
}

export function getNextLevelXp(level: number, niveis?: NivelConfig[]): number {
  if (niveis && niveis.length > 0) {
    const next = niveis.find(n => n.nivel === level + 1);
    if (next) return next.xp_minimo;
    // At max level, return current xp_minimo as target
    const current = niveis.find(n => n.nivel === level);
    if (current) return current.xp_minimo;
  }
  return getXpForNextLevel(level);
}

// Pontuação por ação (fallback constants)
export const PONTOS_POR_ACAO = {
  convite_confirmado: 50,
  post_criado: 10,
  conexao_feita: 15,
  atividade_registrada: 20,
  perfil_completo: 30,
  primeiro_login: 5,
};

export function useNiveisConfig() {
  return useQuery({
    queryKey: ['gamificacao-niveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gamificacao_niveis' as any)
        .select('*')
        .order('nivel', { ascending: true });
      if (error) throw error;
      return (data as any as NivelConfig[]) || [];
    },
    staleTime: 1000 * 60 * 10, // 10 min cache
  });
}

export function usePontosTipoConfig() {
  return useQuery({
    queryKey: ['gamificacao-pontos-tipo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gamificacao_pontos_tipo' as any)
        .select('*')
        .order('pontos', { ascending: false });
      if (error) throw error;
      return (data as any as PontosTipoConfig[]) || [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useDesafiosAtivos() {
  return useQuery({
    queryKey: ['desafios-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('desafios_convite' as any)
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any as DesafioConvite[]) || [];
    },
  });
}

export function useDesafioProgresso(userId?: string) {
  return useQuery({
    queryKey: ['desafio-progresso', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('desafio_progresso' as any)
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return (data as any as DesafioProgresso[]) || [];
    },
    enabled: !!userId,
  });
}

export function useRanking(limit = 20) {
  return useQuery({
    queryKey: ['gamificacao-ranking', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_gamificacao' as any)
        .select('user_id, pontos_total, nivel, xp_atual, convites_confirmados')
        .order('pontos_total', { ascending: false })
        .limit(limit);
      if (error) throw error;

      // Enrich with profile names
      const enriched = await Promise.all(
        (data as any[] || []).map(async (u: any) => {
          // Try perfis_rede first (Carreira users)
          const { data: perfil } = await supabase
            .from('perfis_rede')
            .select('nome, foto_url, tipo')
            .eq('user_id', u.user_id)
            .maybeSingle();

          if (perfil) {
            return { ...u, nome: perfil.nome, foto_url: perfil.foto_url, tipo: perfil.tipo };
          }

          // Fallback to perfil_atleta
          const { data: atleta } = await supabase
            .from('perfil_atleta')
            .select('nome, foto_url')
            .eq('user_id', u.user_id)
            .maybeSingle();

          return { ...u, nome: atleta?.nome || 'Usuário', foto_url: atleta?.foto_url, tipo: 'atleta_filho' };
        })
      );

      return enriched;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useGamificacao(overrideUserId?: string) {
  // Support both AuthContext users (dashboard) and direct Supabase session (Carreira)
  const authContext = useAuth();
  const authUserId = authContext?.user?.id;

  // Use direct session as fallback when AuthContext has no user
  const { data: sessionUserId } = useQuery({
    queryKey: ['gamificacao-session-uid'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id || null;
    },
    enabled: !authUserId && !overrideUserId,
    staleTime: 1000 * 60 * 5,
  });

  const userId = overrideUserId || authUserId || sessionUserId || null;

  const { data: gamificacao, isLoading } = useQuery({
    queryKey: ['user-gamificacao', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('user_gamificacao' as any)
        .select('*')
        .eq('user_id', userId)
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
    enabled: !!userId,
  });

  const { data: badges } = useQuery({
    queryKey: ['user-badges', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_badges' as any)
        .select('*')
        .eq('user_id', userId)
        .order('conquistado_em', { ascending: false });
      if (error) throw error;
      return (data as any as Badge[]) || [];
    },
    enabled: !!userId,
  });

  const { data: historico } = useQuery({
    queryKey: ['pontos-historico', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('pontos_historico' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data as any as PontosHistorico[]) || [];
    },
    enabled: !!userId,
  });

  const { data: niveis } = useNiveisConfig();
  const { data: desafios } = useDesafiosAtivos();
  const { data: progresso } = useDesafioProgresso(userId || undefined);

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
    niveis: niveis || [],
    desafios: desafios || [],
    progresso: progresso || [],
    isLoading,
    userId,
  };
}
