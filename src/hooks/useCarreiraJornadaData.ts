import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useJornada } from './useJornada';


// ========== Types ==========

export interface GolPublico {
  id: string;
  evento_id: string;
  crianca_id: string;
  quantidade: number;
  evento?: {
    id: string;
    nome: string;
    data: string;
    tipo: string;
    adversario: string | null;
    local: string | null;
    placar_time1: number | null;
    placar_time2: number | null;
    status: string;
  };
  time?: {
    id: string;
    nome: string;
  };
}

export interface AmistosoConvocacaoPublica {
  id: string;
  evento_id: string;
  crianca_id: string;
  status: string;
  presente: boolean | null;
  evento?: {
    id: string;
    nome: string;
    data: string;
    tipo: string;
    adversario: string | null;
    local: string | null;
    placar_time1: number | null;
    placar_time2: number | null;
    status: string;
  };
}

export interface CampeonatoConvocacaoPublica {
  id: string;
  campeonato_id: string;
  crianca_id: string;
  status: string;
  campeonato?: {
    id: string;
    nome: string;
    ano: number;
    categoria: string | null;
    status: string;
    nome_time: string | null;
    escolinha?: {
      id: string;
      nome: string;
    };
  };
}

export interface PremiacaoPublica {
  id: string;
  evento_id: string;
  crianca_id: string;
  tipo_premiacao: string;
  evento?: {
    id: string;
    nome: string;
    data: string;
    tipo: string;
  };
}

export interface ConquistaPublica {
  id: string;
  evento_id: string;
  escolinha_id: string;
  nome_campeonato: string;
  colocacao: string;
  ano: number;
  categoria: string | null;
}

export interface CarreiraStats {
  totalGols: number;
  totalJogos: number;
  totalCampeonatos: number;
  totalPremiacoes: number;
  totalConquistas: number;
}

// ========== Hooks ==========

export function useCarreiraGols(criancaId: string | null | undefined) {
  return useQuery({
    queryKey: ['carreira-gols', criancaId],
    queryFn: async () => {
      if (!criancaId) return [];

      const { data: syncData, error } = await supabase
        .from('evento_gols_sync')
        .select('*')
        .eq('crianca_id', criancaId);

      if (error) throw error;

      return (syncData || []).map((s: any) => ({
        id: s.id,
        evento_id: s.evento_id || s.atleta_id_gol_id,
        crianca_id: s.crianca_id,
        quantidade: s.quantidade,
        time: s.time_nome ? { id: s.time_id || s.id, nome: s.time_nome } : undefined,
        evento: {
          id: s.evento_id || s.atleta_id_gol_id,
          nome: s.evento_nome || 'Partida',
          data: s.evento_data || '',
          tipo: 'amistoso',
          adversario: s.evento_adversario || null,
          local: null,
          placar_time1: s.evento_placar_time1,
          placar_time2: s.evento_placar_time2,
          status: 'finalizado',
        },
      } as GolPublico));
    },
    enabled: !!criancaId,
  });
}

export function useCarreiraAmistosos(criancaId: string | null | undefined) {
  return useQuery({
    queryKey: ['carreira-amistosos', criancaId],
    queryFn: async () => {
      if (!criancaId) return [];

      const { data: syncData, error } = await supabase
        .from('amistoso_convocacoes_sync')
        .select('*')
        .eq('crianca_id', criancaId);

      if (error) throw error;

      return (syncData || []).map((s: any) => ({
        id: s.id,
        evento_id: s.atleta_id_convocacao_id,
        crianca_id: s.crianca_id,
        status: s.status || 'confirmado',
        presente: s.presente,
        evento: {
          id: s.atleta_id_convocacao_id,
          nome: s.evento_nome || 'Amistoso',
          data: s.evento_data || '',
          tipo: s.evento_tipo || 'amistoso',
          adversario: s.evento_adversario || null,
          local: s.evento_local || null,
          placar_time1: s.evento_placar_time1,
          placar_time2: s.evento_placar_time2,
          status: s.evento_status || 'finalizado',
        },
      } as AmistosoConvocacaoPublica));
    },
    enabled: !!criancaId,
  });
}

