import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Zap, Share2, Gift } from 'lucide-react';
import { useGamificacao, getLevelProgress, getLevelTitle, getLevelIcon, getLevelColor, getNextLevelXp } from '@/hooks/useGamificacaoData';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function GamificacaoHeroCard() {
  const { user } = useAuth();
  const { gamificacao, niveis, isLoading } = useGamificacao();
  const [copied, setCopied] = useState(false);

  // Fetch perfil to get cor_destaque and convite_codigo
  const { data: perfil } = useQuery({
    queryKey: ['gamificacao-perfil', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      // Try perfil_atleta first
      const { data: pa } = await supabase
        .from('perfil_atleta')
        .select('cor_destaque, slug')
        .eq('user_id', user.id)
        .maybeSingle();
      // Then perfis_rede for convite_codigo
      const { data: pr } = await supabase
        .from('perfis_rede')
        .select('convite_codigo')
        .eq('user_id', user.id)
        .maybeSingle();
      return {
        cor_destaque: pa?.cor_destaque || '#3b82f6',
        convite_codigo: pr?.convite_codigo || null,
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading) return null;

  const accentColor = perfil?.cor_destaque || '#3b82f6';
  const levelTitle = getLevelTitle(gamificacao.nivel, niveis);
  const levelIcon = getLevelIcon(gamificacao.nivel, niveis);
  const levelColor = getLevelColor(gamificacao.nivel, niveis);
  const progress = getLevelProgress(gamificacao.xp_atual, gamificacao.nivel, niveis);
  const xpNext = getNextLevelXp(gamificacao.nivel, niveis);

  const inviteLink = perfil?.convite_codigo
    ? `${window.location.origin}/carreira/cadastro?ref=${perfil.convite_codigo}`
    : null;

  const handleCopyInvite = async () => {
    if (!inviteLink) {
      toast.error('Link de convite não encontrado');
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Junte-se ao Carreira ID!',
          text: 'Crie seu perfil esportivo e conecte-se com a comunidade!',
          url: inviteLink,
        });
      } else {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        toast.success('Link copiado!');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card
      className="overflow-hidden border-2 relative"
      style={{
        borderColor: accentColor + '40',
        backgroundColor: 'hsl(0 0% 4%)',
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-1"
        style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88, ${accentColor})` }}
      />

      <CardContent className="pt-5 pb-5 px-4">
        {/* Level display */}
        <div className="flex items-center gap-4 mb-5">
          {/* Level avatar */}
          <div className="relative">
            <div
              className="flex items-center justify-center w-[72px] h-[72px] rounded-2xl text-[34px] shadow-xl"
              style={{
                background: `linear-gradient(145deg, ${levelColor}, ${levelColor}cc)`,
                boxShadow: `0 0 24px ${levelColor}35, 0 6px 16px rgba(0,0,0,0.4)`,
              }}
            >
              {levelIcon}
            </div>
            <div
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white border-[2.5px]"
              style={{ backgroundColor: levelColor, borderColor: 'hsl(0 0% 4%)' }}
            >
              {gamificacao.nivel}
            </div>
          </div>

          {/* Level info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-lg leading-tight">{levelTitle}</p>
            <p className="text-[13px] mt-0.5" style={{ color: accentColor }}>
              Nível {gamificacao.nivel}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Zap className="w-3.5 h-3.5" style={{ color: levelColor }} />
              <span className="text-gray-400 text-xs">
                {gamificacao.xp_atual.toLocaleString()} / {xpNext.toLocaleString()} XP
              </span>
            </div>
          </div>

          {/* Points */}
          <div className="text-right">
            <div className="flex items-center gap-1" style={{ color: accentColor }}>
              <Zap className="w-4 h-4" />
              <span className="font-bold text-xl">{gamificacao.pontos_total.toLocaleString()}</span>
            </div>
            <p className="text-gray-500 text-[10px] mt-0.5">pontos</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative mb-2">
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: `${levelColor}15` }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${levelColor}99, ${levelColor})`,
                boxShadow: `0 0 8px ${levelColor}50`,
              }}
            />
          </div>
        </div>

        {/* Level progression icons */}
        {niveis.length > 0 && (
          <div className="flex items-center justify-between px-0.5 mb-5">
            {niveis.slice(0, 10).map((n) => {
              const isActive = gamificacao.nivel >= n.nivel;
              const isCurrent = gamificacao.nivel === n.nivel;
              return (
                <div
                  key={n.nivel}
                  className="flex flex-col items-center gap-0.5 transition-all duration-300"
                  title={`${n.nome} - ${n.xp_minimo} XP`}
                >
                  <span
                    className="text-sm transition-all duration-300"
                    style={{
                      opacity: isActive ? 1 : 0.25,
                      filter: isActive ? 'none' : 'grayscale(1)',
                      transform: isCurrent ? 'scale(1.3)' : 'scale(1)',
                    }}
                  >
                    {n.icone}
                  </span>
                  {isCurrent && (
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: levelColor }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { value: gamificacao.convites_confirmados, label: 'Convites' },
            { value: gamificacao.posts_criados, label: 'Posts' },
            { value: gamificacao.conexoes_feitas, label: 'Conexões' },
            { value: gamificacao.atividades_registradas, label: 'Atividades' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center py-2 rounded-lg"
              style={{ backgroundColor: `${accentColor}08`, border: `1px solid ${accentColor}15` }}
            >
              <div className="text-white font-bold text-sm">{stat.value}</div>
              <div className="text-gray-500 text-[10px]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Invite CTA button - pulsating */}
        <Button
          onClick={handleCopyInvite}
          className="w-full h-12 text-sm font-bold rounded-xl gap-2 border-0 text-white animate-pulse-soft"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
            boxShadow: `0 4px 20px ${accentColor}40, 0 0 40px ${accentColor}15`,
          }}
        >
          {copied ? (
            <>
              <Check className="w-5 h-5" />
              Link Copiado!
            </>
          ) : (
            <>
              <Gift className="w-5 h-5" />
              Convidar e Ganhar XP
              <Share2 className="w-4 h-4 ml-1 opacity-70" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
