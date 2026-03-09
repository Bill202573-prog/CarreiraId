import { useGamificacao, getLevelProgress, getLevelTitle, getLevelIcon, getLevelColor, getNextLevelXp } from '@/hooks/useGamificacaoData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Users, FileText, Activity, Zap, Gift, Medal, Target, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ACAO_ICONS: Record<string, React.ReactNode> = {
  convite_confirmado: <Users className="w-3.5 h-3.5" />,
  post_criado: <FileText className="w-3.5 h-3.5" />,
  conexao_feita: <Users className="w-3.5 h-3.5" />,
  atividade_registrada: <Activity className="w-3.5 h-3.5" />,
  perfil_completo: <Star className="w-3.5 h-3.5" />,
  desafio_completado: <Target className="w-3.5 h-3.5" />,
};

export function GamificacaoCard() {
  const { gamificacao, badges, historico, niveis, desafios, progresso, isLoading } = useGamificacao();

  if (isLoading) return null;

  const levelTitle = getLevelTitle(gamificacao.nivel, niveis);
  const levelIcon = getLevelIcon(gamificacao.nivel, niveis);
  const levelColor = getLevelColor(gamificacao.nivel, niveis);
  const progress = getLevelProgress(gamificacao.xp_atual, gamificacao.nivel, niveis);
  const xpNext = getNextLevelXp(gamificacao.nivel, niveis);

  // PlayStation-style trophy colors
  const trophyGradient = `linear-gradient(135deg, ${levelColor}, ${levelColor}dd)`;

  return (
    <div className="space-y-4">
      {/* Card principal - PlayStation Trophy Style */}
      <Card className="overflow-hidden" style={{ borderColor: levelColor + '50', borderWidth: 2, backgroundColor: 'hsl(0 0% 4%)' }}>
        {/* Top bar with gradient */}
        <div className="h-0.5" style={{ background: trophyGradient }} />
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-4 mb-4">
            {/* Level badge - PlayStation style */}
            <div className="relative">
              <div 
                className="flex items-center justify-center w-16 h-16 rounded-2xl text-3xl shadow-lg"
                style={{ 
                  background: trophyGradient,
                  boxShadow: `0 0 20px ${levelColor}40, 0 4px 12px rgba(0,0,0,0.3)`,
                }}
              >
                {levelIcon}
              </div>
              <div 
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2"
                style={{ backgroundColor: levelColor, borderColor: 'hsl(220 12% 8%)' }}
              >
                {gamificacao.nivel}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-foreground font-bold text-lg">{levelTitle}</span>
              </div>
              <p className="text-muted-foreground text-xs">
                {gamificacao.xp_atual.toLocaleString()} / {xpNext.toLocaleString()} XP
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1" style={{ color: levelColor }}>
                <Zap className="w-4 h-4" />
                <span className="font-bold text-lg">{gamificacao.pontos_total.toLocaleString()}</span>
              </div>
              <p className="text-muted-foreground text-[10px]">pontos</p>
            </div>
          </div>

          <Progress value={progress} className="h-2 bg-gray-800" />

          {/* Level progression bar */}
          {niveis.length > 0 && (
            <div className="flex items-center justify-between mt-2 px-0.5">
              {niveis.slice(0, 10).map((n) => (
                <div 
                  key={n.nivel} 
                  className="flex flex-col items-center"
                  title={`${n.nome} - ${n.xp_minimo} XP`}
                >
                  <span 
                    className="text-[10px] transition-all"
                    style={{ 
                      opacity: gamificacao.nivel >= n.nivel ? 1 : 0.3,
                      filter: gamificacao.nivel >= n.nivel ? 'none' : 'grayscale(1)',
                    }}
                  >
                    {n.icone}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Stats rápidos */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="text-center">
              <div className="text-foreground font-bold text-sm">{gamificacao.convites_confirmados}</div>
              <div className="text-muted-foreground text-[10px]">Convites</div>
            </div>
            <div className="text-center">
              <div className="text-foreground font-bold text-sm">{gamificacao.posts_criados}</div>
              <div className="text-muted-foreground text-[10px]">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-foreground font-bold text-sm">{gamificacao.conexoes_feitas}</div>
              <div className="text-muted-foreground text-[10px]">Conexões</div>
            </div>
            <div className="text-center">
              <div className="text-foreground font-bold text-sm">{gamificacao.atividades_registradas}</div>
              <div className="text-muted-foreground text-[10px]">Atividades</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desafios ativos */}
      {desafios.length > 0 && (
        <Card className="overflow-hidden" style={{ borderColor: `${levelColor}50`, borderWidth: 2, backgroundColor: 'hsl(0 0% 6%)' }}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: levelColor }} />
              Desafios Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {desafios.map((desafio) => {
                const prog = progresso.find(p => p.desafio_id === desafio.id);
                const pct = prog ? Math.min(100, (prog.progresso_atual / desafio.quantidade_meta) * 100) : 0;
                const completed = prog?.completado || false;

                return (
                  <div 
                    key={desafio.id} 
                    className="p-3 rounded-lg border"
                    style={{ 
                      borderColor: completed ? '#22c55e40' : desafio.cor + '30',
                      backgroundColor: completed ? '#22c55e08' : 'hsl(220 12% 12%)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{desafio.icone}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-xs font-semibold truncate">{desafio.titulo}</p>
                        {desafio.descricao && (
                          <p className="text-gray-500 text-[10px] truncate">{desafio.descricao}</p>
                        )}
                      </div>
                      <Badge 
                        className="text-[10px] border-0 shrink-0"
                        style={{ 
                          backgroundColor: completed ? '#22c55e20' : desafio.cor + '20', 
                          color: completed ? '#22c55e' : desafio.cor,
                        }}
                      >
                        {completed ? '✅ Completo' : `+${desafio.pontos_bonus} pts`}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-1.5 bg-gray-800 flex-1" />
                      <span className="text-gray-400 text-[10px] whitespace-nowrap">
                        {prog?.progresso_atual || 0}/{desafio.quantidade_meta}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badges conquistados */}
      {badges.length > 0 && (
        <Card className="border border-gray-800" style={{ backgroundColor: 'hsl(220 12% 10%)' }}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Medal className="w-4 h-4" style={{ color: levelColor }} />
              Conquistas ({badges.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-2">
              {badges.map((badge) => (
                <div 
                  key={badge.badge_tipo} 
                  className="flex flex-col items-center text-center p-2 rounded-lg"
                  style={{ backgroundColor: badge.badge_cor + '10', border: `1px solid ${badge.badge_cor}30` }}
                >
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
              <Star className="w-4 h-4" style={{ color: levelColor }} />
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
                  <span className="text-xs font-medium whitespace-nowrap ml-2" style={{ color: levelColor }}>+{item.pontos}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
