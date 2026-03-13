export type CarreiraPlano = 'base' | 'competidor' | 'elite';

export interface PlanoLimites {
  jornada_mes: number;
  carreira_mes: number;
  posts_dia: number;
  video_seg: number;
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
    cor: '#6b7280', // gray
    icone: '⚽',
    descricao: 'Comece sua jornada esportiva',
    limites: {
      jornada_mes: 1,
      carreira_mes: 1,
      posts_dia: 1,
      video_seg: 0,
      youtube: false,
      selo_elite: false,
      ver_views: false,
      prioridade_busca: false,
      destaque_listagem: false,
      stats_avancadas: false,
      liga_conexoes: false,
    },
    destaques: [
      'Perfil público do atleta',
      '1 registro de jornada por mês',
      '1 publicação por dia',
      'Conexões na plataforma',
      'Visível para scouts e clubes',
    ],
  },
  competidor: {
    nome: 'Competidor',
    preco: 15.90,
    cor: '#f59e0b', // amber
    icone: '🏆',
    descricao: 'Acelere sua carreira esportiva',
    limites: {
      jornada_mes: 3,
      carreira_mes: 3,
      posts_dia: 3,
      video_seg: 20,
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
      '3 registros de jornada por mês',
      '3 registros de carreira por mês',
      'Vídeos de até 20 segundos',
      'Perfil esportivo completo',
      'Liga de Conexões do Atleta',
    ],
  },
  elite: {
    nome: 'Elite',
    preco: 29.90,
    cor: '#8b5cf6', // violet
    icone: '👑',
    descricao: 'Máxima visibilidade e recursos',
    limites: {
      jornada_mes: 9999,
      carreira_mes: 9999,
      posts_dia: 99,
      video_seg: 60,
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
      'Jornada ilimitada',
      'Vídeos de até 1 minuto',
      'Publicação de vídeos do YouTube',
      'Prioridade nas buscas',
      'Selo de perfil Elite',
      'Estatísticas avançadas',
      'Ver quem visualizou o perfil',
      'Acesso antecipado a novos recursos',
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
