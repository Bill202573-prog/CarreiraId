import { supabase } from '@/integrations/supabase/client';
import { PONTOS_POR_ACAO } from '@/hooks/useGamificacaoData';

// Função auxiliar para adicionar pontos a um usuário
export async function adicionarPontos(
  userId: string,
  acaoTipo: string,
  pontos: number,
  descricao: string,
  referenciaId?: string
) {
  try {
    const { error } = await supabase.rpc('adicionar_pontos', {
      p_user_id: userId,
      p_acao_tipo: acaoTipo,
      p_pontos: pontos,
      p_descricao: descricao,
      p_referencia_id: referenciaId,
    });
    
    if (error) {
      console.error('Erro ao adicionar pontos:', error);
    }
  } catch (error) {
    console.error('Erro ao adicionar pontos:', error);
  }
}

// Função auxiliar para dar badge a um usuário
export async function darBadge(
  userId: string,
  badgeTipo: string,
  badgeNome: string,
  badgeDescricao: string,
  badgeIcone = '🏆',
  badgeCor = '#3b82f6'
) {
  try {
    const { error } = await supabase.rpc('dar_badge', {
      p_user_id: userId,
      p_badge_tipo: badgeTipo,
      p_badge_nome: badgeNome,
      p_badge_descricao: badgeDescricao,
      p_badge_icone: badgeIcone,
      p_badge_cor: badgeCor,
    });
    
    if (error) {
      console.error('Erro ao dar badge:', error);
    }
  } catch (error) {
    console.error('Erro ao dar badge:', error);
  }
}

// Ações específicas que geram pontos
export const acoesPontos = {
  // Adicionar pontos por completar perfil
  async perfilCompleto(userId: string) {
    await adicionarPontos(
      userId,
      'perfil_completo',
      PONTOS_POR_ACAO.perfil_completo,
      'Perfil completado com todas as informações'
    );
    
    // Badge de perfil completo
    await darBadge(
      userId,
      'perfil_completo',
      'Perfil Completo',
      'Completou todas as informações do perfil',
      '✅',
      '#10b981'
    );
  },

  // Adicionar pontos por primeiro login
  async primeiroLogin(userId: string) {
    await adicionarPontos(
      userId,
      'primeiro_login',
      PONTOS_POR_ACAO.primeiro_login,
      'Primeiro acesso à plataforma'
    );
    
    // Badge de boas-vindas
    await darBadge(
      userId,
      'boas_vindas',
      'Bem-vindo!',
      'Fez o primeiro acesso ao Carreira ID',
      '👋',
      '#6366f1'
    );
  },

  // Adicionar pontos por registrar atividade externa
  async atividadeRegistrada(userId: string, atividadeId: string) {
    await adicionarPontos(
      userId,
      'atividade_registrada',
      PONTOS_POR_ACAO.atividade_registrada,
      'Nova atividade externa registrada',
      atividadeId
    );
  },

  // Adicionar pontos por fazer conexão
  async conexaoFeita(userId: string, conexaoId: string) {
    await adicionarPontos(
      userId,
      'conexao_feita',
      PONTOS_POR_ACAO.conexao_feita,
      'Nova conexão estabelecida',
      conexaoId
    );
  },
};

// Função para verificar e dar badges baseados em conquistas
export async function verificarBadgesConquistas(userId: string) {
  try {
    // Buscar dados de gamificação do usuário
    const { data: gamificacao } = await supabase
      .from('user_gamificacao' as any)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!gamificacao) return;

    // Badge de posts
    if (gamificacao.posts_criados >= 1) {
      await darBadge(
        userId,
        'primeiro_post',
        'Primeira Publicação',
        'Criou sua primeira publicação',
        '📝',
        '#8b5cf6'
      );
    }

    if (gamificacao.posts_criados >= 10) {
      await darBadge(
        userId,
        'comunicador',
        'Comunicador Ativo',
        'Criou 10 publicações na plataforma',
        '📢',
        '#06b6d4'
      );
    }

    // Badge de atividades
    if (gamificacao.atividades_registradas >= 1) {
      await darBadge(
        userId,
        'primeira_atividade',
        'Primeira Atividade',
        'Registrou sua primeira atividade externa',
        '⚽',
        '#22c55e'
      );
    }

    if (gamificacao.atividades_registradas >= 25) {
      await darBadge(
        userId,
        'atleta_dedicado',
        'Atleta Dedicado',
        'Registrou 25 atividades externas',
        '🏃',
        '#f59e0b'
      );
    }

    // Badge de conexões
    if (gamificacao.conexoes_feitas >= 1) {
      await darBadge(
        userId,
        'primeira_conexao',
        'Primeira Conexão',
        'Fez sua primeira conexão na rede',
        '🤝',
        '#3b82f6'
      );
    }

    if (gamificacao.conexoes_feitas >= 15) {
      await darBadge(
        userId,
        'networker',
        'Networker',
        'Estabeleceu 15 conexões na rede',
        '🕸️',
        '#ec4899'
      );
    }

  } catch (error) {
    console.error('Erro ao verificar badges:', error);
  }
}