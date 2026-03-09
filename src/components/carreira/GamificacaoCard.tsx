import { useGamificacao, getLevelProgress, getLevelTitle, getXpForNextLevel, PONTOS_POR_ACAO } from '@/hooks/useGamificacaoData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Users, FileText, Activity, Zap, Gift, Medal } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ACAO_ICONS: Record<string, React.ReactNode> = {
  convite_confirmado: <Users className="w-3.5 h-3.5" />,
  post_criado: <FileText className="w-3.5 h-3.5" />,
  conexao_feita: <Users className="w-3.5 h-3.5" />,
  atividade_registrada: <Activity className="w-3.5 h-3.5" />,
  perfil_completo: <Star className="w-3.5 h-3.5" />,
};

export function GamificacaoCard() {
  const { gamificacao, badges, historico, isLoading } = useGamificacao();

  if (isLoading) return null;

  const progress = getLevelProgress(gamificacao.xp_atual, gamificacao.nivel);
  const xpNext = getXpForNextLevel(gamificacao.nivel);
  const levelTitle = getLevelTitle(gamificacao.nivel);

  return (
    <div className="space-y-4">
      {/* Card principal - Nível e XP */}
      <Card className="border-2 border-orange-500/30" style={{ backgroundColor: 'hsl(220 12% 10%)' }}>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-bold text-xl shadow-lg">
              {gamificacao.nivel}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-white font-bold text-lg">{levelTitle}</span>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">
                  Nível {gamificacao.nivel}
                </Badge>
              </div>
              <p className="text-gray-400 text-xs">
                {gamificacao.xp_atual} / {xpNext} XP para o próximo nível
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-orange-400">
                <Zap className="w-4 h-4" />
                <span className="font-bold text-lg">{gamificacao.pontos_total}</span>
              </div>
              <p className="text-gray-500 text-[10px]">pontos</p>
            </div>
          </div>

          <Progress value={progress} className="h-2 bg-gray-800" />

          {/* Stats rápidos */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="text-center">
              <div className="text-white font-bold text-sm">{gamificacao.convites_confirmados}</div>
              <div className="text-gray-500 text-[10px]">Convites</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-sm">{gamificacao.posts_criados}</div>
              <div className="text-gray-500 text-[10px]">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-sm">{gamificacao.conexoes_feitas}</div>
              <div className="text-gray-500 text-[10px]">Conexões</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-sm">{gamificacao.atividades_registradas}</div>
              <div className="text-gray-500 text-[10px]">Atividades</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Como ganhar pontos */}
      <Card className="border border-gray-800" style={{ backgroundColor: 'hsl(220 12% 10%)' }}>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Gift className="w-4 h-4 text-orange-400" />
            Como ganhar pontos
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {[
              { label: 'Convite confirmado', pts: PONTOS_POR_ACAO.convite_confirmado, icon: '🎯' },
              { label: 'Perfil completo', pts: PONTOS_POR_ACAO.perfil_completo, icon: '✅' },
              { label: 'Atividade registrada', pts: PONTOS_POR_ACAO.atividade_registrada, icon: '⚽' },
              { label: 'Conexão feita', pts: PONTOS_POR_ACAO.conexao_feita, icon: '🤝' },
              { label: 'Post criado', pts: PONTOS_POR_ACAO.post_criado, icon: '📝' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-800/50">
                <span className="text-gray-300 text-xs flex items-center gap-2">
                  <span>{item.icon}</span>
                  {item.label}
                </span>
                <Badge className="bg-orange-500/20 text-orange-400 border-0 text-[10px]">
                  +{item.pts} pts
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Badges conquistados */}
      {badges.length > 0 && (
        <Card className="border border-gray-800" style={{ backgroundColor: 'hsl(220 12% 10%)' }}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Medal className="w-4 h-4 text-orange-400" />
              Conquistas ({badges.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-2">
              {badges.map((badge) => (
                <div key={badge.badge_tipo} className="flex flex-col items-center text-center p-2 rounded-lg bg-gray-800/50">
                  <span className="text-2xl mb-1">{badge.badge_icone}</span>
                  <span className="text-white text-[10px] font-medium leading-tight">{badge.badge_nome}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico recente */}
      {historico.length > 0 && (
        <Card className="border border-gray-800" style={{ backgroundColor: 'hsl(220 12% 10%)' }}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-orange-400" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-1.5">
              {historico.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-800/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-400">{ACAO_ICONS[item.acao_tipo] || <Zap className="w-3.5 h-3.5" />}</span>
                    <span className="text-gray-300 text-xs truncate">{item.descricao}</span>
                  </div>
                  <span className="text-orange-400 text-xs font-medium whitespace-nowrap ml-2">+{item.pontos}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