export function useCarreiraCampeonatos(criancaId: string | null | undefined) {
  return useQuery({
    queryKey: ['carreira-campeonatos', criancaId],
    queryFn: async () => {
      if (!criancaId) return [];

      const { data: syncData, error } = await supabase
        .from('campeonato_convocacoes_sync')
        .select('*')
        .eq('crianca_id', criancaId);

      if (error) throw error;

      return (syncData || []).map((s: any) => ({
        id: s.id,
        campeonato_id: s.atleta_id_convocacao_id,
        crianca_id: s.crianca_id,
        status: s.status || 'confirmado',
        campeonato: {
          id: s.atleta_id_convocacao_id,
          nome: s.campeonato_nome || 'Campeonato',
          ano: s.campeonato_ano || new Date().getFullYear(),
          categoria: s.campeonato_categoria || null,
          status: s.campeonato_status || 'em_andamento',
          nome_time: s.campeonato_nome_time || null,
          escolinha: s.escolinha_nome ? { id: s.id, nome: s.escolinha_nome } : undefined,
        },
      } as CampeonatoConvocacaoPublica));
    },
    enabled: !!criancaId,
  });
}

export function useCarreiraPremiacoes(criancaId: string | null | undefined) {
  return useQuery({
    queryKey: ['carreira-premiacoes', criancaId],
    queryFn: async () => {
      if (!criancaId) return [];

      const { data: syncData, error } = await supabase
        .from('evento_premiacoes_sync')
        .select('*')
        .eq('crianca_id', criancaId);

      if (error) throw error;

      return (syncData || []).map((s: any) => ({
        id: s.id,
        evento_id: s.evento_id || s.atleta_id_premiacao_id,
        crianca_id: s.crianca_id,
        tipo_premiacao: s.tipo_premiacao,
        evento: {
          id: s.evento_id || s.atleta_id_premiacao_id,
          nome: s.evento_nome || 'Evento',
          data: s.evento_data || '',
          tipo: 'amistoso',
        },
      } as PremiacaoPublica));
    },
    enabled: !!criancaId,
  });
}

export function useCarreiraConquistas(criancaId: string | null | undefined) {
  return useQuery({
    queryKey: ['carreira-conquistas', criancaId],
    queryFn: async () => {
      if (!criancaId) return [];

      const { data: syncData, error } = await supabase
        .from('conquistas_coletivas_sync')
        .select('*')
        .eq('crianca_id', criancaId);

      if (error) throw error;

      return (syncData || []).map((s: any) => ({
        id: s.id,
        evento_id: s.atleta_id_conquista_id,
        escolinha_id: '',
        nome_campeonato: s.titulo || s.evento_nome || 'Conquista',
        colocacao: s.tipo || 'Participação',
        ano: s.data ? new Date(s.data).getFullYear() : new Date().getFullYear(),
        categoria: s.descricao || null,
      } as ConquistaPublica));
    },
    enabled: !!criancaId,
  });
}

// ========== Aggregated Stats ==========

export interface CarreiraStatsExtended extends CarreiraStats {
  totalAssistencias: number;
  totalVitorias: number;
}

export interface UseCarreiraStatsResult {
  stats: CarreiraStatsExtended;
  anosDisponiveis: number[];
}

const yearOf = (s?: string | null): number | null => {
  if (!s) return null;
  const y = new Date(s).getFullYear();
  return Number.isFinite(y) ? y : null;
};

