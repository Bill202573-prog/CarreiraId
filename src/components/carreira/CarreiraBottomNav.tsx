import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, User, LogOut, Gamepad2, Search, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { carreiraPath, isCarreiraDomain } from '@/hooks/useCarreiraBasePath';
import { useUnreadCarreiraComunicados } from '@/hooks/useCarreiraComunicadosData';

interface CarreiraBottomNavProps {
  currentUserId?: string | null;
  profileSlug?: string | null;
}

const SCOUTING_TYPES = ['tecnico', 'scout', 'agente_clube', 'escola_esportes', 'empresario'];

export function CarreiraBottomNav({ currentUserId, profileSlug }: CarreiraBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount: unreadComunicados } = useUnreadCarreiraComunicados();

  // Count pending connection requests
  const { data: pendingCount } = useQuery({
    queryKey: ['pending-connections-count', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return 0;
      const { count, error } = await supabase
        .from('rede_conexoes')
        .select('id', { count: 'exact', head: true })
        .eq('destinatario_id', currentUserId)
        .eq('status', 'pendente');
      if (error) return 0;
      return count || 0;
    },
    enabled: !!currentUserId,
  });

  // Check if user has a scouting profile type
  const { data: perfilRede } = useQuery({
    queryKey: ['nav-perfil-rede-tipo', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data } = await supabase
        .from('perfis_rede')
        .select('tipo')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!currentUserId,
  });

  const isScoutingProfile = perfilRede ? SCOUTING_TYPES.includes(perfilRede.tipo) : false;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Você saiu da sua conta');
    if (isCarreiraDomain()) {
      navigate(carreiraPath('/cadastro'), { replace: true });
    } else {
      navigate('/auth', { replace: true });
    }
  };

  const goToProfile = async () => {
    if (profileSlug) {
      navigate(carreiraPath(`/${profileSlug}`), { replace: true });
    } else if (currentUserId) {
      const { data: pa } = await supabase
        .from('perfil_atleta')
        .select('slug')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: pr } = await supabase
        .from('perfis_rede')
        .select('slug')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const foundSlug = pa?.slug || pr?.slug;
      if (foundSlug) navigate(carreiraPath(`/${foundSlug}`), { replace: true });
      else navigate(carreiraPath(`/perfil/${currentUserId}`), { replace: true });
    }
  };

  const feedPath = carreiraPath('/feed');
  const conexoesPath = carreiraPath('/conexoes');
  const gamerPath = carreiraPath('/gamer');
  const descobrirPath = carreiraPath('/descobrir');

  const baseItems = [
    {
      icon: Home,
      label: 'Feed',
      onClick: () => navigate(feedPath),
      active: location.pathname === feedPath || location.pathname === carreiraPath('/explorar'),
      badge: 0,
    },
    {
      icon: Users,
      label: 'Conexões',
      onClick: () => navigate(conexoesPath),
      active: location.pathname === conexoesPath,
      badge: (pendingCount || 0),
    },
  ];

  // Conditionally show Gamer OR Descobrir based on profile type
  const middleItem = isScoutingProfile
    ? {
        icon: Search,
        label: 'Descobrir',
        onClick: () => navigate(descobrirPath),
        active: location.pathname === descobrirPath,
        badge: 0,
      }
    : {
        icon: Gamepad2,
        label: 'Gamer',
        onClick: () => navigate(gamerPath),
        active: location.pathname === gamerPath,
        badge: 0,
      };

  const items = [
    ...baseItems,
    middleItem,
    {
      icon: User,
      label: 'Meu Perfil',
      onClick: goToProfile,
      active: !!profileSlug && location.pathname === carreiraPath(`/${profileSlug}`),
      badge: unreadComunicados || 0,
    },
    {
      icon: LogOut,
      label: 'Sair',
      onClick: handleLogout,
      active: false,
      badge: 0,
    },
  ];

  if (!currentUserId) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
              item.active
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-orange-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}