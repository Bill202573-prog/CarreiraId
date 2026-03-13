import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export function useCarreiraStats(criancaId: string | null | undefined) {
  const { data: gols } = useCarreiraGols(criancaId);
  const { data: amistosos } = useCarreiraAmistosos(criancaId);
  const { data: campeonatos } = useCarreiraCampeonatos(criancaId);
  const { data: premiacoes } = useCarreiraPremiacoes(criancaId);
  const { data: conquistas } = useCarreiraConquistas(criancaId);

  const totalGols = (gols || []).reduce((sum, g) => sum + g.quantidade, 0);

  // Count unique events (amistosos finalizados + orphan gol events)
  const amistososFinalizados = (amistosos || []).filter(a => a.evento?.status === 'finalizado' || a.evento?.status === 'realizado');
  const amistososEventIds = new Set(amistososFinalizados.map(a => a.evento_id));
  const orphanGolEventIds = new Set((gols || []).filter(g => !amistososEventIds.has(g.evento_id) && g.evento).map(g => g.evento_id));
  const uniqueCampeonatoIds = new Set((campeonatos || []).map(c => c.campeonato_id));

  const stats: CarreiraStats = {
    totalGols,
    totalJogos: amistososFinalizados.length + orphanGolEventIds.size,
    totalCampeonatos: uniqueCampeonatoIds.size,
    totalPremiacoes: (premiacoes || []).length,
    totalConquistas: (conquistas || []).length,
  };

  return stats;
}