export function useCarreiraStats(
  criancaId: string | null | undefined,
  ano: number | 'todos' = 'todos',
): UseCarreiraStatsResult {
  const { data: gols } = useCarreiraGols(criancaId);
  const { data: amistosos } = useCarreiraAmistosos(criancaId);
  const { data: campeonatos } = useCarreiraCampeonatos(criancaId);
  const { data: premiacoes } = useCarreiraPremiacoes(criancaId);
  const { data: conquistas } = useCarreiraConquistas(criancaId);
  const jornada = useJornada(criancaId ?? null);

  // ===== Coletar anos disponíveis (de todas as fontes) =====
  const yearsSet = new Set<number>();
  (gols || []).forEach(g => { const y = yearOf(g.evento?.data); if (y) yearsSet.add(y); });
  (amistosos || []).forEach(a => { const y = yearOf(a.evento?.data); if (y) yearsSet.add(y); });
  (campeonatos || []).forEach(c => { if (c.campeonato?.ano) yearsSet.add(c.campeonato.ano); });
  (premiacoes || []).forEach(p => { const y = yearOf(p.evento?.data); if (y) yearsSet.add(y); });
  (conquistas || []).forEach(c => { if (c.ano) yearsSet.add(c.ano); });
  jornada.data.campeonatos.forEach((c: any) => { const y = yearOf(c.data_inicio); if (y) yearsSet.add(y); });
  jornada.data.amistosos.forEach((j: any) => { const y = yearOf(j.data_jogo); if (y) yearsSet.add(y); });
  jornada.data.campeonatos.forEach((c: any) => {
    (c.jogos || []).forEach((j: any) => { const y = yearOf(j.data_jogo); if (y) yearsSet.add(y); });
  });
  const anosDisponiveis = Array.from(yearsSet).sort((a, b) => b - a);

  const matchYear = (y: number | null | undefined) =>
    ano === 'todos' ? true : y === ano;

  // ===== Sync (escola) =====
  const golsFiltered = (gols || []).filter(g => matchYear(yearOf(g.evento?.data)));
  const amistososFiltered = (amistosos || []).filter(a => matchYear(yearOf(a.evento?.data)));
  const campeonatosFiltered = (campeonatos || []).filter(c => matchYear(c.campeonato?.ano ?? null));
  const premiacoesFiltered = (premiacoes || []).filter(p => matchYear(yearOf(p.evento?.data)));
  const conquistasFiltered = (conquistas || []).filter(c => matchYear(c.ano ?? null));

  const totalGolsSync = golsFiltered.reduce((sum, g) => sum + g.quantidade, 0);
  const amistososFinalizados = amistososFiltered.filter(a => a.evento?.status === 'finalizado' || a.evento?.status === 'realizado');
  const amistososEventIds = new Set(amistososFinalizados.map(a => a.evento_id));
  const orphanGolEventIds = new Set(golsFiltered.filter(g => !amistososEventIds.has(g.evento_id) && g.evento).map(g => g.evento_id));
  const uniqueCampeonatoIds = new Set(campeonatosFiltered.map(c => c.campeonato_id));

  // ===== Jornada própria (carreira_*) =====
  const jCampeonatos = jornada.data.campeonatos.filter((c: any) => matchYear(yearOf(c.data_inicio)));
  const jAmistosos = jornada.data.amistosos.filter((j: any) => matchYear(yearOf(j.data_jogo)));
  const jJogosCamp = jornada.data.campeonatos.flatMap((c: any) =>
    (c.jogos || []).filter((j: any) => matchYear(yearOf(j.data_jogo)))
  );
  const jAllJogos = [...jAmistosos, ...jJogosCamp];

  const jTotalGols = jAllJogos.reduce((s, j: any) => s + (j.gols_marcados || 0), 0);
  const jTotalAssist = jAllJogos.reduce((s, j: any) => s + (j.assistencias || 0), 0);
  const jTotalVitorias = jAllJogos.filter((j: any) =>
    j.placar_time_atleta != null && j.placar_adversario != null &&
    j.placar_time_atleta > j.placar_adversario
  ).length;
  const jTotalPremiacoes = jCampeonatos.reduce((s, c: any) => s + (c.premiacoes?.length || 0), 0);

  const stats: CarreiraStatsExtended = {
    totalGols: totalGolsSync + jTotalGols,
    totalJogos: amistososFinalizados.length + orphanGolEventIds.size + jAllJogos.length,
    totalCampeonatos: uniqueCampeonatoIds.size + jCampeonatos.length,
    totalPremiacoes: premiacoesFiltered.length + jTotalPremiacoes,
    totalConquistas: conquistasFiltered.length,
    totalAssistencias: jTotalAssist,
    totalVitorias: jTotalVitorias,
  };

  return { stats, anosDisponiveis };
}
