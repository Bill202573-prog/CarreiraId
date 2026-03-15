import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TabelaPontos } from '@/components/carreira/TabelaPontos';
import { CarreiraBottomNav } from '@/components/carreira/CarreiraBottomNav';
import { Card } from '@/components/ui/card';
import { ArrowLeft, TableProperties } from 'lucide-react';
import logoCarreira from '@/assets/logo-carreira-id-dark.png';
import { carreiraPath } from '@/hooks/useCarreiraBasePath';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function CarreiraGamerPontosPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const currentUserId = session?.user?.id ?? null;

  const { data: perfilData } = useQuery({
    queryKey: ['gamer-page-accent', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data: pa } = await supabase.from('perfil_atleta').select('cor_destaque, slug').eq('user_id', currentUserId).order('created_at', { ascending: true }).limit(1).maybeSingle();
      return { accentColor: pa?.cor_destaque || '#3b82f6', slug: pa?.slug || null };
    },
    enabled: !!currentUserId,
  });

  const accentColor = perfilData?.accentColor || '#3b82f6';

  if (!currentUserId) {
    navigate(carreiraPath('/cadastro'), { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background" data-theme="dark-orange">
      <div className="h-[2px] w-full" style={{ backgroundColor: accentColor }} />
      <header
        className="sticky top-0 z-50 bg-[hsl(0_0%_0%/0.97)]"
        style={{ borderBottom: `2px solid ${accentColor}50` }}
      >
        <div className="container flex items-center h-14 px-4 max-w-2xl">
          <button onClick={() => navigate(carreiraPath('/gamer'))} className="mr-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Link to={carreiraPath('/feed')} className="flex items-center gap-2 shrink-0">
            <img src={logoCarreira} alt="Carreira" className="h-16 lg:h-20" />
          </Link>
          <h1 className="ml-4 text-lg font-semibold text-foreground">Tabela de Pontos</h1>
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-6 pb-24">
        <Card className="p-4" style={{ borderColor: `${accentColor}50`, borderWidth: 2 }}>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TableProperties className="w-4 h-4" style={{ color: accentColor }} />
            Tabela de Pontos
          </h3>
          <TabelaPontos accentColor={accentColor} />
        </Card>
      </main>

      <CarreiraBottomNav currentUserId={currentUserId} profileSlug={perfilData?.slug || null} />
    </div>
  );
}
