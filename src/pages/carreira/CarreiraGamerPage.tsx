import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GamificacaoHeroCard } from '@/components/carreira/GamificacaoHeroCard';
import { ComoJogarButton } from '@/components/carreira/ComoJogarButton';
import { TutorialAutoShow } from '@/components/carreira/TutorialAutoShow';
import { TabelaPontos } from '@/components/carreira/TabelaPontos';
import { CarreiraBottomNav } from '@/components/carreira/CarreiraBottomNav';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trophy, User, Zap, TableProperties } from 'lucide-react';
import logoCarreira from '@/assets/logo-carreira-id-dark.png';
import { carreiraPath } from '@/hooks/useCarreiraBasePath';
import { useQuery } from '@tanstack/react-query';

function useRanking() {
  return useQuery({
    queryKey: ['gamificacao-ranking'],
    queryFn: async () => {
      const { data: gamData } = await supabase
        .from('user_gamificacao')
        .select('user_id, pontos_total, nivel')
        .order('pontos_total', { ascending: false })
        .limit(50);
      if (!gamData || gamData.length === 0) return [];

      const userIds = gamData.map(g => g.user_id);

      const { data: redeProfiles } = await supabase
        .from('perfis_rede')
        .select('user_id, nome, foto_url, slug')
        .in('user_id', userIds);
      const { data: atletaProfiles } = await supabase
        .from('perfil_atleta')
        .select('user_id, nome, foto_url, slug')
        .in('user_id', userIds);

      const redeMap = new Map((redeProfiles || []).map(p => [p.user_id, p]));
      const atletaMap = new Map((atletaProfiles || []).map(p => [p.user_id, p]));

      return gamData.map((g, idx) => {
        const rede = redeMap.get(g.user_id);
        const atleta = atletaMap.get(g.user_id);
        return {
          position: idx + 1,
          user_id: g.user_id,
          nome: rede?.nome || atleta?.nome || 'Usuário',
          foto_url: rede?.foto_url || atleta?.foto_url || null,
          slug: rede?.slug || atleta?.slug || null,
          pontos: g.pontos_total,
          nivel: g.nivel,
        };
      });
    },
  });
}

export default function CarreiraGamerPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [mySlug, setMySlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setCurrentUserId(uid);
      if (uid) {
        const { data: pa } = await supabase.from('perfil_atleta').select('slug').eq('user_id', uid).maybeSingle();
        const { data: pr } = await supabase.from('perfis_rede').select('slug').eq('user_id', uid).maybeSingle();
        setMySlug(pa?.slug || pr?.slug || null);
      }
      setLoading(false);
    });
  }, []);

  const { data: perfilData } = useQuery({
    queryKey: ['gamer-page-accent', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data: pa } = await supabase.from('perfil_atleta').select('cor_destaque').eq('user_id', currentUserId).maybeSingle();
      return { accentColor: pa?.cor_destaque || '#3b82f6' };
    },
    enabled: !!currentUserId,
  });

  const accentColor = perfilData?.accentColor || '#3b82f6';
  const { data: ranking } = useRanking();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-theme="dark-orange" style={{ background: 'hsl(0 0% 4%)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUserId) {
    navigate(carreiraPath('/cadastro'));
    return null;
  }

  const MEDAL_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];

  return (
    <div className="min-h-screen bg-background" data-theme="dark-orange">
      <div className="h-[2px] w-full" style={{ backgroundColor: accentColor }} />
      <header
        className="sticky top-0 z-50 bg-[hsl(0_0%_0%/0.97)]"
        style={{ borderBottom: `2px solid ${accentColor}50` }}
      >
        <div className="container flex items-center h-14 px-4 max-w-2xl">
          <Link to={carreiraPath('/feed')} className="flex items-center gap-2 shrink-0">
            <img src={logoCarreira} alt="Carreira" className="h-16 lg:h-20" />
          </Link>
          <h1 className="ml-4 text-lg font-semibold text-foreground">Gamer</h1>
          <div className="ml-auto">
            <ComoJogarButton variant="inline" accentColor={accentColor} />
          </div>
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-6 pb-24 space-y-4">
        <TutorialAutoShow tipoPerfil="atleta_filho" />
        <GamificacaoHeroCard accentColor={accentColor} />

        {/* Ranking */}
        {ranking && ranking.length > 0 && (
          <Card className="p-4" style={{ borderColor: `${accentColor}50`, borderWidth: 2 }}>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" style={{ color: accentColor }} />
              Ranking
            </h3>
            <div className="space-y-2">
              {ranking.map((player) => {
                const isMe = player.user_id === currentUserId;
                const medalColor = player.position <= 3 ? MEDAL_COLORS[player.position - 1] : undefined;
                return (
                  <div
                    key={player.user_id}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${isMe ? 'ring-1' : 'hover:bg-muted/50'}`}
                    style={isMe ? { backgroundColor: `${accentColor}10`, outline: `1px solid ${accentColor}` } : undefined}
                    onClick={() => player.slug && navigate(carreiraPath(`/${player.slug}`))}
                  >
                    {/* Position */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={medalColor
                        ? { backgroundColor: medalColor, color: '#000' }
                        : { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                      }
                    >
                      {player.position}
                    </div>

                    {/* Avatar */}
                    <Avatar className="w-8 h-8">
                      {player.foto_url ? <AvatarImage src={player.foto_url} className="object-cover" /> : null}
                      <AvatarFallback className="text-[10px]"><User className="w-3.5 h-3.5" /></AvatarFallback>
                    </Avatar>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{player.nome} {isMe && <span className="text-[10px] text-muted-foreground">(você)</span>}</p>
                      <p className="text-[10px] text-muted-foreground">Nível {player.nivel}</p>
                    </div>

                    {/* Points */}
                    <div className="flex items-center gap-1 shrink-0" style={{ color: accentColor }}>
                      <Zap className="w-3 h-3" />
                      <span className="text-xs font-bold">{player.pontos.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </main>

      <CarreiraBottomNav currentUserId={currentUserId} profileSlug={mySlug} />
    </div>
  );
}
