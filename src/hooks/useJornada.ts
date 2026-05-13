import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  CreateCampeonatoInput,
  CreateJogoInput,
  CreateJogoMidiaInput,
  EstatisticasAtleta,
  JogoComMidia,
  JogoMidia,
  JornadaEsportivaData,
  PosicaoJogo,
} from '@/types/jornada-esportiva';

const EMPTY: JornadaEsportivaData = {
  campeonatos: [],
  amistosos: [],
  estatisticas: {
    totalJogos: 0,
    totalGols: 0,
    totalAssistencias: 0,
    totalVitorias: 0,
    totalCampeonatos: 0,
    posicoesMais: [],
  },
};

function mapMidia(row: any): JogoMidia {
  return {
    id: row.id,
    jogo_id: row.jogo_id,
    tipo_midia: row.tipo_midia,
    // Tabela usa coluna `url`; mantemos url_midia no tipo TS
    url_midia: row.url ?? row.url_midia ?? '',
    ordem: row.ordem ?? 0,
    created_at: row.created_at,
  };
}

export function useJornada(criancaId: string | undefined | null) {
  const [data, setData] = useState<JornadaEsportivaData>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!criancaId) {
      setData(EMPTY);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [campRes, jogosRes] = await Promise.all([
        (supabase as any)
          .from('carreira_campeonatos')
          .select('*')
          .eq('crianca_id', criancaId)
          .order('data_inicio', { ascending: false }),
        (supabase as any)
          .from('carreira_jogos')
          .select('*')
          .eq('crianca_id', criancaId)
          .order('data_jogo', { ascending: false }),
      ]);

      if (campRes.error) throw campRes.error;
      if (jogosRes.error) throw jogosRes.error;

      const campeonatos = campRes.data || [];
      const jogos = jogosRes.data || [];

      const jogoIds = jogos.map((j: any) => j.id);
      let midias: JogoMidia[] = [];
      if (jogoIds.length > 0) {
        const midiasRes = await (supabase as any)
          .from('carreira_jogo_midias')
          .select('*')
          .in('jogo_id', jogoIds)
          .order('ordem', { ascending: true });
        if (midiasRes.error) throw midiasRes.error;
        midias = (midiasRes.data || []).map(mapMidia);
      }

      const midiasByJogo = new Map<string, JogoMidia[]>();
      midias.forEach((m) => {
        const arr = midiasByJogo.get(m.jogo_id) || [];
        arr.push(m);
        midiasByJogo.set(m.jogo_id, arr);
      });

      const jogosComMidia: JogoComMidia[] = jogos.map((j: any) => ({
        ...j,
        midias: midiasByJogo.get(j.id) || [],
      }));

      const amistosos = jogosComMidia.filter((j) => !j.campeonato_id);
      const jogosByCampeonato = new Map<string, JogoComMidia[]>();
      jogosComMidia.forEach((j) => {
        if (!j.campeonato_id) return;
        const arr = jogosByCampeonato.get(j.campeonato_id) || [];
        arr.push(j);
        jogosByCampeonato.set(j.campeonato_id, arr);
      });

      const campeonatosComJogos = campeonatos.map((c: any) => {
        const cJogos = jogosByCampeonato.get(c.id) || [];
        const totalGols = cJogos.reduce((s, j) => s + (j.gols_marcados || 0), 0);
        const totalAssistencias = cJogos.reduce((s, j) => s + (j.assistencias || 0), 0);
        const totalVitorias = cJogos.filter(
          (j) =>
            (j.placar_time_atleta ?? 0) > (j.placar_adversario ?? 0) &&
            j.placar_time_atleta != null &&
            j.placar_adversario != null,
        ).length;
        return {
          ...c,
          jogos: cJogos,
          totalJogos: cJogos.length,
          totalGols,
          totalAssistencias,
          totalVitorias,
        };
      });

      // Stats
      const totalGols = jogosComMidia.reduce((s, j) => s + (j.gols_marcados || 0), 0);
      const totalAssistencias = jogosComMidia.reduce((s, j) => s + (j.assistencias || 0), 0);
      const totalVitorias = jogosComMidia.filter(
        (j) =>
          (j.placar_time_atleta ?? 0) > (j.placar_adversario ?? 0) &&
          j.placar_time_atleta != null &&
          j.placar_adversario != null,
      ).length;
      const posCount = new Map<PosicaoJogo, number>();
      jogosComMidia.forEach((j) => {
        if (j.posicao_jogo) posCount.set(j.posicao_jogo, (posCount.get(j.posicao_jogo) || 0) + 1);
      });
      const posicoesMais = Array.from(posCount.entries())
        .map(([posicao, vezes]) => ({ posicao, vezes }))
        .sort((a, b) => b.vezes - a.vezes);

      const estatisticas: EstatisticasAtleta = {
        totalJogos: jogosComMidia.length,
        totalGols,
        totalAssistencias,
        totalVitorias,
        totalCampeonatos: campeonatos.length,
        posicoesMais,
      };

      setData({ campeonatos: campeonatosComJogos, amistosos, estatisticas });
    } catch (e: any) {
      console.error('[useJornada] fetch error', e);
      setError(e.message || 'Erro ao carregar jornada');
    } finally {
      setIsLoading(false);
    }
  }, [criancaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const criarCampeonato = useCallback(
    async (input: CreateCampeonatoInput) => {
      if (!criancaId) throw new Error('Atleta não definido');
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('Não autenticado');
      const { error } = await (supabase as any).from('carreira_campeonatos').insert({
        crianca_id: criancaId,
        criado_por: uid,
        nome: input.nome,
        organizador: input.organizador,
        abrangencia: input.abrangencia,
        data_inicio: input.data_inicio,
        data_final: input.data_final,
      });
      if (error) throw error;
      await fetchData();
    },
    [criancaId, fetchData],
  );

  const criarJogo = useCallback(
    async (input: CreateJogoInput) => {
      if (!criancaId) throw new Error('Atleta não definido');
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('Não autenticado');
      const { error } = await (supabase as any).from('carreira_jogos').insert({
        crianca_id: criancaId,
        criado_por: uid,
        campeonato_id: input.campeonato_id || null,
        data_jogo: input.data_jogo,
        time_adversario: input.time_adversario,
        local: input.local,
        placar_time_atleta: input.placar_time_atleta,
        placar_adversario: input.placar_adversario,
        gols_marcados: input.gols_marcados,
        assistencias: input.assistencias,
        posicao_jogo: input.posicao_jogo,
        observacoes: input.observacoes,
        fase_campeonato: input.fase_campeonato,
      });
      if (error) throw error;
      await fetchData();
    },
    [criancaId, fetchData],
  );

  const adicionarMidia = useCallback(
    async (input: CreateJogoMidiaInput) => {
      const { error } = await (supabase as any).from('carreira_jogo_midias').insert({
        jogo_id: input.jogo_id,
        tipo_midia: input.tipo_midia,
        url: input.url_midia,
        ordem: input.ordem,
      });
      if (error) throw error;
      await fetchData();
    },
    [fetchData],
  );

  const excluirCampeonato = useCallback(
    async (id: string) => {
      const { error } = await (supabase as any).from('carreira_campeonatos').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    },
    [fetchData],
  );

  const excluirJogo = useCallback(
    async (id: string) => {
      // Mídias deletadas em cascata se FK existir; senão tentamos manualmente
      await (supabase as any).from('carreira_jogo_midias').delete().eq('jogo_id', id);
      const { error } = await (supabase as any).from('carreira_jogos').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    },
    [fetchData],
  );

  const excluirMidia = useCallback(
    async (id: string) => {
      const { error } = await (supabase as any).from('carreira_jogo_midias').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    },
    [fetchData],
  );

  return {
    data,
    isLoading,
    error,
    fetchData,
    criarCampeonato,
    criarJogo,
    adicionarMidia,
    excluirCampeonato,
    excluirJogo,
    excluirMidia,
  };
}
