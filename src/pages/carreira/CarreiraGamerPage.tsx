import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GamificacaoHeroCard } from '@/components/carreira/GamificacaoHeroCard';
import { ComoJogarButton } from '@/components/carreira/ComoJogarButton';
import { TutorialAutoShow } from '@/components/carreira/TutorialAutoShow';
import { CarreiraBottomNav } from '@/components/carreira/CarreiraBottomNav';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, User, Zap, TableProperties, ChevronRight } from 'lucide-react';
import logoCarreira from '@/assets/logo-carreira-id-dark.png';
import { carreiraPath } from '@/hooks/useCarreiraBasePath';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const currentUserId = session?.user?.id ?? null;

  const { data: perfilData } = useQuery({
    queryKey: ['gamer-page-accent', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data: pa } = await supabase.from('perfil_atleta').select('cor_destaque, slug').eq('user_id', currentUserId).order('created_at', { ascending: true }).limit(1).maybeSingle();
      const { data: pr } = await supabase.from('perfis_rede').select('slug').eq('user_id', currentUserId).order('created_at', { ascending: true }).limit(1).maybeSingle();
      return { accentColor: pa?.cor_destaque || '#3b82f6', slug: pa?.slug || pr?.slug || null };
    },
    enabled: !!currentUserId,
  });

  const accentColor = perfilData?.accentColor || '#3b82f6';
  const mySlug = perfilData?.slug || null;
  const { data: ranking } = useRanking();

  if (isLoading) {
    return <div className="min-h-screen bg-background" data-theme="dark-orange" />;
  }

  if (!currentUserId) {
    navigate(carreiraPath('/cadastro'), { replace: true });
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

        {/* Link para Tabela de Pontos */}
        <button
          onClick={() => navigate(carreiraPath('/gamer/pontos'))}
          className="w-full"
        >
          <Card
            className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer"
            style={{ borderColor: `${accentColor}50`, borderWidth: 2 }}
          >
            <div className="flex items-center gap-2">
              <TableProperties className="w-5 h-5" style={{ color: accentColor }} />
              <span className="text-sm font-semibold text-foreground">Tabela de Pontos</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Card>
        </button>

        {/* Ranking */}
        {ranking && ranking.length > 0 && (
          <Card className="p-4" style={{ borderColor: `${accentColor}50`, borderWidth: 2 }}>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" style={{ color: accentColor }} />
              Ranking
            </h3>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2 pr-2">
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
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={medalColor
                          ? { backgroundColor: medalColor, color: '#000' }
                          : { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                        }
                      >
                        {player.position}
                      </div>

                      <Avatar className="w-8 h-8">
                        {player.foto_url ? <AvatarImage src={player.foto_url} className="object-cover" /> : null}
                        <AvatarFallback className="text-[10px]"><User className="w-3.5 h-3.5" /></AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{player.nome} {isMe && <span className="text-[10px] text-muted-foreground">(você)</span>}</p>
                        <p className="text-[10px] text-muted-foreground">Nível {player.nivel}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" style={{ color: accentColor }}>
                        <Zap className="w-3 h-3" />
                        <span className="text-xs font-bold">{player.pontos.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        )}
      </main>

      <CarreiraBottomNav currentUserId={currentUserId} profileSlug={mySlug} />
    </div>
  );
}
