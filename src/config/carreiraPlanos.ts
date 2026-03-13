export type CarreiraPlano = 'base' | 'competidor' | 'elite';

export interface PlanoLimites {
  jornada_mes: number;
  carreira_mes: number;
  posts_dia: number;
  video_seg: number;
  video_max_mb: number;
  youtube: boolean;
  selo_elite: boolean;
  ver_views: boolean;
  prioridade_busca: boolean;
  destaque_listagem: boolean;
  stats_avancadas: boolean;
  liga_conexoes: boolean;
}

export interface PlanoInfo {
  nome: string;
  preco: number; // 0 = free
  cor: string;
  icone: string;
  descricao: string;
  limites: PlanoLimites;
  destaques: string[];
}

export const PLANOS: Record<CarreiraPlano, PlanoInfo> = {
  base: {
    nome: 'Base',
    preco: 0,
    cor: '#6b7280',
    icone: '⚽',
    descricao: 'Comece sua jornada esportiva',
    limites: {
      jornada_mes: 1,
      carreira_mes: 1,
      posts_dia: 1,
      video_seg: 0,
      video_max_mb: 0,
      youtube: false,
      selo_elite: false,
      ver_views: false,
      prioridade_busca: false,
      destaque_listagem: false,
      stats_avancadas: false,
      liga_conexoes: true,
    },
    destaques: [
      'Perfil público do atleta (foto e informações básicas: posição, idade, pé dominante)',
      'Histórico de carreira (Escolinhas e Clubes) — 1 registro por mês',
      'Registro da Jornada — Participação em jogos e conquistas (1 por mês)',
      'Publicações no feed (texto e fotos) — 1 por dia',
      'Conexões na plataforma (atletas, escolas e clubes)',
      'Perfil visível para scouts, captadores e clubes',
      'Participação na comunidade e notificações da plataforma',
      'Participação na Liga de Conexões do Atleta',
    ],
  },
  competidor: {
    nome: 'Competidor',
    preco: 17.90,
    cor: '#f59e0b',
    icone: '🏆',
    descricao: 'Acelere sua carreira esportiva',
    limites: {
      jornada_mes: 3,
      carreira_mes: 3,
      posts_dia: 3,
      video_seg: 20,
      video_max_mb: 20,
      youtube: false,
      selo_elite: false,
      ver_views: false,
      prioridade_busca: false,
      destaque_listagem: false,
      stats_avancadas: false,
      liga_conexoes: true,
    },
    destaques: [
      'Tudo do Base',
      'Registro ampliado da Jornada (3 registros por mês)',
      'Histórico de carreira (Escolinhas e Clubes) — até 3 registros por mês',
      'Publicações com mais recursos (texto, foto e vídeos de até 20 segundos)',
      'Perfil esportivo mais completo (mais campos de informação e histórico)',
    ],
  },
  elite: {
    nome: 'Elite',
    preco: 29.90,
    cor: '#8b5cf6',
    icone: '👑',
    descricao: 'Máxima visibilidade e recursos',
    limites: {
      jornada_mes: 9999,
      carreira_mes: 9999,
      posts_dia: 99,
      video_seg: 60,
      video_max_mb: 40,
      youtube: true,
      selo_elite: true,
      ver_views: true,
      prioridade_busca: true,
      destaque_listagem: true,
      stats_avancadas: true,
      liga_conexoes: true,
    },
    destaques: [
      'Tudo do Competidor',
      'Registro ilimitado da Jornada Esportiva',
      'Publicações com mais recursos (texto, foto e vídeos de até 1 minuto)',
      'Publicação de vídeos da plataforma YouTube (treinos, jogos e highlights)',
      'Prioridade nas buscas para scouts e clubes',
      'Selo de perfil Elite',
      'Destaque em listagens de atletas',
      'Estatísticas avançadas',
      'Verifica quem visualizou o perfil',
      'Acesso antecipado a novos recursos da plataforma',
    ],
  },
};

/** Returns the minimum plan required for a given feature */
export function planoMinimoParaFeature(feature: keyof PlanoLimites): CarreiraPlano {
  if (PLANOS.base.limites[feature]) return 'base';
  if (PLANOS.competidor.limites[feature]) return 'competidor';
  return 'elite';
}

/** Returns plan hierarchy level (for comparison) */
export function planoNivel(plano: CarreiraPlano): number {
  return plano === 'base' ? 0 : plano === 'competidor' ? 1 : 2;
}

/** Check if current plan has access to required plan */
export function temAcessoAoPlano(atual: CarreiraPlano, requerido: CarreiraPlano): boolean {
  return planoNivel(atual) >= planoNivel(requerido);
}
