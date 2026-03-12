import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { carreiraPath } from '@/hooks/useCarreiraBasePath';

interface FansSectionProps {
  perfilAtletaId: string;
  accentColor?: string;
}

export function FansSection({ perfilAtletaId, accentColor = '#3b82f6' }: FansSectionProps) {
  const navigate = useNavigate();

  const { data: fans, isLoading } = useQuery({
    queryKey: ['perfil-fans', perfilAtletaId],
    queryFn: async () => {
      // Get followers from atleta_follows
      const { data: follows, error } = await supabase
        .from('atleta_follows')
        .select('follower_id, created_at')
        .eq('following_perfil_id', perfilAtletaId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      if (!follows || follows.length === 0) return [];

      const followerIds = follows.map(f => f.follower_id);

      // Get profile info for followers
      const { data: redeProfiles } = await supabase
        .from('perfis_rede')
        .select('user_id, nome, foto_url, tipo, slug')
        .in('user_id', followerIds);
      const { data: atletaProfiles } = await supabase
        .from('perfil_atleta')
        .select('user_id, nome, foto_url, slug')
        .in('user_id', followerIds);

      const redeMap = new Map((redeProfiles || []).map(p => [p.user_id, p]));
      const atletaMap = new Map((atletaProfiles || []).map(p => [p.user_id, p]));

      return follows.map(f => {
        const rede = redeMap.get(f.follower_id);
        const atleta = atletaMap.get(f.follower_id);
        return {
          user_id: f.follower_id,
          nome: rede?.nome || atleta?.nome || 'Usuário',
          foto_url: rede?.foto_url || atleta?.foto_url || null,
          tipo: rede?.tipo || 'atleta',
          slug: rede?.slug || atleta?.slug || null,
        };
      });
    },
    enabled: !!perfilAtletaId,
  });

  if (isLoading || !fans || fans.length === 0) return null;

  const TYPE_LABELS: Record<string, string> = {
    torcedor: 'Torcedor',
    professor: 'Professor',
    tecnico: 'Técnico',
    scout: 'Scout',
    pai_responsavel: 'Pai/Responsável',
    atleta: 'Atleta',
  };

  return (
    <Card className="p-4" style={{ borderColor: `${accentColor}50`, borderWidth: 2 }}>
      <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
        <Heart className="w-3.5 h-3.5" style={{ color: accentColor }} />
        Torcida ({fans.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {fans.slice(0, 12).map((fan) => (
          <div
            key={fan.user_id}
            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-1.5 transition-colors"
            onClick={() => navigate(carreiraPath(fan.slug ? `/${fan.slug}` : `/perfil/${fan.user_id}`))}
          >
            <Avatar className="w-8 h-8">
              {fan.foto_url ? (
                <AvatarImage src={fan.foto_url} alt={fan.nome} className="object-cover" />
              ) : null}
              <AvatarFallback className="text-[10px]">
                <User className="w-3.5 h-3.5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate max-w-[100px]">{fan.nome}</p>
              <p className="text-[10px] text-muted-foreground">{TYPE_LABELS[fan.tipo] || fan.tipo}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
